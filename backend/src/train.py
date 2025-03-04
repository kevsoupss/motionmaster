#@markdown To better demonstrate the Pose Landmarker API, we have created a set of visualization tools that will be used in this colab. These will draw the landmarks on a detect person, as well as the expected connections between those markers.

from mediapipe import solutions
from mediapipe.framework.formats import landmark_pb2
import numpy as np
import json
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import cv2
import os
import tempfile
from firebase_admin import storage
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend



def draw_landmarks_on_image(rgb_image, detection_result):
    pose_landmarks_list = detection_result.pose_landmarks
    annotated_image = np.copy(rgb_image)

    # Loop through the detected poses to visualize.
    for idx in range(len(pose_landmarks_list)):
        pose_landmarks = pose_landmarks_list[idx]

        # Draw the pose landmarks.
        pose_landmarks_proto = landmark_pb2.NormalizedLandmarkList()
        for landmark in pose_landmarks:
            landmark_proto = pose_landmarks_proto.landmark.add()  # Just call add() without arguments
            landmark_proto.x = landmark.x
            landmark_proto.y = landmark.y
            landmark_proto.z = landmark.z
            if hasattr(landmark, 'visibility'):
                landmark_proto.visibility = landmark.visibility

        solutions.drawing_utils.draw_landmarks(
            annotated_image,
            pose_landmarks_proto,
            solutions.pose.POSE_CONNECTIONS,
            solutions.drawing_styles.get_default_pose_landmarks_style())
    
    return annotated_image



def process_video(video_path, output_path, bbox=None, landmarks_path=None):
    """
    Process video with optional bounding box cropping
    bbox: tuple of (x, y, width, height) in pixels
    landmarks_path: path where to save the landmarks JSON file
    """
    # Create PoseLandmarker
    base_options = python.BaseOptions(model_asset_path='pose_landmarker_lite.task')
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        output_segmentation_masks=True,
        num_poses=5,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5
    )
    detector = vision.PoseLandmarker.create_from_options(options)
    
    # Open video file
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file")
    
    # Get video properties
    orig_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    orig_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    
    # Set output dimensions based on bbox if provided
    if bbox:
        x, y, width, height = bbox
        # Ensure bbox stays within video boundaries
        x = max(0, min(x, orig_width))
        y = max(0, min(y, orig_height))
        width = min(width, orig_width - x)
        height = min(height, orig_height - y)
        output_width, output_height = width, height
    else:
        output_width, output_height = orig_width, orig_height
        x, y = 0, 0
        width, height = orig_width, orig_height
    
    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (output_width, output_height))
    
    world_landmarks_data = {
        'fps': fps,
        'frames': [],
        'bbox': bbox if bbox else None,
        'video_path': video_path,
        'dimensions': {
            'original': {'width': orig_width, 'height': orig_height},
            'processed': {'width': output_width, 'height': output_height}
        }
    }
    
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Crop frame if bbox provided
        if bbox:
            frame = frame[y:y+height, x:x+width]
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Create MediaPipe image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # Detect poses
        detection_result = detector.detect(mp_image)
        
        # Store world landmarks for this frame
        frame_data = {
            'frame_id': frame_count,
            'timestamp': frame_count / fps,
            'poses': []
        }
        
        if detection_result.pose_world_landmarks:
            for pose_idx, pose_landmarks in enumerate(detection_result.pose_world_landmarks):
                pose_data = {
                    'pose_id': pose_idx,
                    'landmarks': []
                }
                for landmark_idx, landmark in enumerate(pose_landmarks):
                    pose_data['landmarks'].append({
                        'landmark_id': landmark_idx,
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z,
                        'visibility': landmark.visibility
                    })
                frame_data['poses'].append(pose_data)
        
        world_landmarks_data['frames'].append(frame_data)
        
        # Draw landmarks on the frame
        annotated_frame = draw_landmarks_on_image(mp_image.numpy_view(), detection_result)
        
        # Convert back to BGR for video writing
        output_frame = cv2.cvtColor(annotated_frame, cv2.COLOR_RGB2BGR)
        
        # Write frame
        out.write(output_frame)
        
        frame_count += 1
    
    # Release resources
    cap.release()
    out.release()
    
    # Save world landmarks to JSON file
    if landmarks_path:
        with open(landmarks_path, 'w') as f:
            json.dump(world_landmarks_data, f, indent=2)
    
    print(f"Video processing complete. Output saved to {output_path}")
    if landmarks_path:
        print(f"World landmarks saved to {landmarks_path}")
    
    return world_landmarks_data

