import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('vi');

// Set default timezone to Vietnam (+7 UTC)
const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

// Currency formatter
export const formatCurrency = (amount: number): string => {
  // Handle NaN, null, undefined values
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 ₫';
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Number formatter
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

// Date formatters with Vietnam timezone
export const formatDate = (date: string | Date, format = 'DD/MM/YYYY'): string => {
  return dayjs(date).tz(VIETNAM_TIMEZONE).format(format);
};

export const formatDateTime = (date: string | Date, format = 'DD/MM/YYYY HH:mm'): string => {
  return dayjs(date).tz(VIETNAM_TIMEZONE).format(format);
};

export const formatTime = (time: string): string => {
  return dayjs(time, 'HH:mm:ss').tz(VIETNAM_TIMEZONE).format('HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).tz(VIETNAM_TIMEZONE).fromNow();
};

// Vietnam timezone utilities
export const getVietnamTime = (): string => {
  return dayjs().tz(VIETNAM_TIMEZONE).toISOString();
};

export const getVietnamNow = () => {
  return dayjs().tz(VIETNAM_TIMEZONE);
};

export const formatVietnamDateTime = (date: string | Date, format = 'DD/MM/YYYY HH:mm:ss'): string => {
  return dayjs(date).tz(VIETNAM_TIMEZONE).format(format);
};

export const getTimeElapsed = (startTime: string): string => {
  const start = dayjs(startTime).tz(VIETNAM_TIMEZONE);
  const now = dayjs().tz(VIETNAM_TIMEZONE);
  
  const diffMinutes = now.diff(start, 'minute');
  
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

// Phone formatter
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Vietnamese phone number
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  return phone;
};

// Duration formatter (minutes to hours:minutes)
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }
  
  return `${hours}h${remainingMinutes}m`;
};

// Status formatters
export const formatPaymentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    partial: 'Thanh toán một phần',
    refunded: 'Đã hoàn tiền',
  };
  
  return statusMap[status] || status;
};

export const formatAppointmentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    scheduled: 'Đã đặt lịch',
    in_progress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };
  
  return statusMap[status] || status;
};

export const formatScheduleStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    scheduled: 'Đã xếp lịch',
    completed: 'Hoàn thành',
    absent: 'Vắng mặt',
  };
  
  return statusMap[status] || status;
};

export const formatPayrollStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
  };
  
  return statusMap[status] || status;
};

// Gender formatter
export const formatGender = (gender: string): string => {
  const genderMap: Record<string, string> = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
  };
  
  return genderMap[gender] || gender;
};

// Role formatter
export const formatRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    admin: 'Quản trị viên',
    manager: 'Quản lý',
    employee: 'Nhân viên',
  };
  
  return roleMap[role] || role;
};

// Percentage formatter
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// File size formatter
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Capitalize first letter
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Generate initials from name
export const getInitials = (name: string): string => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Color generators
export const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
    // Payment status
    pending: 'warning',
    paid: 'success',
    partial: 'info',
    refunded: 'error',
    
    // Appointment status
    scheduled: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'error',
    
    // Schedule status
    absent: 'error',
    
    // General
    active: 'success',
    inactive: 'default',
  };
  
  return colorMap[status] || 'default';
};
