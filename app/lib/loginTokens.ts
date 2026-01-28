/**
 * Login Token Service
 *
 * Generates and validates short, unique login tokens stored in the database.
 * Tokens are static (generated once) and URL-friendly.
 */

import crypto from 'crypto';
import { prisma } from './prisma';

const TOKEN_LENGTH = 12; // Short, URL-friendly tokens (e.g., "aB3xY9kL2mN4")

/**
 * Generate a short, random, URL-safe token
 */
function generateShortToken(): string {
  // Generate random bytes and convert to base64url
  // We need more bytes than TOKEN_LENGTH because base64 encoding expands the size
  const bytes = crypto.randomBytes(Math.ceil(TOKEN_LENGTH * 0.75));
  return bytes.toString('base64url').substring(0, TOKEN_LENGTH);
}

/**
 * Generate or retrieve login token for a user
 * If user already has a token, return it. Otherwise generate a new one.
 *
 * @param userId - UUID of the user
 * @returns Login token string
 */
export async function getOrCreateLoginToken(userId: string): Promise<string> {
  try {
    // Check if user already has a token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loginToken: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Return existing token if available
    if (user.loginToken) {
      return user.loginToken;
    }

    // Generate new token and ensure it's unique
    let token: string;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      token = generateShortToken();

      // Check if token already exists
      const existing = await prisma.user.findUnique({
        where: { loginToken: token },
      });

      if (!existing) {
        // Token is unique, save it
        await prisma.user.update({
          where: { id: userId },
          data: { loginToken: token },
        });
        return token;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique token after multiple attempts');
  } catch (error) {
    console.error('Error getting/creating login token:', error);
    throw new Error('Failed to get or create login token');
  }
}

/**
 * Validate login token and return user ID
 *
 * @param token - Login token string
 * @returns User ID if valid, null otherwise
 */
export async function validateLoginToken(token: string): Promise<{ userId: string } | null> {
  try {
    // Look up user by token
    const user = await prisma.user.findUnique({
      where: { loginToken: token },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    return { userId: user.id };
  } catch (error) {
    console.error('Error validating login token:', error);
    return null;
  }
}

/**
 * Generate login tokens for all users and return their info
 * This ensures all users have tokens stored in the database
 *
 * @returns Array of user info with tokens and URLs
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

    // Generate or get token for each user
    const tokens = await Promise.all(
      users.map(async (user) => {
        const token = await getOrCreateLoginToken(user.id);
        const loginUrl = `${appUrl}/login/${token}`;

        return {
          userId: user.id,
          name: user.name,
          role: user.role,
          phoneNumber: user.phoneNumber,
          token,
          loginUrl,
        };
      })
    );

    return tokens;
  } catch (error) {
    console.error('Error generating all tokens:', error);
    throw new Error('Failed to generate tokens for all users');
  }
}

/**
 * Get login URL for a user
 *
 * @param userId - UUID of the user
 * @returns Full login URL
 */
export async function getLoginUrl(userId: string): Promise<string> {
  const token = await getOrCreateLoginToken(userId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/login/${token}`;
}
