import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  id?: string;
  onLoad?: () => void;
}

const VideoPlayer = ({
  src,
  className = "",
  autoPlay = false,
  loop = true,
  muted = false,
  controls = true,
  id,
  onLoad,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Only set source if it's changed
    if (video.src !== src) {
      video.src = src;
      video.load();
    }
    
    video.muted = muted;

    const handleCanPlay = () => {
      onLoad?.();
    };

    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [src, muted, onLoad]);

  return (
    <div className="relative w-full min-h-[300px] bg-white">
      <video
        ref={videoRef}
        className={`w-full h-full ${className}`}
        style={{
          objectFit: 'contain',
          minHeight: '300px',
          backgroundColor: 'white',
        }}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        preload="auto"
        id={id}
      />
    </div>
  );
};

export default VideoPlayer;