import { format } from 'date-fns';
import { getLoginUrl } from './loginTokens';

/**
 * Format a date for display in messages
 * Example: "Monday, January 15 at 2:00 PM"
 */
function formatDateTime(date: Date): string {
  return format(date, 'EEEE, MMMM d \'at\' h:mm a');
}

/**
 * Format a time for display
 * Example: "2:00 PM"
 */
function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

/**
 * Generate WhatsApp message for when an owner creates a new hangout
 * Sent to all friends of the pup
 */
export async function generateHangoutCreatedMessage(params: {
  friendUserId: string;
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  eventName: string | null;
  ownerNotes: string | null;
  hangoutId: string;
}): Promise<string> {
  const {
    friendUserId,
    friendName,
    ownerName,
    pupName,
    startAt,
    endAt,
    eventName,
    ownerNotes,
  } = params;

  // Get static login URL for the friend
  const loginUrl = await getLoginUrl(friendUserId);

  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 *DogCal: New Hangout Available!*

Hi ${friendName}!

${ownerName} needs someone to hang out with ${pupName} 🐾

📅 ${startFormatted}
⏰ Until ${endTimeFormatted}`;

  // Add event name if provided
  if (eventName) {
    message += `\n📝 ${eventName}`;
  }

  // Add owner notes if provided
  if (ownerNotes) {
    message += `\n\n💬 Notes: ${ownerNotes}`;
  }

  // Format URL for WhatsApp clickability - ensure it's on its own line
  message += `\n\n👉 View & assign yourself:

${loginUrl}

Thanks for being a pup friend!`;

  return message;
}

/**
 * Generate WhatsApp message for when a friend suggests a new hangout
 * Sent to the pup owner
 */
export async function generateSuggestionCreatedMessage(params: {
  ownerUserId: string;
  ownerName: string;
  friendName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  eventName: string | null;
  friendComment: string | null;
  suggestionId: string;
}): Promise<string> {
  const {
    ownerUserId,
    ownerName,
    friendName,
    pupName,
    startAt,
    endAt,
    eventName,
    friendComment,
  } = params;

  // Get static login URL for the owner
  const loginUrl = await getLoginUrl(ownerUserId);

  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 *DogCal: New Hangout Suggestion!*

Hi ${ownerName}!

${friendName} suggested a time to hang out with ${pupName} 🐾

📅 ${startFormatted}
⏰ Until ${endTimeFormatted}`;

  // Add event name if provided
  if (eventName) {
    message += `\n📝 ${eventName}`;
  }

  // Add friend comment if provided
  if (friendComment) {
    message += `\n\n💬 ${friendName} says: ${friendComment}`;
  }

  // Format URL for WhatsApp clickability - ensure it's on its own line
  message += `\n\n👉 Review & approve:

${loginUrl}

You can approve or reject this suggestion.`;

  return message;
}

/**
 * Generate WhatsApp message for when a hangout is assigned
 * Sent to the pup owner (future enhancement)
 */
export async function generateHangoutAssignedMessage(params: {
  ownerUserId: string;
  ownerName: string;
  friendName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  eventName: string | null;
  hangoutId: string;
}): Promise<string> {
  const {
    ownerUserId,
    ownerName,
    friendName,
    pupName,
    startAt,
    endAt,
    eventName,
  } = params;

  // Get static login URL for the owner
  const loginUrl = await getLoginUrl(ownerUserId);

  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 *DogCal: Hangout Assigned!*

Hi ${ownerName}!

Good news! ${friendName} will hang out with ${pupName} 🐾

📅 ${startFormatted}
⏰ Until ${endTimeFormatted}`;

  if (eventName) {
    message += `\n📝 ${eventName}`;
  }

  // Format URL for WhatsApp clickability - ensure it's on its own line
  message += `\n\n👉 View details:

${loginUrl}

Thanks for using DogCal!`;

  return message;
}

/**
 * Generate WhatsApp message for when a friend unassigns from a hangout
 * Sent to the pup owner
 */
export async function generateHangoutUnassignedMessage(params: {
  ownerUserId: string;
  ownerName: string;
  friendName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  eventName: string | null;
  hangoutId: string;
}): Promise<string> {
  const {
    ownerUserId,
    ownerName,
    friendName,
    pupName,
    startAt,
    endAt,
    eventName,
  } = params;

  // Get static login URL for the owner
  const loginUrl = await getLoginUrl(ownerUserId);

  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 *DogCal: Hangout Cancelled*

Hi ${ownerName},

${friendName} can no longer hang out with ${pupName} 🐾

📅 ${startFormatted}
⏰ Until ${endTimeFormatted}`;

  if (eventName) {
    message += `\n📝 ${eventName}`;
  }

  message += `\n\nThis hangout is now *open* again for other friends to pick up.

👉 View details:

${loginUrl}`;

  return message;
}

/**
 * Generate WhatsApp message for when a suggestion is approved
 * Sent to the friend who made the suggestion (future enhancement)
 */
export async function generateSuggestionApprovedMessage(params: {
  friendUserId: string;
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  eventName: string | null;
  hangoutId: string;
}): Promise<string> {
  const {
    friendUserId,
    friendName,
    ownerName,
    pupName,
    startAt,
    endAt,
    eventName,
  } = params;

  // Get static login URL for the friend
  const loginUrl = await getLoginUrl(friendUserId);

  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 *DogCal: Suggestion Approved!*

Hi ${friendName}!

Great news! ${ownerName} approved your hangout suggestion with ${pupName} 🐾

📅 ${startFormatted}
⏰ Until ${endTimeFormatted}`;

  if (eventName) {
    message += `\n📝 ${eventName}`;
  }

  // Format URL for WhatsApp clickability - ensure it's on its own line
  message += `\n\n👉 View & assign yourself:

${loginUrl}

Thanks for suggesting a time!`;

  return message;
}
