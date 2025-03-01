import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Camera, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import VideoPlayer from "./VideoPlayer";

interface VideoUploadProps {
  onVideoSelected: (file: File, url: string) => void;
  label: string;
  allowCamera?: boolean;
  className?: string;
}

const VALID_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',  // MOV files
  'video/webm',
  'video/x-msvideo',  // AVI files
  'video/x-m4v'       // M4V files
];

const VideoUpload = ({ 
  onVideoSelected, 
  label, 
  allowCamera = true,
  className = ""
}: VideoUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [previewUrl]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const convertMovToMp4 = async (file: File): Promise<{ file: File, url: string }> => {
    try {
      // Keep the original MIME type for MOV files
      const url = URL.createObjectURL(file);
      
      // Validate that the video is playable
      await new Promise<void>((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', handleLoad);
          video.removeEventListener('error', handleError);
        };

        const handleLoad = () => {
          cleanup();
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            resolve();
          } else {
            reject(new Error('Invalid video dimensions'));
          }
        };

        const handleError = () => {
          cleanup();
          reject(new Error('Failed to load video'));
        };

        video.addEventListener('loadedmetadata', handleLoad);
        video.addEventListener('error', handleError);
        video.src = url;
      });

      return { 
        file: file,  // Keep the original file
        url: url 
      };
    } catch (error) {
      console.error('Error processing video:', error);
      throw new Error('Failed to process video');
    }
  };

  const validateVideo = (url: string) => {
    console.log('🟡 Starting video validation');
    return new Promise<void>((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        console.log('🟢 Video metadata loaded:', {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          readyState: video.readyState
        });
        
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.log('🔴 Invalid video dimensions');
          reject(new Error('Invalid video dimensions'));
          return;
        }
        console.log('🟢 Video dimensions are valid');
        resolve();
      };

      video.onerror = (e) => {
        console.log('🔴 Video validation error:', e);
        reject(new Error('Failed to load video'));
      };

      console.log('🟡 Setting video source:', url);
      video.src = url;
    });
  };

  const handleFileSelection = async (file: File) => {
    console.log('🟢 handleFileSelection called with file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Clean up previous preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    try {
      console.log('🟡 Checking file type validity');
      const actualType = file.type;
      const isValidType = VALID_VIDEO_TYPES.includes(actualType);
      
      console.log('🟡 MIME type check:', { actualType, isValid: isValidType });
      
      if (!isValidType) {
        throw new Error(`Invalid file type: ${actualType}`);
      }

      console.log('🟢 File type is valid, proceeding with upload');

      let fileToUse = file;
      let url: string;

      // Convert MOV files using the proper conversion function
      if (file.name.toLowerCase().endsWith('.mov')) {
        console.log('🟡 Converting MOV file to MP4...');
        const converted = await convertMovToMp4(file);
        fileToUse = converted.file;
        url = converted.url;
        console.log('🟢 Successfully converted MOV to MP4');
      } else {
        url = URL.createObjectURL(file);
      }
      
      console.log('🟢 Created object URL:', url);

      // Validate the video before setting it
      await validateVideo(url);
      console.log('🟢 Video validation successful');

      setPreviewUrl(url);
      setSelectedFile(fileToUse);
      setError(null);

      if (onVideoSelected) {
        onVideoSelected(fileToUse, url);
      }
    } catch (err) {
      console.error('🔴 Error handling file selection:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setPreviewUrl(null);
      setSelectedFile(null);
      toast({
        title: "Error loading video",
        description: err instanceof Error ? err.message : "Failed to load video file",
        variant: "destructive"
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        
        const file = new File([blob], "recorded-video.webm", { type: 'video/webm' });
        handleFileSelection(file);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera access error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearVideo = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${className}`}>
      <div className="relative min-h-[300px]">
        {previewUrl ? (
          <div className="relative w-full">
            <VideoPlayer
              src={previewUrl}
              className="w-full max-h-[400px]"
              muted={false}
              controls={true}
              autoPlay={false}
              loop={true}
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 rounded-full z-10"
              onClick={clearVideo}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg transition-colors min-h-[300px] ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isRecording ? (
              <div className="relative w-full">
                <video 
                  ref={videoRef} 
                  className="w-full max-h-[400px] rounded-lg"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button 
                    onClick={stopRecording}
                    variant="destructive"
                    className="animate-pulse"
                  >
                    Stop Recording
                  </Button>
                </div>
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                    Recording
                  </div>
                </div>
              </div>
            ) : (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-center">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-1">{label}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Drag and drop your video here, or click to browse
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Video
                    </Button>
                    
                    {allowCamera && (
                      <Button
                        variant="outline"
                        onClick={startRecording}
                        className="flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Record Video
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            console.log('🟢 File input onChange triggered');
            if (e.target.files && e.target.files[0]) {
              console.log('🟢 File selected:', e.target.files[0].name);
              handleFileSelection(e.target.files[0]);
            } else {
              console.log('🔴 No file selected');
            }
          }}
        />
      </div>
    </Card>
  );
};

export default VideoUpload;
