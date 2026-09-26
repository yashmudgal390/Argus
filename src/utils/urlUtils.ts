// ═══════════════════════════════════════════════════
// URL Utility Helpers for Video Streaming & Drive Embeds
// ═══════════════════════════════════════════════════

/** High-definition fallback traffic video streams */
const TRAFFIC_VIDEO_STREAMS: Record<string, string> = {
  'cam-001': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'cam-002': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'cam-003': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'cam-004': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'cam-005': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'cam-006': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'cam-007': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback2012.mp4',
  'cam-008': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'cam-009': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
};

/** Get working direct streamable video URL */
export function getDirectVideoUrl(url: string, cameraId?: string): string {
  if (url && (url.endsWith('.mp4') || url.includes('.mp4?'))) {
    return url;
  }

  if (url && url.includes('drive.google.com') && url.includes('/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }

  if (cameraId && TRAFFIC_VIDEO_STREAMS[cameraId]) {
    return TRAFFIC_VIDEO_STREAMS[cameraId];
  }

  return TRAFFIC_VIDEO_STREAMS['cam-001'];
}

/** Extract Google Drive embed preview URL for iframe player */
export function getDriveEmbedUrl(url: string): string | null {
  if (!url || !url.includes('drive.google.com')) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return null;
}
