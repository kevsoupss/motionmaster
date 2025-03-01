import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, RotateCcw } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

interface BoundingBoxSelectorProps {
  videoUrl: string;
  onSelectionComplete: (selection: { x: number, y: number, width: number, height: number }) => void;
}

const BoundingBoxSelector = ({ videoUrl, onSelectionComplete }: BoundingBoxSelectorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [videoLoaded, setVideoLoaded] = useState(false);

  const drawCanvas = useCallback((ctx: CanvasRenderingContext2D, drawSelection?: { x: number, y: number, width: number, height: number }) => {
    if (!canvasRef.current) return;
    
    const { width, height } = canvasRef.current;
    ctx.clearRect(0, 0, width, height);
    
    const selectionToDraw = drawSelection || selection;
    if (selectionToDraw) {
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, width, height);
      
      // Clear the selection area
      ctx.clearRect(
        selectionToDraw.x,
        selectionToDraw.y,
        selectionToDraw.width,
        selectionToDraw.height
      );
      
      // Draw border around selection
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        selectionToDraw.x,
        selectionToDraw.y,
        selectionToDraw.width,
        selectionToDraw.height
      );
    }
  }, [selection]);

  const handleVideoLoad = useCallback(() => {
    // Wait a short moment to ensure video dimensions are available
    setTimeout(() => {
      const video = document.querySelector('video');
      if (!video || !containerRef.current) {
        console.log('Video or container not found');
        return;
      }

      console.log('Video dimensions:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        naturalWidth: (video as any).naturalWidth,
        naturalHeight: (video as any).naturalHeight,
        offsetWidth: video.offsetWidth,
        offsetHeight: video.offsetHeight
      });

      // Wait for video dimensions to be available
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('Video dimensions not yet available');
        return;
      }

      const containerWidth = containerRef.current.offsetWidth;
      const aspectRatio = video.videoWidth / video.videoHeight;
      
      let width = containerWidth;
      let height = width / aspectRatio;
      
      const maxHeight = 400;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Clear any existing content
          ctx.clearRect(0, 0, width, height);
          if (selection) {
            drawCanvas(ctx);
          }
        }
      }
      
      setVideoSize({ width, height });
      setVideoLoaded(true);
    }, 100); // Small delay to ensure video is ready
  }, [selection, drawCanvas]);

  // Add effect to handle video loading
  useEffect(() => {
    const video = document.querySelector('video');
    if (!video) return;

    const handleLoadedData = () => {
      console.log('Video data loaded');
      handleVideoLoad();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    
    // Also try to initialize if video is already loaded
    if (video.readyState >= 2) {
      handleVideoLoad();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [handleVideoLoad]);

  const getCanvasPoint = (e: MouseEvent | React.Touch) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (clientY - rect.top) * (canvasRef.current.height / rect.height);
    
    return {
      x: Math.max(0, Math.min(x, canvasRef.current.width)),
      y: Math.max(0, Math.min(y, canvasRef.current.height))
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    const point = getCanvasPoint('touches' in e ? e.touches[0] : e.nativeEvent);
    setStartPoint(point);
    setEndPoint(point);
    setSelection(null);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing || !canvasRef.current) return;
    
    const point = getCanvasPoint('touches' in e ? e.touches[0] : e.nativeEvent);
    setEndPoint(point);
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      const width = Math.abs(startPoint.x - point.x);
      const height = Math.abs(startPoint.y - point.y);
      const x = Math.min(startPoint.x, point.x);
      const y = Math.min(startPoint.y, point.y);
      
      drawCanvas(ctx, { x, y, width, height });
    }
  };

  const handleEnd = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const point = getCanvasPoint('changedTouches' in e ? e.changedTouches[0] : e.nativeEvent);
    
    const width = Math.abs(startPoint.x - point.x);
    const height = Math.abs(startPoint.y - point.y);
    
    if (width > 20 && height > 20) {
      const x = Math.min(startPoint.x, point.x);
      const y = Math.min(startPoint.y, point.y);
      const selection = { x, y, width, height };
      
      // Log the selection dimensions
      console.log('📦 Bounding Box Selected:', {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        aspectRatio: (width / height).toFixed(2),
        area: Math.round(width * height)
      });
      
      setSelection(selection);
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
      // Log the confirmed selection
      console.log('✅ Selection Confirmed:', {
        x: Math.round(selection.x),
        y: Math.round(selection.y),
        width: Math.round(selection.width),
        height: Math.round(selection.height),
        aspectRatio: (selection.width / selection.height).toFixed(2),
        area: Math.round(selection.width * selection.height)
      });
      
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
      <div className="relative" ref={containerRef}>
        <VideoPlayer
          src={videoUrl}
          className="w-full max-h-[400px] object-contain"
          onLoad={handleVideoLoad}
          controls={true}
          muted={true}
        />
        {videoLoaded && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 cursor-crosshair touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            style={{
              width: videoSize.width,
              height: videoSize.height,
              left: `calc(50% - ${videoSize.width / 2}px)`,
              pointerEvents: 'auto'
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
