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
  const durationMinutes = Math.round((end - start) / (1000 * 60));

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
 * calculateElapsedTime(startDate) // "15 minutes ago"
 * calculateElapsedTime(startDate) // "2h 30m ago"
 */
export function calculateElapsedTime(startDate: Date | string): string {
  const start = new Date(startDate).getTime();
  const now = Date.now();
  const elapsedMinutes = Math.floor((now - start) / (1000 * 60));

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} minutes ago`;
  } else {
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    return `${hours}h ${minutes}m ago`;
  }
}
