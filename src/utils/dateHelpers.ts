import { format, parseISO } from 'date-fns';

export function formatDate(date: Date | string | null | undefined, formatString: string): string {
  if (!date) return '';
  
  try {
    if (date instanceof Date) {
      return format(date, formatString);
    }
    
    if (typeof date === 'string') {
      return format(parseISO(date), formatString);
    }
    
    return '';
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid date';
  }
} 