/**
 * Shared Date & Time Utilities for TRANSact Guard
 * Ensures strict UTC-to-Local conversion and accurate relative time calculation.
 */

/**
 * Safely parses an ISO date string from the API / database.
 * If the string represents UTC but lacks a trailing 'Z' or timezone offset,
 * 'Z' is automatically appended so JavaScript's Date parser converts it to
 * the user's local timezone rather than treating it as naive local time.
 */
export function parseUtcDate(isoString: string | null | undefined): Date {
  if (!isoString) return new Date();
  if (typeof isoString !== 'string') return new Date(isoString);
  const trimmed = isoString.trim();
  if (!trimmed) return new Date();
  if (!trimmed.endsWith('Z') && !trimmed.includes('+') && !trimmed.slice(-6).includes('-')) {
    return new Date(trimmed + 'Z');
  }
  return new Date(trimmed);
}

/**
 * Formats an ISO timestamp to local 24-hour time: HH:mm:ss
 * e.g., "21:11:45"
 */
export function formatLocalTime(isoString: string | null | undefined): string {
  if (!isoString) return '--:--:--';
  try {
    const d = parseUtcDate(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return String(isoString);
  }
}

/**
 * Formats an ISO timestamp to full localized date and time
 * e.g., "20 Nov 2026, 21:11:45"
 */
export function formatLocalDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '--';
  try {
    const d = parseUtcDate(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return String(isoString);
  }
}

/**
 * Formats an ISO timestamp into a relative human-friendly string
 * e.g., "Just now", "45s ago", "3m ago", "1h ago"
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const d = parseUtcDate(isoString);
    const now = new Date();
    const diffSeconds = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));

    if (diffSeconds < 30) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}
