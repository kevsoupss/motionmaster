
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Camera, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

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
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

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

  const handleFileSelection = (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive"
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onVideoSelected(file, url);
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
        onVideoSelected(file, url);
        
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
      <div className="relative">
        {previewUrl ? (
          <div className="relative">
            <video 
              src={previewUrl} 
              controls 
              className="w-full h-full object-contain max-h-[400px]"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 rounded-full"
              onClick={clearVideo}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg transition-colors ${
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
              <div className="relative">
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
            if (e.target.files && e.target.files[0]) {
              handleFileSelection(e.target.files[0]);
            }
          }}
        />
      </div>
    </Card>
  );
};

export default VideoUpload;
