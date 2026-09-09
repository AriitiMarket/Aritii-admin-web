import {
  faCheck,
  faExclamationTriangle,
  faInfoCircle,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons';
import { ISeverityStyles } from '../interfaces/toast.interface';

// Prices
export const MIN_PRICE = 0.0;
export const MAX_PRICE = 99999;

// File Sizes
export const MAX_LANSDCAPE_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
export const MAX_SQUARE_FILE_SIZE = 500 * 1000; // 500 KB
export const MAX_VIDEO_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

// Default Locale
export const DEFAULT_LOCALE: string = 'en';

// Severity Styles
export const SEVERITY_STYLES: ISeverityStyles = {
  error: {
    bgColor: '#FFC5C5',
    textColor: '#FF0000',
    icon: faXmarkCircle,
    iconBg: '#FFC5C5',
  },
  success: {
    bgColor: '#C6F7D0',
    textColor: '#34C759',
    icon: faCheck,
    iconBg: '#C6F7D0',
  },
  info: {
    bgColor: '#B2E2FC',
    textColor: '#2196F3',
    icon: faInfoCircle,
    iconBg: '#B2E2FC',
  },
  warn: {
    bgColor: '#F7DC6F',
    textColor: '#F7DC6F',
    icon: faExclamationTriangle,
    iconBg: '#F7DC6F',
  },
};



export const languageTypes = [
  { value: 'English', code: 'en', index: 0 },
  { value: 'Afaan Oromoo', code: 'om', index: 1 },
  { value: 'አማርኛ', code: 'am', index: 2 },
  { value: 'العربية', code: 'ar', index: 3 },
  { value: 'azərbaycan', code: 'az', index: 4 },
  { value: 'বাংলা', code: 'bn', index: 5 },
  { value: 'Deutsche', code: 'de', index: 6 },
  { value: 'español', code: 'es', index: 7 },
  { value: 'فارسی', code: 'fa', index: 8 },
  { value: 'français', code: 'fr', index: 9 },
  { value: 'ગુજરાતી', code: 'gu', index: 10 },
  { value: 'עִברִית', code: 'he', index: 11 },
  { value: 'हिंदी', code: 'hi', index: 12 },
  { value: 'Bahasa Indonesia', code: 'id', index: 13 },
  { value: 'italiano', code: 'it', index: 14 },
  { value: '日本語', code: 'jp', index: 15 },
  { value: 'ភាសាខ្មែរ', code: 'km', index: 16 },
  { value: '한국어', code: 'ko', index: 17 },
  { value: 'کوردی', code: 'ku', index: 18 },
  { value: 'मराठी', code: 'mr', index: 19 },
  { value: 'Nederlands', code: 'nl', index: 20 },
  { value: 'polski', code: 'pl', index: 21 },
  { value: 'پښتو', code: 'ps', index: 22 },
  { value: 'português', code: 'pt', index: 23 },
  { value: 'română', code: 'ro', index: 24 },
  { value: 'русский', code: 'ru', index: 25 },
  { value: 'తెలుగు', code: 'te', index: 26 },
  { value: 'ไทย', code: 'th', index: 27 },
  { value: 'Türkçe', code: 'tr', index: 28 },
  { value: 'اردو', code: 'ur', index: 29 },
  { value: 'ozbek', code: 'uz', index: 30 },
  { value: 'Tiếng Việt', code: 'vi', index: 31 },
  { value: '中文', code: 'zh', index: 32 }
]