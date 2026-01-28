/**
 * Login Token Service
 *
 * Generates and validates encrypted login tokens for secure user authentication.
 * Uses AES-256-GCM encryption to create opaque, unguessable tokens.
 */

import crypto from 'crypto';
import { prisma } from './prisma';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCODING = 'base64url';

/**
 * Get encryption secret from environment variable
 */
function getSecret(): Buffer {
  const secret = process.env.LOGIN_TOKEN_SECRET;

  if (!secret) {
    throw new Error('LOGIN_TOKEN_SECRET environment variable is not set');
  }

  if (secret.length < 32) {
    throw new Error('LOGIN_TOKEN_SECRET must be at least 32 characters long');
  }

  // Use first 32 bytes of secret as encryption key
  return Buffer.from(secret.slice(0, 32), 'utf-8');
}

/**
 * Token payload structure
 */
interface TokenPayload {
  userId: string;
  destination?: string;
  createdAt: number;
}

/**
 * Generate encrypted login token for a user
 *
 * @param userId - UUID of the user
 * @param destination - Optional destination URL to redirect to after login
 * @returns Encrypted token string (URL-safe)
 */
export function generateLoginToken(userId: string, destination?: string): string {
  try {
    const secret = getSecret();

    // Create payload
    const payload: TokenPayload = {
      userId,
      destination,
      createdAt: Date.now(),
    };

    // Convert payload to JSON
    const plaintext = JSON.stringify(payload);

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, secret, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine iv + encrypted + authTag and encode as base64url
    const combined = Buffer.concat([iv, encrypted, authTag]);
    const token = combined.toString(ENCODING);

    return token;
  } catch (error) {
    console.error('Error generating login token:', error);
    throw new Error('Failed to generate login token');
  }
}

/**
 * Validate and decrypt login token
 *
 * @param token - Encrypted token string
 * @returns Decrypted payload or null if invalid
 */
export function validateLoginToken(token: string): TokenPayload | null {
  try {
    const secret = getSecret();

    // Decode from base64url
    const combined = Buffer.from(token, ENCODING);

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, secret, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Parse JSON
    const payload = JSON.parse(decrypted.toString('utf8')) as TokenPayload;

    // Validate payload structure
    if (!payload.userId || !payload.createdAt) {
      return null;
    }

    return payload;
  } catch (error) {
    // Invalid token (wrong secret, corrupted data, etc.)
    console.error('Error validating login token:', error);
    return null;
  }
}

/**
 * Generate login tokens for all users in the database
 *
 * @returns Array of user info with generated tokens and URLs
 */
export async function generateAllTokens(): Promise<Array<{
  userId: string;
  name: string;
  role: string;
  phoneNumber: string | null;
  token: string;
  loginUrl: string;
}>> {
  try {
    // Fetch all users from database
    const users = await prisma.user.findMany({
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Generate token for each user
    const tokens = users.map((user): {
      userId: string;
      name: string;
      role: string;
      phoneNumber: string | null;
      token: string;
      loginUrl: string;
    } => {
      const token = generateLoginToken(user.id);
      const loginUrl = `${appUrl}/login/${token}`;

      return {
        userId: user.id,
        name: user.name,
        role: user.role,
        phoneNumber: user.phoneNumber,
        token,
        loginUrl,
      };
    });

    return tokens;
  } catch (error) {
    console.error('Error generating all tokens:', error);
    throw new Error('Failed to generate tokens for all users');
  }
}
