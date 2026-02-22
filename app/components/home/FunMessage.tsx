'use client';

import { useState } from 'react';

const OWNER_MESSAGES = [
  "Who's caring for {pup} today?",
  "Time for {pup}'s next adventure!",
  "{pup} is ready for some fun!",
  "What's on {pup}'s schedule?",
  "Let's plan some quality time for {pup}!",
  "{pup} can't wait to see their friends!",
];

const FRIEND_MESSAGES = [
  "Are you getting {pup} cuddles today?",
  "Ready for walkies with {pup}?",
  "{pup} misses you!",
  "Time for some {pup} adventures?",
  "{pup} is waiting for you!",
  "Got time for some {pup} love?",
];

/**
 * Hook that returns a random fun welcome message using pup names.
 * Messages differ based on user role (owner vs friend).
 */
export function useFunMessage(
  role: 'OWNER' | 'FRIEND',
  pupNames: string[]
): string {
  const [message] = useState<string>(() => {
    const messages = role === 'OWNER' ? OWNER_MESSAGES : FRIEND_MESSAGES;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    // Pick a random pup name, or use generic fallback
    const pupName = pupNames.length > 0
      ? pupNames[Math.floor(Math.random() * pupNames.length)]
      : 'your pup';

    return randomMessage.replace('{pup}', pupName);
  });

  return message;
}
