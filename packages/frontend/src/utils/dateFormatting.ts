/**
 * Date formatting utilities for workout display
 */

/**
 * Format workout date for display
 * Shows "Today", "Yesterday", or formatted date
 *
 * @param dateInput - Date to format (Date object or ISO string)
 * @returns Formatted date string
 *
 * @example
 * formatWorkoutDate(new Date()) // "Today, 9:30 AM"
 * formatWorkoutDate(yesterday) // "Yesterday, 6:00 PM"
 * formatWorkoutDate(lastWeek) // "Nov 22, 7:15 AM"
 */
export function formatWorkoutDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (isSameDay(date, yesterday)) {
    return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

/**
 * Calculate workout duration in minutes
 *
 * @param startTime - Workout start time
 * @param endTime - Workout end time (optional, null for in-progress workouts)
 * @returns Formatted duration string
 *
 * @example
 * calculateDuration(start, end) // "45 min"
 * calculateDuration(start, null) // "In progress"
 */
export function calculateDuration(
  startTime: Date | string,
  endTime?: Date | string | null
): string {
  if (!endTime) return 'In progress';

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMinutes = Math.max(0, Math.round((end - start) / (1000 * 60)));

  return `${durationMinutes} min`;
}

/**
 * Calculate duration in hours (for summary statistics)
 *
 * @param durationHours - Duration in hours (raw number)
 * @returns Formatted duration string
 *
 * @example
 * formatDurationHours(8.5) // "8.5h"
 * formatDurationHours(0.75) // "0.8h"
 */
export function formatDurationHours(durationHours: number): string {
  return `${durationHours.toFixed(1)}h`;
}

/**
 * Calculate elapsed time since a given date
 *
 * @param startDate - Start date to calculate from
 * @returns Formatted elapsed time string
 *
 * @example
 * calculateElapsedTime(startDate) // "Just now"
 * calculateElapsedTime(startDate) // "15 minutes ago"
 * calculateElapsedTime(startDate) // "2h 30m ago"
 */
export function calculateElapsedTime(startDate: Date | string): string {
  const start = new Date(startDate).getTime();
  const now = Date.now();
  const elapsedMinutes = Math.floor((now - start) / (1000 * 60));

  if (elapsedMinutes === 0) {
    return 'Just now';
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} minutes ago`;
  } else {
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    return `${hours}h ${minutes}m ago`;
  }
}

/**
 * Calculate duration between two dates in minutes
 * Returns 0 for in-progress workouts (no end time)
 *
 * @param startTime - Workout start time
 * @param endTime - Workout end time (optional, null for in-progress workouts)
 * @returns Duration in minutes (always >= 0)
 *
 * @example
 * calculateDurationMinutes(start, end) // 45
 * calculateDurationMinutes(start, null) // 0
 */
export function calculateDurationMinutes(
  startTime: Date | string,
  endTime?: Date | string | null
): number {
  if (!endTime) return 0;

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMinutes = Math.max(0, Math.round((end - start) / (1000 * 60)));

  return durationMinutes;
}

/**
 * Format duration in minutes to display string
 * Used for workout detail page statistics
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration string without unit suffix
 *
 * @example
 * formatMinutesForDisplay(45) // "45"
 * formatMinutesForDisplay(0) // "0"
 */
export function formatMinutesForDisplay(minutes: number): string {
  return minutes.toString();
}

/**
 * Format duration in seconds to human-readable string
 * Displays minutes and seconds, hiding zero seconds for cleaner UX
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "5m", "5m 30s")
 *
 * @example
 * formatSecondsToMinutesSeconds(300) // "5m"
 * formatSecondsToMinutesSeconds(330) // "5m 30s"
 * formatSecondsToMinutesSeconds(45) // "45s"
 */
export function formatSecondsToMinutesSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}
