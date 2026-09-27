/**
 * Utility to reliably check if a given media URL is a video file.
 * Handles diverse file extensions, query params, hashes, and CDN video routes.
 */
export function isVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (!clean) return false;

  // Match common video extensions even if query parameters or hashes exist (e.g. video.mp4?v=123)
  if (/\.(mp4|webm|ogg|mov|m4v|mkv|avi)(\?.*)?$/i.test(clean)) {
    return true;
  }

  // Match CDN video endpoints or paths containing video indicators
  if (
    clean.includes('/video/upload/') ||
    clean.includes('/storage/v1/object/public/media/') && clean.includes('.mp4') ||
    clean.includes('.webm') ||
    clean.includes('.mov')
  ) {
    return true;
  }

  return false;
}
