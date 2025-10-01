// Utility functions for Vietnam timezone (+7 UTC)
// File: src/utils/timeUtils.ts

/**
 * Get current time in Vietnam timezone (+7 UTC)
 * @returns ISO string in Vietnam timezone
 */
export const getVietnamTime = (): string => {
  const now = new Date();
  // Convert to Vietnam timezone (+7 hours)
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return vietnamTime.toISOString();
};

/**
 * Get current time in Vietnam timezone for database operations
 * @returns ISO string with timezone info
 */
export const getVietnamTimeForDB = (): string => {
  const now = new Date();
  // Convert to Vietnam timezone (+7 hours) and format for database
  const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return vietnamTime.toISOString().replace('Z', '+07:00');
};

/**
 * Get current time in Vietnam timezone as Date object
 * @returns Date object in Vietnam timezone
 */
export const getVietnamDate = (): Date => {
  const now = new Date();
  // Convert to Vietnam timezone (+7 hours)
  return new Date(now.getTime() + (7 * 60 * 60 * 1000));
};

/**
 * Convert any date to Vietnam timezone
 * @param date - Date to convert
 * @returns Date object in Vietnam timezone
 */
export const toVietnamTime = (date: Date | string): Date => {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  // Convert to Vietnam timezone (+7 hours)
  return new Date(inputDate.getTime() + (7 * 60 * 60 * 1000));
};

/**
 * Calculate time elapsed from a start time in Vietnam timezone
 * @param startTime - Start time (ISO string or Date)
 * @returns Formatted time elapsed string
 */
export const getTimeElapsed = (startTime: string | Date): string => {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const now = new Date();
  
  // Convert both to Vietnam timezone
  const vietnamOffset = 7 * 60; // +7 hours = 420 minutes
  const startVietnam = new Date(start.getTime() + (start.getTimezoneOffset() + vietnamOffset) * 60000);
  const nowVietnam = new Date(now.getTime() + (now.getTimezoneOffset() + vietnamOffset) * 60000);
  
  // Calculate time difference
  const diffMs = nowVietnam.getTime() - startVietnam.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  // Handle negative time (shouldn't happen but just in case)
  if (diffMinutes < 0) {
    return 'Vừa tạo';
  }
  
  if (diffMinutes < 60) {
    return `${diffMinutes} phút`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}p`;
  }
};

/**
 * Format date to Vietnam timezone string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatVietnamDateTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const vietnamDate = toVietnamTime(inputDate);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options
  };
  
  return vietnamDate.toLocaleString('vi-VN', defaultOptions);
};

/**
 * Format date to Vietnam date string (DD/MM/YYYY)
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatVietnamDate = (date: Date | string): string => {
  return formatVietnamDateTime(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Format date to Vietnam time string (HH:MM:SS)
 * @param date - Date to format
 * @returns Formatted time string
 */
export const formatVietnamTime = (date: Date | string): string => {
  return formatVietnamDateTime(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Get current Vietnam time as formatted string
 * @returns Current time in Vietnam timezone as formatted string
 */
export const getCurrentVietnamTime = (): string => {
  return formatVietnamDateTime(getVietnamDate());
};
