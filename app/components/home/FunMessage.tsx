'use client';

import { useState } from 'react';

const OWNER_MESSAGES = [
  "Hey {first}, who's caring for {pup} today?",
  "Time for {pup}'s next adventure, {first}!",
  "{pup} is ready for some fun, {first}.",
  "What's on {pup}'s calendar today, {first}?",
  "Let's plan something great for {pup}, {first}!",
  "{first}, {pup} can't wait to see their friends!",
];

const FRIEND_MESSAGES = [
  "Hey {first}, ready for some {pup} cuddles?",
  "{pup} misses you, {first}!",
  "Time for some {pup} adventures, {first}?",
  "Ready for walkies with {pup}, {first}?",
  "{pup} is waiting for you, {first}!",
  "Got time for some {pup} love today, {first}?",
];

/**
 * Hook that returns a random fun welcome message using pup names.
 * Messages differ based on user role (owner vs friend).
 */
export function useFunMessage(
  role: 'OWNER' | 'FRIEND',
  pupNames: string[],
  firstName: string
): string {
  const [message] = useState<string>(() => {
    const messages = role === 'OWNER' ? OWNER_MESSAGES : FRIEND_MESSAGES;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    const pupName = pupNames.length > 0
      ? pupNames[Math.floor(Math.random() * pupNames.length)]
      : 'your pup';

    return randomMessage.replace('{pup}', pupName).replace('{first}', firstName);
  });

  return message;
}
