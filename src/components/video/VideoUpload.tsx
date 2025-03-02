import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Camera, X } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

interface VideoUploadProps {
  onVideoSelected: (file: File, url: string) => void;
  label: string;
  allowCamera?: boolean;
  className?: string;
}

const VideoUpload = ({ 
  onVideoSelected, 
  label, 
  allowCamera = true,
  className = ""
}: VideoUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onVideoSelected(file, url);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
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
        onVideoSelected(file, url);
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
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
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4 border-b">
        <h3 className="font-medium">{label}</h3>
        <p className="text-sm text-muted-foreground">
          Upload a video file or record from your camera
        </p>
      </div>

      <div className="relative min-h-[300px]">
        {previewUrl ? (
          <div className="relative w-full h-[300px]">
            {isRecording ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  muted
                  playsInline
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopRecording}
                  >
                    Stop Recording
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full">
                <VideoPlayer
                  src={previewUrl}
                  className="w-full h-full"
                  controls={true}
                />
              </div>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={clearVideo}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg h-[300px] ${
              dragActive ? "border-primary bg-primary/5" : "border-muted"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelection(file);
              }}
            />
            
            <div className="flex gap-4 mb-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Video
              </Button>

              {allowCamera && (
                <Button
                  variant="outline"
                  onClick={startRecording}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Record Video
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Or drag and drop a video file here
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VideoUpload;
