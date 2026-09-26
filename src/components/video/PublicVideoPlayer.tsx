import React from 'react';

interface PublicVideoPlayerProps {
  src: string;
  muted?: boolean;
  autoPlay?: boolean;
  className?: string;
}

/**
 * A premium video player for streaming videos from the public folder.
 * - No timeline scrubber is shown (controls are hidden).
 * - No zoom functionality; the video fills its container with object-fit: contain.
 * - Loops indefinitely.
 * - Autoplay and optional mute for seamless playback.
 */
export const PublicVideoPlayer: React.FC<PublicVideoPlayerProps> = ({
  src,
  muted = true,
  autoPlay = true,
  className = '',
}) => {
  return (
    <video
      src={src}
      muted={muted}
      autoPlay={autoPlay}
      loop
      playsInline
      // Hide native controls to remove timeline and zoom UI
      controls={false}
      // Prevent user from right‑clicking to download or open in new tab
      onContextMenu={(e) => e.preventDefault()}
      className={`w-full h-full object-contain ${className}`}
    />
  );
};
