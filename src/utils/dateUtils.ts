import { format, parseISO } from 'date-fns';

/**
 * Safely format a date that might be a Date object or an ISO string
 */
export function safeDateFormat(date: Date | string | null | undefined, formatString: string): string {
  if (!date) return '';
  
  try {
    // If it's already a Date object, use it directly
    if (date instanceof Date) {
      return format(date, formatString);
    }
    
    // If it's a string, parse it first
    if (typeof date === 'string') {
      return format(parseISO(date), formatString);
    }
    
    return '';
  } catch (error) {
    console.warn('Date formatting error:', error, 'Date:', date);
    return '';
  }
} 