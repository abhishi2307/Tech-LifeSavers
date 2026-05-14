/**
 * Validation utility functions
 * Provides common validation helpers for forms and data
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Minimum 6 characters
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Validate that two values match
 */
export const doValuesMatch = (value1: string, value2: string): boolean => {
  return value1 === value2;
};

/**
 * Validate that a field is not empty
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};
