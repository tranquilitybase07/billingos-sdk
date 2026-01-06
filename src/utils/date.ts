import { format, formatDistance, formatRelative, isAfter, isBefore, parseISO } from 'date-fns'

/**
 * Format a date string or Date object
 * @param date - Date string (ISO) or Date object
 * @param formatStr - Format string (date-fns format)
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15T10:30:00Z', 'PPP') // "January 15th, 2024"
 * formatDate(new Date(), 'yyyy-MM-dd') // "2024-01-15"
 */
export const formatDate = (date: string | Date, formatStr = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * @param date - Date string (ISO) or Date object
 * @param baseDate - Base date to compare against (defaults to now)
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime('2024-01-15T08:30:00Z') // "2 hours ago"
 */
export const formatRelativeTime = (
  date: string | Date,
  baseDate: Date = new Date(),
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(dateObj, baseDate, { addSuffix: true })
}

/**
 * Format a date relative to now (e.g., "today at 10:30 AM")
 * @param date - Date string (ISO) or Date object
 * @param baseDate - Base date to compare against (defaults to now)
 * @returns Relative date string
 *
 * @example
 * formatRelativeDate('2024-01-15T10:30:00Z') // "today at 10:30 AM"
 */
export const formatRelativeDate = (
  date: string | Date,
  baseDate: Date = new Date(),
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatRelative(dateObj, baseDate)
}

/**
 * Check if a date is in the past
 * @param date - Date string (ISO) or Date object
 * @returns True if date is in the past
 */
export const isPast = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isBefore(dateObj, new Date())
}

/**
 * Check if a date is in the future
 * @param date - Date string (ISO) or Date object
 * @returns True if date is in the future
 */
export const isFuture = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isAfter(dateObj, new Date())
}

/**
 * Parse ISO date string to Date object
 * @param date - ISO date string
 * @returns Date object
 */
export const parseDate = (date: string): Date => {
  return parseISO(date)
}

/**
 * Date utilities namespace
 */
export const DateUtils = {
  format: formatDate,
  formatRelative: formatRelativeTime,
  formatRelativeDate,
  isPast,
  isFuture,
  parse: parseDate,
}
