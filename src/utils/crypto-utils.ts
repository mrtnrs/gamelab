// src/utils/crypto-utils.ts
import CryptoJS from 'crypto-js';
import { enc as CryptoJSEnc, lib as CryptoJSLib } from 'crypto-js';

/**
 * Generate a UUID v4 using crypto-js instead of Node.js crypto
 * This is compatible with Edge Runtime
 */
export function generateUUID(): string {
  // Generate 16 random bytes (128 bits)
  const randomBytes = CryptoJS.lib.WordArray.random(16);
  
  // Convert to hex string
  let hexString = randomBytes.toString(CryptoJSEnc.Hex);
  
  // Insert UUID format separators and version (4)
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where y is one of: 8, 9, A, or B
  
  // Set the version (4) and variant bits
  const version = 4;
  const variant = 0x8 + (Math.random() * 4) | 0; // 8, 9, A, or B
  
  // Format the UUID string with proper hyphens and version/variant bits
  return hexString.substring(0, 8) + '-' + 
         hexString.substring(8, 12) + '-' + 
         version + hexString.substring(13, 16) + '-' + 
         variant.toString(16) + hexString.substring(17, 20) + '-' + 
         hexString.substring(20, 32);
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number): string {
  const randomWords = CryptoJS.lib.WordArray.random(Math.ceil(length / 2));
  return randomWords.toString(CryptoJSEnc.Hex).slice(0, length);
}

/**
 * Create a SHA-256 hash and base64url encode it
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = CryptoJS.SHA256(verifier);
  // Convert to base64 and make it URL safe
  const base64 = hash.toString(CryptoJSEnc.Base64);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
