import { format, parseISO, isValid } from 'date-fns';

/**
 * Safely format a date that could be a Date object or a string
 * @param date - Date object, string, or null/undefined
 * @param formatStr - date-fns format string
 * @returns Formatted date string or fallback
 */
export const safeDateFormat = (date: any, formatStr: string): string => {
  if (!date) return 'N/A';
  
  try {
    let parsedDate: Date;
    
    // If it's already a Date object
    if (date instanceof Date) {
      parsedDate = date;
    } 
    // If it's a string, parse it
    else if (typeof date === 'string') {
      parsedDate = parseISO(date);
    } 
    // If it's something else, try to create a Date
    else {
      parsedDate = new Date(date);
    }
    
    // Check if the date is valid
    if (!isValid(parsedDate)) {
      console.warn('Invalid date provided to safeDateFormat:', date);
      return 'Invalid date';
    }
    
    return format(parsedDate, formatStr);
  } catch (error) {
    console.error('Error in safeDateFormat:', error, 'Date:', date);
    return 'Invalid date';
  }
};

/**
 * Check if a date value is valid
 * @param date - Date object, string, or null/undefined  
 * @returns boolean indicating if date is valid
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  
  try {
    let parsedDate: Date;
    
    if (date instanceof Date) {
      parsedDate = date;
    } else if (typeof date === 'string') {
      parsedDate = parseISO(date);
    } else {
      parsedDate = new Date(date);
    }
    
    return isValid(parsedDate);
  } catch {
    return false;
  }
}; 