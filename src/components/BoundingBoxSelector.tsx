import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from 'react';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoundingBoxSelectorProps {
  videoSrc: string;
  onBoundingBoxSelect: (box: BoundingBox) => void;
}

export const BoundingBoxSelector: React.FC<BoundingBoxSelectorProps> = ({
  videoSrc,
  onBoundingBoxSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.src = videoSrc;
    }
  }, [videoSrc]);

  const getMousePos = (canvas: HTMLCanvasElement, event: React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const drawBox = (box: BoundingBox) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !videoRef.current) return;

    // Clear and redraw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Draw bounding box
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, e);
    setIsDrawing(true);
    setStartPoint(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePos(canvas, e);
    const box = {
      x: Math.min(startPoint.x, pos.x),
      y: Math.min(startPoint.y, pos.y),
      width: Math.abs(pos.x - startPoint.x),
      height: Math.abs(pos.y - startPoint.y),
    };

    setCurrentBox(box);
    drawBox(box);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (currentBox) {
      onBoundingBoxSelect(currentBox);
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPaused(false);
    } else {
      videoRef.current.pause();
      setIsPaused(true);
    }
  };

  const updateCanvas = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx || !canvas || !video) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (currentBox) {
      drawBox(currentBox);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('play', () => {
      const drawFrame = () => {
        if (!video.paused && !video.ended) {
          updateCanvas();
          requestAnimationFrame(drawFrame);
        }
      };
      drawFrame();
    });
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="hidden"
        onLoadedMetadata={updateCanvas}
      />
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="border rounded-lg cursor-crosshair"
      />
      <div className="mt-4">
        <Button onClick={togglePlayPause}>
          {isPaused ? 'Play' : 'Pause'}
        </Button>
      </div>
    </div>
  );
}; 