import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Get encryption key from environment or generate a secure default
const getEncryptionKey = () => {
  const key = process.env.MESSAGE_ENCRYPTION_KEY || 'default-secure-encryption-key-change-in-production';
  return key;
};

/**
 * Encrypt a message text
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text with IV and tag (base64 encoded)
 */
export const encryptMessage = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from password using PBKDF2
    const key = crypto.pbkdf2Sync(
      getEncryptionKey(),
      salt,
      ITERATIONS,
      KEY_LENGTH,
      'sha512'
    );
    
    // Create cipher and encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return original text if encryption fails
  }
};

/**
 * Decrypt an encrypted message
 * @param {string} encryptedText - Base64 encoded encrypted text
 * @returns {string} - Decrypted plain text
 */
export const decryptMessage = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText;
  }

  try {
    // Decode from base64
    const combined = Buffer.from(encryptedText, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from password using PBKDF2
    const key = crypto.pbkdf2Sync(
      getEncryptionKey(),
      salt,
      ITERATIONS,
      KEY_LENGTH,
      'sha512'
    );
    
    // Create decipher and decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Encrypted Message - Unable to decrypt]';
  }
};

/**
 * Generate a unique key pair for end-to-end encryption (for future use)
 * @returns {Object} - Public and private key pair
 */
export const generateKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  return { publicKey, privateKey };
};

/**
 * Hash a message for integrity verification
 * @param {string} message - Message to hash
 * @returns {string} - SHA-256 hash
 */
export const hashMessage = (message) => {
  return crypto.createHash('sha256').update(message).digest('hex');
};

export default {
  encryptMessage,
  decryptMessage,
  generateKeyPair,
  hashMessage
};
