import json
import numpy as np
from scipy.spatial.distance import cosine
from dtaidistance import dtw
import matplotlib.pyplot as plt
import os
from scipy.spatial.distance import euclidean
from fastdtw import fastdtw

def load_landmarks(filepath):
    """Load landmarks from JSON file with error handling and diagnostic logging"""
    try:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Landmark file not found: {filepath}")
            
        with open(filepath, 'r') as f:
            data = json.load(f)
            
        # Validate data structure
        if 'frames' not in data:
            raise ValueError("Invalid landmark file format: 'frames' key missing")
        
        # Add diagnostic information
        total_frames = len(data['frames'])
        frames_with_poses = sum(1 for frame in data['frames'] if frame.get('poses'))
        
        print(f"\nDiagnostic info for {os.path.basename(filepath)}:")
        print(f"Total frames: {total_frames}")
        print(f"Frames with poses: {frames_with_poses}")
        print(f"Percentage of frames with poses: {(frames_with_poses/total_frames)*100:.2f}%\n")
        
        if frames_with_poses == 0:
            print(f"WARNING: No poses detected in {filepath}")
            
        return data
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in landmark file: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Error loading landmarks: {str(e)}")

def extract_pose_sequence(landmarks_data):
    """Extract pose sequence with diagnostic logging"""
    try:
        sequences = []
        for frame_idx, frame in enumerate(landmarks_data.get('frames', [])):
            if frame.get('poses'):  # Use get() for safer access
                pose = frame['poses'][0]
                landmarks = []
                for lm in pose.get('landmarks', []):
                    try:
                        landmarks.extend([
                            float(lm.get('x', 0)),
                            float(lm.get('y', 0)),
                            float(lm.get('z', 0)),
                            float(lm.get('visibility', 0))
                        ])
                    except (TypeError, ValueError):
                        # Handle invalid landmark data
                        landmarks.extend([0.0, 0.0, 0.0, 0.0])
                
                sequences.append(landmarks)
        
        # Add diagnostic information
        print(f"Extracted sequence length: {len(sequences)}")
        if len(sequences) == 0:
            print("WARNING: No valid pose sequences extracted!")
        
        return np.array(sequences, dtype=np.float32)
        
    except Exception as e:
        print(f"Error in sequence extraction: {str(e)}")
        return np.array([])  # Return empty array on error

def calculate_pose_similarity(user_seq, ref_seq):
    """Calculate similarity between two pose sequences with better error handling"""
    results = {
        'frame_by_frame': [],
        'overall_similarity': 0.0,
        'timing_alignment': 0.0,
        'key_points_analysis': {}
    }
    
    # Add diagnostic information
    print("\nSequence Information:")
    print(f"User sequence shape: {user_seq.shape if len(user_seq) > 0 else 'Empty'}")
    print(f"Reference sequence shape: {ref_seq.shape if len(ref_seq) > 0 else 'Empty'}")
    
    if len(user_seq) == 0:
        print("ERROR: User sequence is empty - no poses detected")
        results['error'] = "No poses detected in user video"
        return results
        
    if len(ref_seq) == 0:
        print("ERROR: Reference sequence is empty - no poses detected")
        results['error'] = "No poses detected in reference video"
        return results
    
    # Normalize sequences to handle different scales
    user_seq_norm = user_seq / (np.linalg.norm(user_seq, axis=1, keepdims=True) + 1e-7)
    ref_seq_norm = ref_seq / (np.linalg.norm(ref_seq, axis=1, keepdims=True) + 1e-7)
    
    # Frame-by-frame similarity
    min_frames = min(len(user_seq), len(ref_seq))
    similarities = []
    for i in range(min_frames):
        if np.all(np.isfinite(user_seq_norm[i])) and np.all(np.isfinite(ref_seq_norm[i])):
            similarity = 1 - cosine(user_seq_norm[i], ref_seq_norm[i])
            similarities.append(similarity)
            results['frame_by_frame'].append({
                'frame': i,
                'similarity': float(similarity)
            })
    
    # Overall similarity (average of frame-by-frame)
    if similarities:
        results['overall_similarity'] = float(np.mean(similarities))
    
    # DTW for timing alignment
    try:
        # Use x,y,z coordinates
        user_coords = user_seq_norm[:, :3]  # Take x,y,z from first landmark
        ref_coords = ref_seq_norm[:, :3]
        
        # Calculate DTW distance using fastdtw
        distance, _ = fastdtw(user_coords, ref_coords, dist=euclidean)
        results['timing_alignment'] = float(1.0 / (1.0 + distance))
        
    except Exception as e:
        print(f"DTW calculation failed: {str(e)}")
        results['timing_alignment'] = 0.0
    
    # Analyze key body parts
    key_points = {
        'arms': [11, 13, 15, 12, 14, 16],  # shoulders, elbows, wrists
        'legs': [23, 25, 27, 24, 26, 28],  # hips, knees, ankles
        'torso': [11, 12, 23, 24],  # shoulders and hips
        'head': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]  # face landmarks
    }
    
    for part_name, indices in key_points.items():
        part_indices = []
        for idx in indices:
            part_indices.extend([idx * 4, idx * 4 + 1, idx * 4 + 2, idx * 4 + 3])
        
        user_part = user_seq_norm[:, part_indices]
        ref_part = ref_seq_norm[:, part_indices]
        
        # Calculate mean pose for each part
        user_part_mean = np.nanmean(user_part, axis=0)
        ref_part_mean = np.nanmean(ref_part, axis=0)
        
        # Replace NaN values with 0
        user_part_mean = np.nan_to_num(user_part_mean)
        ref_part_mean = np.nan_to_num(ref_part_mean)
        
        if np.all(np.isfinite(user_part_mean)) and np.all(np.isfinite(ref_part_mean)):
            similarity = 1 - cosine(user_part_mean, ref_part_mean)
            results['key_points_analysis'][part_name] = float(similarity)
        else:
            results['key_points_analysis'][part_name] = 0.0
    
    return results

def compare_videos(user_landmarks_path, ref_landmarks_path, output_dir=None):
    """Compare landmarks between user and reference videos"""
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
        
        # Plot frame-by-frame similarity
        plt.figure(figsize=(12, 6))
        plt.plot([f['similarity'] for f in comparison['frame_by_frame']])
        plt.title('Frame-by-Frame Pose Similarity')
        plt.xlabel('Frame')
        plt.ylabel('Similarity Score')
        plt.grid(True)
        plt.savefig(os.path.join(output_dir, 'similarity_graph.png'))
        plt.close()
        
        # Save detailed results
        with open(os.path.join(output_dir, 'comparison_results.json'), 'w') as f:
            json.dump(comparison, f, indent=2)
    
    return comparison

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Compare pose landmarks between two videos')
    parser.add_argument('user_landmarks', help='Path to user video landmarks JSON')
    parser.add_argument('ref_landmarks', help='Path to reference video landmarks JSON')
    parser.add_argument('--output', help='Output directory for visualizations')
    args = parser.parse_args()
    
    results = compare_videos(args.user_landmarks, args.ref_landmarks, args.output)
    
    print("\nComparison Results:")
    print("==================")
    print(f"Overall Similarity: {results['overall_similarity']:.2%}")
    print(f"Timing Alignment: {results['timing_alignment']:.2%}")
    print("\nKey Points Analysis:")
    for part, score in results['key_points_analysis'].items():
        print(f"- {part.title()}: {score:.2%}")
    
    if args.output:
        print(f"\nDetailed results and visualizations saved to: {args.output}") 