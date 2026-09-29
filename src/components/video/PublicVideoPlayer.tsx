import React from 'react';

interface PublicVideoPlayerProps {
  src: string;
  muted?: boolean;
  autoPlay?: boolean;
  className?: string;
}

const DEFAULT_CDN_FALLBACK = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnTheStreet.mp4';

export const PublicVideoPlayer: React.FC<PublicVideoPlayerProps> = ({
  src,
  muted = true,
  autoPlay = true,
  className = '',
}) => {
  return (
    <video
      src={src || DEFAULT_CDN_FALLBACK}
      muted={muted}
      autoPlay={autoPlay}
      loop
      playsInline
      controls={false}
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== DEFAULT_CDN_FALLBACK) {
          target.src = DEFAULT_CDN_FALLBACK;
          target.play().catch(() => {});
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={`w-full h-full object-contain ${className}`}
    />
  );
};
