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
  loop = false,
  muted = false,
  controls = true,
  id,
  onLoad,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.src !== src) {
      video.src = src;
      video.load();
    }

    const handleCanPlay = () => {
      if (onLoad) onLoad();
    };

    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [src, onLoad]);

  return (
    <div className="w-full h-full">
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${className}`}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        id={id}
      />
    </div>
  );
};

export default VideoPlayer;