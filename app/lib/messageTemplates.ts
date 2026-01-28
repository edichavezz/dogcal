import { format } from 'date-fns';

/**
 * Get the base URL for the application
 */
function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

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
export function generateHangoutCreatedMessage(params: {
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  eventName: string | null;
  ownerNotes: string | null;
  hangoutId: string;
}): string {
  const {
    friendName,
    ownerName,
    pupName,
    startAt,
    endAt,
    eventName,
    ownerNotes,
    hangoutId,
  } = params;

  const deepLink = `${getAppUrl()}/calendar?hangout=${hangoutId}`;
  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 DogCal: New Hangout Available!

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

  message += `\n\n👉 View & assign yourself here:\n${deepLink}

Thanks for being a pup friend!`;

  return message;
}

/**
 * Generate WhatsApp message for when a friend suggests a new hangout
 * Sent to the pup owner
 */
export function generateSuggestionCreatedMessage(params: {
  ownerName: string;
  friendName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  eventName: string | null;
  friendComment: string | null;
  suggestionId: string;
}): string {
  const {
    ownerName,
    friendName,
    pupName,
    startAt,
    endAt,
    eventName,
    friendComment,
    suggestionId,
  } = params;

  const deepLink = `${getAppUrl()}/approvals?suggestion=${suggestionId}`;
  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 DogCal: New Hangout Suggestion!

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

  message += `\n\n👉 Review & approve here:\n${deepLink}

You can approve or reject this suggestion.`;

  return message;
}

/**
 * Generate WhatsApp message for when a hangout is assigned
 * Sent to the pup owner (future enhancement)
 */
export function generateHangoutAssignedMessage(params: {
  ownerName: string;
  friendName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  eventName: string | null;
  hangoutId: string;
}): string {
  const {
    ownerName,
    friendName,
    pupName,
    startAt,
    endAt,
    eventName,
    hangoutId,
  } = params;

  const deepLink = `${getAppUrl()}/calendar?hangout=${hangoutId}`;
  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 DogCal: Hangout Assigned!

Hi ${ownerName}!

Good news! ${friendName} will hang out with ${pupName} 🐾

📅 ${startFormatted}
⏰ Until ${endTimeFormatted}`;

  if (eventName) {
    message += `\n📝 ${eventName}`;
  }

  message += `\n\n👉 View details here:\n${deepLink}

Thanks for using DogCal!`;

  return message;
}

/**
 * Generate WhatsApp message for when a suggestion is approved
 * Sent to the friend who made the suggestion (future enhancement)
 */
export function generateSuggestionApprovedMessage(params: {
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  eventName: string | null;
  hangoutId: string;
}): string {
  const {
    friendName,
    ownerName,
    pupName,
    startAt,
    endAt,
    eventName,
    hangoutId,
  } = params;

  const deepLink = `${getAppUrl()}/calendar?hangout=${hangoutId}`;
  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 DogCal: Suggestion Approved!

Hi ${friendName}!

Great news! ${ownerName} approved your hangout suggestion with ${pupName} 🐾

📅 ${startFormatted}
⏰ Until ${endTimeFormatted}`;

  if (eventName) {
    message += `\n📝 ${eventName}`;
  }

  message += `\n\n👉 View & assign yourself here:\n${deepLink}

Thanks for suggesting a time!`;

  return message;
}