def process_and_upload_comparison(json_data, bucket):
    """
    Process both user and reference videos and save landmarks locally
    
    Args:
        json_data: Dictionary containing video metadata and paths
        bucket: Firebase storage bucket instance (only used for processed videos)
    
    Returns:
        Dictionary containing results and local paths to landmark files
    """
    try:
        user_id = json_data['userId']
        results = {}
        
        # Create output directories if they don't exist
        output_dir = os.path.join(os.getcwd(), 'output', user_id)
        user_landmarks_dir = os.path.join(output_dir, 'user_landmarks')
        ref_landmarks_dir = os.path.join(output_dir, 'reference_landmarks')
        os.makedirs(user_landmarks_dir, exist_ok=True)
        os.makedirs(ref_landmarks_dir, exist_ok=True)
        
        # Create temporary directory for video processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Process user video
            if 'userVideo' in json_data:
                user_video = json_data['userVideo']
                user_output = os.path.join(temp_dir, f'processed_user_{user_id}.mp4')
                timestamp = json_data.get('timestamp', 'default')
                user_landmarks = os.path.join(user_landmarks_dir, f'landmarks_{timestamp}.json')
                user_bbox = (
                    int(user_video['x']),
                    int(user_video['y']),
                    int(user_video['width']),
                    int(user_video['height'])
                )
                
                # Process the video and get landmarks
                user_landmarks_data = process_video(
                    user_video['filePath'], 
                    user_output, 
                    user_bbox,
                    user_landmarks
                )
                
                # Upload only processed video to Firebase
                video_upload_path = f'processed_videos/{user_id}/user_video.mp4'
                video_blob = bucket.blob(video_upload_path)
                video_blob.upload_from_filename(user_output)
                video_blob.make_public()
                
                results['userVideo'] = {
                    'processedUrl': video_blob.public_url,
                    'landmarksPath': user_landmarks,  # Local file path
                    'bbox': user_bbox
                }
            
            # Process reference video
            if 'referenceVideo' in json_data:
                ref_video = json_data['referenceVideo']
                ref_output = os.path.join(temp_dir, f'processed_reference_{user_id}.mp4')
                timestamp = json_data.get('timestamp', 'default')
                ref_landmarks = os.path.join(ref_landmarks_dir, f'landmarks_{timestamp}.json')
                ref_bbox = (
                    int(ref_video['x']),
                    int(ref_video['y']),
                    int(ref_video['width']),
                    int(ref_video['height'])
                )
                
                # Process the video and get landmarks
                ref_landmarks_data = process_video(
                    ref_video['filePath'], 
                    ref_output, 
                    ref_bbox,
                    ref_landmarks
                )
                
                # Upload only processed video to Firebase
                video_upload_path = f'processed_videos/{user_id}/reference_video.mp4'
                video_blob = bucket.blob(video_upload_path)
                video_blob.upload_from_filename(ref_output)
                video_blob.make_public()
                
                results['referenceVideo'] = {
                    'processedUrl': video_blob.public_url,
                    'landmarksPath': ref_landmarks,  # Local file path
                    'bbox': ref_bbox
                }
        
        return {
            'status': 'success',
            'userId': user_id,
            'results': results,
            'timestamp': json_data.get('timestamp', None),
            'outputDirectory': output_dir
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
            'userId': json_data.get('userId', None)
        }

def main():
    import argparse
    
    # Create argument parser
    parser = argparse.ArgumentParser(description='Process video for pose detection')
    parser.add_argument('input_video', help='Path to the input video file')
    parser.add_argument('output_video', help='Path for the output video file')
    parser.add_argument('--bbox', nargs=4, type=int, metavar=('X', 'Y', 'WIDTH', 'HEIGHT'),
                      help='Bounding box coordinates (x y width height) in pixels')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Convert bbox to tuple if provided
    bbox = tuple(args.bbox) if args.bbox else None
    
    try:
        process_video(args.input_video, args.output_video, bbox)
    except Exception as e:
        print(f"Error processing video: {e}")

if __name__ == "__main__":
    main()

def compare_videos(user_landmarks_path, ref_landmarks_path, output_dir=None):
    try:
        # Load landmarks
        user_data = load_landmarks(user_landmarks_path)
        ref_data = load_landmarks(ref_landmarks_path)
        
        # Extract pose sequences
        user_seq = extract_pose_sequence(user_data)
        ref_seq = extract_pose_sequence(ref_data)
        
        # Calculate similarity
        comparison = calculate_pose_similarity(user_seq, ref_seq)
        
        # Generate visualization if output directory is provided
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            
            # Ensure proper cleanup of matplotlib resources
            plt.figure(figsize=(12, 6))
            try:
                plt.plot([f['similarity'] for f in comparison['frame_by_frame']])
                plt.title('Frame-by-Frame Pose Similarity')
                plt.xlabel('Frame')
                plt.ylabel('Similarity Score')
                plt.grid(True)
                plt.savefig(os.path.join(output_dir, 'similarity_graph.png'))
            finally:
                plt.close('all')  # Ensure all figures are closed
        
        return comparison
        
    except Exception as e:
        print(f"Error in compare_videos: {str(e)}")
        return {
            'overall_similarity': 0.0,
            'timing_alignment': 0.0,
            'key_points_analysis': {},
            'frame_by_frame': [],
            'error': str(e)
        }