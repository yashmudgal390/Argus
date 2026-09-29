import React, { useEffect, useRef } from 'react';

interface PublicVideoPlayerProps {
  src: string;
  muted?: boolean;
  autoPlay?: boolean;
  className?: string;
}

const PRIMARY_CDN_FALLBACK = 'https://vjs.zencdn.net/v/oceans.mp4';

export const PublicVideoPlayer: React.FC<PublicVideoPlayerProps> = ({
  src,
  muted = true,
  autoPlay = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeSrc = src || PRIMARY_CDN_FALLBACK;

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
      if (autoPlay) {
        video.play().catch(() => {});
      }
    }
  }, [activeSrc, muted, autoPlay]);

  return (
    <video
      ref={videoRef}
      src={activeSrc}
      muted={muted}
      autoPlay={autoPlay}
      loop
      playsInline
      controls={false}
      crossOrigin="anonymous"
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== PRIMARY_CDN_FALLBACK) {
          target.muted = true;
          target.src = PRIMARY_CDN_FALLBACK;
          target.load();
          target.play().catch(() => {});
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={`w-full h-full object-contain ${className}`}
    />
  );
};
