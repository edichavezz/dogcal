/**
 * Login Token Service
 *
 * Generates and validates memorable login passwords stored in the database.
 * Passwords are static (generated once) and human-readable.
 * Format: <pet name><fun verb><user name> all lowercase, no spaces
 */

import { prisma } from './prisma';

// Fun verbs for memorable passwords
const FUN_VERBS = [
  'cuddles',
  'playswith',
  'runswith',
  'snuggles',
  'walkswith',
  'napswith',
  'fetcheswith',
  'adventureswith',
  'chillswith',
  'hangswith',
];

/**
 * Get a random fun verb
 */
function getRandomVerb(): string {
  return FUN_VERBS[Math.floor(Math.random() * FUN_VERBS.length)];
}

/**
 * Clean a name for use in password (lowercase, no spaces, alphanumeric only)
 */
function cleanName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Generate a memorable password for a user based on their pets
 */
async function generateMemorablePassword(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedPups: true,
      pupFriendships: {
        include: {
          pup: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const userName = cleanName(user.name.split(' ')[0]); // First name only
  const verb = getRandomVerb();

  let petName = '';

  if (user.role === 'OWNER' && user.ownedPups.length > 0) {
    // For owners, use their first pup's name
    petName = cleanName(user.ownedPups[0].name);
  } else if (user.role === 'FRIEND' && user.pupFriendships.length > 0) {
    // For friends, use the first pup they care for
    petName = cleanName(user.pupFriendships[0].pup.name);
  }

  // If no pet found, use a fallback
  if (!petName) {
    petName = 'dogcal';
  }

  return `${petName}${verb}${userName}`;
}

/**
 * Generate or retrieve login token/password for a user
 * If user already has a token, return it. Otherwise generate a new memorable password.
 *
 * @param userId - UUID of the user
 * @returns Login token/password string
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

    // Generate new memorable password and ensure it's unique
    let password: string;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      password = await generateMemorablePassword(userId);

      // Check if password already exists
      const existing = await prisma.user.findUnique({
        where: { loginToken: password },
      });

      if (!existing) {
        // Password is unique, save it
        await prisma.user.update({
          where: { id: userId },
          data: { loginToken: password },
        });
        return password;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique password after multiple attempts');
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
 * Generate login passwords for all users and return their info
 * This ensures all users have passwords stored in the database
 *
 * @returns Array of user info with passwords and URLs
 */
export async function generateAllTokens(): Promise<Array<{
  userId: string;
  name: string;
  role: string;
  phoneNumber: string | null;
  token: string;
  password: string;
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mydogcal.vercel.app';

    // Generate or get password for each user
    const tokens = await Promise.all(
      users.map(async (user) => {
        const password = await getOrCreateLoginToken(user.id);
        const loginUrl = `${appUrl}/api/login/${password}`;

        return {
          userId: user.id,
          name: user.name,
          role: user.role,
          phoneNumber: user.phoneNumber,
          token: password, // Keep for backwards compatibility
          password, // New explicit field
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mydogcal.vercel.app';
  return `${appUrl}/api/login/${token}`;
}

/**
 * Get a response URL for a user and hangout
 *
 * @param userId - UUID of the user
 * @param hangoutId - UUID of the hangout
 * @param response - yes or no response
 * @returns Full response URL
 */
export async function getRespondUrl(
  userId: string,
  hangoutId: string,
  response: 'yes' | 'no'
): Promise<string> {
  const token = await getOrCreateLoginToken(userId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mydogcal.vercel.app';
  const responseParam = encodeURIComponent(response);
  const tokenParam = encodeURIComponent(token);

  return `${appUrl}/api/hangouts/${hangoutId}/respond?response=${responseParam}&token=${tokenParam}`;
}

/**
 * Regenerate a memorable password for a user
 * Clears existing token and creates a new memorable password
 *
 * @param userId - UUID of the user
 * @returns New password string
 */
export async function regeneratePassword(userId: string): Promise<string> {
  try {
    // Clear existing token first
    await prisma.user.update({
      where: { id: userId },
      data: { loginToken: null },
    });

    // Generate new memorable password
    return await getOrCreateLoginToken(userId);
  } catch (error) {
    console.error('Error regenerating password:', error);
    throw new Error('Failed to regenerate password');
  }
}

/**
 * Regenerate memorable passwords for all users
 * Replaces any random tokens with human-readable passwords
 *
 * @returns Number of passwords regenerated
 */
export async function regenerateAllPasswords(): Promise<number> {
  try {
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      await regeneratePassword(user.id);
    }

    return users.length;
  } catch (error) {
    console.error('Error regenerating all passwords:', error);
    throw new Error('Failed to regenerate all passwords');
  }
}
