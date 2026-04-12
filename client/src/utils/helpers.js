/**
 * Format duration in seconds to human-readable string (Xh Xm)
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}`;
  return `${mins}m`;
}

/**
 * Format seconds to HH:MM:SS
 */
export function formatTimer(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format ISO date string to readable date
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format ISO date string to time only (HH:MM)
 */
export function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get elapsed time in seconds since a given date
 */
export function getElapsedSeconds(startTime) {
  return Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
}

/**
 * Get a map of category colors from an array of categories
 */
export function getCategoryColorMap(categories) {
  const map = {};
  categories.forEach(cat => {
    map[cat._id] = cat.color || '#6c757d';
  });
  return map;
}
