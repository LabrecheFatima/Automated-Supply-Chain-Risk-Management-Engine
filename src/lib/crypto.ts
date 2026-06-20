import crypto from 'crypto';

// Ensure you have a secure 32-character string in your .env file: ENCRYPTION_KEY="abcdefghijklmnopqrstuvwxyzabcdef"
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'development_secret_key_32_chars_min'; 
const IV_LENGTH = 16; // For AES, this is always 16 bytes

export function encryptPassword(text: string): string {
  // Hash the configuration key to guarantee a valid 32-byte key length size
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Return the initialization vector along with the encrypted payload as a single colon-separated hex string
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptPassword(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift() || '', 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
}