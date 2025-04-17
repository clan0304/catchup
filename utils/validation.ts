// utils/validation.ts
import { checkUsernameUnique } from '../services/profile';

/**
 * Validates a username
 * @param username The username to validate
 * @returns An object containing validation result and error message if any
 */
export async function validateUsername(
  username: string
): Promise<{ valid: boolean; message: string | null }> {
  // Check if username is empty
  if (!username.trim()) {
    return { valid: false, message: 'Username is required' };
  }

  // Check for minimum length
  if (username.length < 3) {
    return {
      valid: false,
      message: 'Username must be at least 3 characters long',
    };
  }

  // Check for maximum length
  if (username.length > 30) {
    return {
      valid: false,
      message: 'Username must be less than 30 characters',
    };
  }

  // Check for valid characters (letters, numbers, underscores)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      valid: false,
      message: 'Username can only contain letters, numbers, and underscores',
    };
  }

  // Check if username is unique
  const isUnique = await checkUsernameUnique(username);
  if (!isUnique) {
    return { valid: false, message: 'Username is already taken' };
  }

  return { valid: true, message: null };
}

/**
 * Validates an Instagram URL
 * @param url The URL to validate
 * @returns An object containing validation result and error message if any
 */
export function validateInstagramUrl(url: string): {
  valid: boolean;
  message: string | null;
} {
  // Check if URL is empty
  if (!url.trim()) {
    return { valid: false, message: 'Instagram URL is required' };
  }

  // Very basic Instagram URL validation
  // This is a simple check - you might want to improve it
  if (!url.includes('instagram.com/')) {
    return { valid: false, message: 'Please enter a valid Instagram URL' };
  }

  return { valid: true, message: null };
}

/**
 * Validates a city name
 * @param city The city name to validate
 * @returns An object containing validation result and error message if any
 */
export function validateCity(city: string): {
  valid: boolean;
  message: string | null;
} {
  // Check if city is empty
  if (!city.trim()) {
    return { valid: false, message: 'City is required' };
  }

  return { valid: true, message: null };
}

/**
 * Validates user interests
 * @param interests Array of interests
 * @returns An object containing validation result and error message if any
 */
export function validateInterests(interests: string[]): {
  valid: boolean;
  message: string | null;
} {
  // Check if at least one interest is selected
  if (!interests.length) {
    return { valid: false, message: 'Please select at least one interest' };
  }

  return { valid: true, message: null };
}

/**
 * Validates user bio
 * @param bio The bio to validate
 * @returns An object containing validation result and error message if any
 */
export function validateBio(bio: string): {
  valid: boolean;
  message: string | null;
} {
  // Check if bio is empty
  if (!bio.trim()) {
    return { valid: false, message: 'Bio is required' };
  }

  // Check for maximum length
  if (bio.length > 500) {
    return { valid: false, message: 'Bio must be less than 500 characters' };
  }

  return { valid: true, message: null };
}

/**
 * Validates a phone number
 * @param phoneNumber The phone number to validate
 * @returns An object containing validation result and error message if any
 */
export function validatePhoneNumber(phoneNumber: string): {
  valid: boolean;
  message: string | null;
} {
  // Check if phone number is empty
  if (!phoneNumber.trim()) {
    return { valid: false, message: 'Phone number is required' };
  }

  // Basic phone number validation (at least 10 digits)
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return { valid: false, message: 'Please enter a valid phone number' };
  }

  return { valid: true, message: null };
}

/**
 * Validates an OTP code
 * @param otp The OTP code to validate
 * @returns An object containing validation result and error message if any
 */
export function validateOtp(otp: string): {
  valid: boolean;
  message: string | null;
} {
  // Check if OTP is empty
  if (!otp.trim()) {
    return { valid: false, message: 'Verification code is required' };
  }

  // Check if OTP has the correct length
  if (otp.length !== 6) {
    return { valid: false, message: 'Verification code must be 6 digits' };
  }

  // Check if OTP contains only digits
  if (!/^\d+$/.test(otp)) {
    return {
      valid: false,
      message: 'Verification code must contain only digits',
    };
  }

  return { valid: true, message: null };
}
