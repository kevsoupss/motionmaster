from flask import Flask, jsonify, request
from train import process_video, process_and_upload_comparison
import os
import tempfile
import firebase_admin
from firebase_admin import credentials, storage, db
import logging
import requests
from compare_landmarks import compare_videos
from datetime import datetime
from flask_cors import CORS
from werkzeug.exceptions import NotFound

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure output folder
OUTPUT_FOLDER = 'outputs'
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Initialize Firebase Admin SDK
try:
    service_account_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
    if not os.path.exists(service_account_path):
        raise FileNotFoundError(f"Firebase credentials file not found at {service_account_path}")
    
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'motionmaster-fa7ea.firebasestorage.app',  # Updated bucket name
        'databaseURL': 'https://motionmaster-fa7ea.firebaseio.com'
    })
    bucket = storage.bucket()
    logger.info("Firebase initialized successfully")
    
    # Test bucket connection
    try:
        bucket.exists()
        logger.info("Successfully connected to Firebase Storage bucket")
    except Exception as e:
        logger.error(f"Failed to connect to Firebase Storage bucket: {str(e)}")
        raise
        
except Exception as e:
    logger.error(f"Failed to initialize Firebase: {str(e)}")
    raise

# Sample endpoint
@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({
        'message': 'Hello, World!',
        'status': 'success'
    })

@app.route('/api/test', methods=['GET'])
def test_connection():
    """Test endpoint to verify API and Firebase connection"""
    try:
        # Test Firebase Storage connection
        bucket.exists()
        return jsonify({
            'status': 'success',
            'message': 'API and Firebase connection successful',
            'bucket': bucket.name,
            'firebase_initialized': True
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'firebase_initialized': False
        }), 500

def download_from_firebase(file_path):
    """Download video from Firebase Storage using file path"""
    try:
        logger.info(f"Starting download of {file_path}")
        
        # Create a temporary file
        temp_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
        
        # Get the blob using the file path directly
        blob = bucket.blob(file_path)
        
        if not blob.exists():
            logger.error(f"File {file_path} not found in Firebase Storage")
            return None
            
        blob.download_to_filename(temp_file.name)
        file_size = os.path.getsize(temp_file.name)
        logger.info(f"Successfully downloaded {file_path} ({file_size} bytes)")
        
        return temp_file.name
    except Exception as e:
        logger.error(f"Error downloading from Firebase: {str(e)}")
        return None

def download_video(url, output_path):
    """Download video from URL to local path"""
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    with open(output_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    return output_path

@app.route('/api/train', methods=['POST'])
def train_endpoint():
    try:
        logger.info("Starting /api/train endpoint processing")
        json_data = request.get_json()
        
        if not json_data:
            logger.error("No JSON data provided")
            return jsonify({
                'status': 'error',
                'error': 'No JSON data provided'
            }), 400
        
        logger.info(f"Processing request for user: {json_data.get('userId')}")
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            logger.info(f"Created temporary directory: {temp_dir}")
            
            # Download videos
            user_video_path = os.path.join(temp_dir, 'user_video.mp4')
            ref_video_path = os.path.join(temp_dir, 'reference_video.mp4')
            
            logger.info("Downloading user video...")
            download_video(json_data['userVideo']['videoUrl'], user_video_path)
            logger.info("Downloading reference video...")
            download_video(json_data['referenceVideo']['videoUrl'], ref_video_path)
            
            # Update file paths in JSON data
            json_data['userVideo']['filePath'] = user_video_path
            json_data['referenceVideo']['filePath'] = ref_video_path
            
            # Process videos and generate landmarks
            logger.info("Processing videos and generating landmarks...")
            processing_result = process_and_upload_comparison(json_data, bucket)
            
            if processing_result['status'] != 'success':
                logger.error(f"Processing failed: {processing_result.get('error')}")
                return jsonify(processing_result), 500
            
            # Get paths to landmark files
            user_landmarks = processing_result['results']['userVideo']['landmarksPath']
            ref_landmarks = processing_result['results']['referenceVideo']['landmarksPath']
            
            logger.info(f"User landmarks path: {user_landmarks}")
            logger.info(f"Reference landmarks path: {ref_landmarks}")
            
            # Create comparison output directory
            comparison_dir = os.path.join(processing_result['outputDirectory'], 'comparison')
            os.makedirs(comparison_dir, exist_ok=True)
            
            # Compare landmarks
            logger.info("Comparing landmarks...")
            try:
                comparison_results = compare_videos(
                    user_landmarks,
                    ref_landmarks,
                    output_dir=comparison_dir
                )
                logger.info("Landmark comparison completed successfully")
            except Exception as e:
                logger.error(f"Error during landmark comparison: {str(e)}")
                raise
            
            # Upload comparison results to Firebase Storage
            try:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                comparison_path = f'comparison_results/{json_data["userId"]}/{timestamp}'
                
                logger.info("Uploading comparison results to Firebase...")
                
                # Upload comparison graph
                graph_blob = bucket.blob(f'{comparison_path}/similarity_graph.png')
                graph_blob.upload_from_filename(os.path.join(comparison_dir, 'similarity_graph.png'))
                graph_blob.make_public()
                
                # Upload detailed results JSON
                results_blob = bucket.blob(f'{comparison_path}/comparison_results.json')
                results_blob.upload_from_filename(os.path.join(comparison_dir, 'comparison_results.json'))
                results_blob.make_public()
                
                logger.info("Successfully uploaded comparison results to Firebase")
                
            except Exception as e:
                logger.error(f"Error uploading comparison results: {str(e)}")
                raise
            
            # Prepare response
            response = {
                'status': 'success',
                'userId': json_data['userId'],
                'timestamp': timestamp,
                'comparison': {
                    'overall_similarity': comparison_results['overall_similarity'],
                    'timing_alignment': comparison_results['timing_alignment'],
                    'key_points_analysis': comparison_results['key_points_analysis']
                },
                'videos': {
                    'user': {
                        'processed': processing_result['results']['userVideo']['processedUrl'],
                        'landmarks': processing_result['results']['userVideo']['landmarksPath']
                    },
                    'reference': {
                        'processed': processing_result['results']['referenceVideo']['processedUrl'],
                        'landmarks': processing_result['results']['referenceVideo']['landmarksPath']
                    }
                },
                'artifacts': {
                    'similarity_graph': graph_blob.public_url,
                    'detailed_results': results_blob.public_url
                }
            }
            
            logger.info("Successfully prepared response")
            return jsonify(response)
            
    except Exception as e:
        logger.error(f"Error in train_endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint not found',
        'error': str(e)
    }), 404

@app.errorhandler(Exception)
def handle_error(e):
    logger.error(f"Unhandled exception: {str(e)}")
    return jsonify({
        'status': 'error',
        'message': 'Internal server error',
        'error': str(e)
    }), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)
