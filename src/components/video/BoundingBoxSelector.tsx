
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

interface BoundingBoxSelectorProps {
  videoUrl: string;
  onSelectionComplete: (selection: { x: number, y: number, width: number, height: number }) => void;
}

const BoundingBoxSelector = ({ videoUrl, onSelectionComplete }: BoundingBoxSelectorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        const video = videoRef.current!;
        const aspectRatio = video.videoWidth / video.videoHeight;
        
        let width = video.offsetWidth;
        let height = width / aspectRatio;
        
        // If height is too large for the container, scale down
        const maxHeight = 400;
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
        
        setVideoSize({ width, height });
        
        if (canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }
        
        setVideoLoaded(true);
      };
    }
  }, [videoUrl]);

  useEffect(() => {
    if (selection && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawCanvas(ctx);
      }
    }
  }, [selection]);

  const drawCanvas = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    
    if (selection) {
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      // Clear the selection area
      ctx.clearRect(selection.x, selection.y, selection.width, selection.height);
      
      // Draw border around selection
      ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
      
      // Draw corner handles
      const handleSize = 8;
      ctx.fillStyle = 'white';
      
      // Top-left
      ctx.fillRect(selection.x - handleSize/2, selection.y - handleSize/2, handleSize, handleSize);
      // Top-right
      ctx.fillRect(selection.x + selection.width - handleSize/2, selection.y - handleSize/2, handleSize, handleSize);
      // Bottom-left
      ctx.fillRect(selection.x - handleSize/2, selection.y + selection.height - handleSize/2, handleSize, handleSize);
      // Bottom-right
      ctx.fillRect(selection.x + selection.width - handleSize/2, selection.y + selection.height - handleSize/2, handleSize, handleSize);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPoint({ x, y });
    setEndPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setEndPoint({ x, y });
    
    const ctx = canvasRef.current!.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      // Calculate box coordinates
      const width = Math.abs(startPoint.x - x);
      const height = Math.abs(startPoint.y - y);
      const boxX = Math.min(startPoint.x, x);
      const boxY = Math.min(startPoint.y, y);
      
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      // Clear the selection area
      ctx.clearRect(boxX, boxY, width, height);
      
      // Draw border around selection
      ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, width, height);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate box coordinates
    const width = Math.abs(startPoint.x - x);
    const height = Math.abs(startPoint.y - y);
    const boxX = Math.min(startPoint.x, x);
    const boxY = Math.min(startPoint.y, y);
    
    // Only set selection if it has sufficient size
    if (width > 20 && height > 20) {
      const newSelection = {
        x: boxX,
        y: boxY,
        width: width,
        height: height
      };
      
      setSelection(newSelection);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setStartPoint({ x, y });
    setEndPoint({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setEndPoint({ x, y });
    
    const ctx = canvasRef.current!.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      // Calculate box coordinates
      const width = Math.abs(startPoint.x - x);
      const height = Math.abs(startPoint.y - y);
      const boxX = Math.min(startPoint.x, x);
      const boxY = Math.min(startPoint.y, y);
      
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      // Clear the selection area
      ctx.clearRect(boxX, boxY, width, height);
      
      // Draw border around selection
      ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, width, height);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const rect = canvasRef.current!.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Calculate box coordinates
    const width = Math.abs(startPoint.x - x);
    const height = Math.abs(startPoint.y - y);
    const boxX = Math.min(startPoint.x, x);
    const boxY = Math.min(startPoint.y, y);
    
    // Only set selection if it has sufficient size
    if (width > 20 && height > 20) {
      const newSelection = {
        x: boxX,
        y: boxY,
        width: width,
        height: height
      };
      
      setSelection(newSelection);
    }
  };

  const resetSelection = () => {
    setSelection(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const confirmSelection = () => {
    if (selection) {
      onSelectionComplete(selection);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-medium">Select the subject</h3>
        <p className="text-sm text-muted-foreground">
          Draw a box around the person in the video
        </p>
      </div>
      <div className="relative">
        <video 
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-[400px] object-contain"
          controls
          style={{ display: 'block' }}
        />
        {videoLoaded && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 cursor-crosshair touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              width: videoSize.width,
              height: videoSize.height,
              left: `calc(50% - ${videoSize.width / 2}px)`
            }}
          />
        )}
      </div>
      <div className="flex justify-between p-4">
        <Button
          variant="outline"
          onClick={resetSelection}
          className="flex items-center gap-2"
          disabled={!selection}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button
          onClick={confirmSelection}
          className="flex items-center gap-2"
          disabled={!selection}
        >
          <Check className="h-4 w-4" />
          Confirm Selection
        </Button>
      </div>
    </Card>
  );
};

export default BoundingBoxSelector;
