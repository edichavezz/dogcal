import { format } from 'date-fns';
import { getLoginUrl, getRespondUrl } from './loginTokens';

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
    hangoutId,
  } = params;

  // Get static login URL for the friend
  const loginUrl = await getLoginUrl(friendUserId);
  const yesUrl = await getRespondUrl(friendUserId, hangoutId, 'yes');
  const noUrl = await getRespondUrl(friendUserId, hangoutId, 'no');

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
  message += `\n\n✅ Yes, I can help:
${yesUrl}

❌ Sorry, I can’t:
${noUrl}

🔍 View details:
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
 * Generate WhatsApp message for when a confirmed hangout is rescheduled
 * Sent to the assigned friend so they can re-accept
 */
export async function generateHangoutRescheduledMessage(params: {
  friendUserId: string;
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  hangoutId: string;
}): Promise<string> {
  const { friendUserId, friendName, ownerName, pupName, startAt, endAt, hangoutId } = params;

  const loginUrl = await getLoginUrl(friendUserId);
  const yesUrl = await getRespondUrl(friendUserId, hangoutId, 'yes');
  const noUrl = await getRespondUrl(friendUserId, hangoutId, 'no');

  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 *DogCal: Hangout Update*

Hi ${friendName}!

${ownerName} updated the hangout time for ${pupName} 🐾

📅 ${startFormatted}
⏰ Until ${endTimeFormatted}

Please re-confirm if you can still help.`;

  message += `\n\n✅ Yes, I can help:
${yesUrl}

❌ Sorry, I can’t:
${noUrl}

🔍 View details:
${loginUrl}`;

  return message;
}

/**
 * Generate WhatsApp message for when a hangout is confirmed for a helper
 * Sent to the confirmed helper
 */
export async function generateHangoutConfirmedMessage(params: {
  friendUserId: string;
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
}): Promise<string> {
  const { friendUserId, friendName, ownerName, pupName, startAt, endAt } = params;
  const loginUrl = await getLoginUrl(friendUserId);

  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 *DogCal: You’re confirmed!*

Hi ${friendName}!

${ownerName} confirmed you to hang out with ${pupName} 🐾

📅 ${startFormatted}
⏰ Until ${endTimeFormatted}`;

  message += `\n\n🔍 View details:
${loginUrl}`;

  return message;
}

/**
 * Generate WhatsApp message for when a hangout is closed to other invitees
 */
export async function generateHangoutClosedMessage(params: {
  friendUserId: string;
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
}): Promise<string> {
  const { friendUserId, friendName, ownerName, pupName, startAt, endAt } = params;
  const loginUrl = await getLoginUrl(friendUserId);

  const startFormatted = formatDateTime(startAt);
  const endTimeFormatted = formatTime(endAt);

  let message = `🐕 *DogCal: Hangout Filled*

Hi ${friendName}!

${ownerName} has confirmed help for ${pupName} 🐾

📅 ${startFormatted}
⏰ Until ${endTimeFormatted}`;

  message += `\n\n🔍 View details:
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

// =============================================================================
// TEMPLATE VARIABLE GENERATORS
// These functions return variables for WhatsApp message templates
// Template format: {{1}} = recipient, {{2}} = other person, {{3}} = pup, {{4}} = datetime, {{5}} = URL
// =============================================================================

/**
 * Generate template variables for hangout_created template
 * Sent to friends when owner creates a new hangout
 */
export async function getHangoutCreatedTemplateVars(params: {
  friendUserId: string;
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  hangoutId: string;
}): Promise<Record<string, string>> {
  const { friendUserId, friendName, ownerName, pupName, startAt, endAt, hangoutId } = params;
  const loginUrl = await getLoginUrl(friendUserId);
  const yesUrl = await getRespondUrl(friendUserId, hangoutId, 'yes');
  const noUrl = await getRespondUrl(friendUserId, hangoutId, 'no');
  const dateTime = `${formatDateTime(startAt)} - ${formatTime(endAt)}`;
  const responseLinks = `Yes: ${yesUrl}\nNo: ${noUrl}\nDetails: ${loginUrl}`;

  return {
    '1': friendName,
    '2': ownerName,
    '3': pupName,
    '4': dateTime,
    '5': responseLinks,
  };
}

/**
 * Generate template variables for hangout_assigned template
 * Sent to owner when a friend assigns themselves
 */
export async function getHangoutAssignedTemplateVars(params: {
  ownerUserId: string;
  ownerName: string;
  friendName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
}): Promise<Record<string, string>> {
  const { ownerUserId, ownerName, friendName, pupName, startAt, endAt } = params;
  const loginUrl = await getLoginUrl(ownerUserId);
  const dateTime = `${formatDateTime(startAt)} - ${formatTime(endAt)}`;

  return {
    '1': ownerName,
    '2': friendName,
    '3': pupName,
    '4': dateTime,
    '5': loginUrl,
  };
}

/**
 * Generate template variables for hangout_unassigned template
 * Sent to owner when a friend unassigns themselves
 */
export async function getHangoutUnassignedTemplateVars(params: {
  ownerUserId: string;
  ownerName: string;
  friendName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
}): Promise<Record<string, string>> {
  const { ownerUserId, ownerName, friendName, pupName, startAt, endAt } = params;
  const loginUrl = await getLoginUrl(ownerUserId);
  const dateTime = `${formatDateTime(startAt)} - ${formatTime(endAt)}`;

  return {
    '1': ownerName,
    '2': friendName,
    '3': pupName,
    '4': dateTime,
    '5': loginUrl,
  };
}

/**
 * Generate template variables for suggestion_created template
 * Sent to owner when a friend suggests a hangout
 */
export async function getSuggestionCreatedTemplateVars(params: {
  ownerUserId: string;
  ownerName: string;
  friendName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
}): Promise<Record<string, string>> {
  const { ownerUserId, ownerName, friendName, pupName, startAt, endAt } = params;
  const loginUrl = await getLoginUrl(ownerUserId);
  const dateTime = `${formatDateTime(startAt)} - ${formatTime(endAt)}`;

  return {
    '1': ownerName,
    '2': friendName,
    '3': pupName,
    '4': dateTime,
    '5': loginUrl,
  };
}

/**
 * Generate template variables for hangout_deleted template
 * Sent to friends when owner deletes an OPEN hangout
 */
export async function getHangoutDeletedTemplateVars(params: {
  friendUserId: string;
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
}): Promise<Record<string, string>> {
  const { friendUserId, friendName, ownerName, pupName, startAt, endAt } = params;
  const loginUrl = await getLoginUrl(friendUserId);
  const dateTime = `${formatDateTime(startAt)} - ${formatTime(endAt)}`;

  return {
    '1': friendName,
    '2': ownerName,
    '3': pupName,
    '4': dateTime,
    '5': loginUrl,
  };
}

/**
 * Generate template variables for hangout_cancelled template
 * Sent to the assigned friend when owner cancels/deletes an ASSIGNED hangout
 */
export async function getHangoutCancelledTemplateVars(params: {
  friendUserId: string;
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
}): Promise<Record<string, string>> {
  const { friendUserId, friendName, ownerName, pupName, startAt, endAt } = params;
  const loginUrl = await getLoginUrl(friendUserId);
  const dateTime = `${formatDateTime(startAt)} - ${formatTime(endAt)}`;

  return {
    '1': friendName,
    '2': ownerName,
    '3': pupName,
    '4': dateTime,
    '5': loginUrl,
  };
}

/**
 * Generate template variables for suggestion_approved template
 * Sent to the friend who suggested the hangout when the owner approves it
 */
export async function getSuggestionApprovedTemplateVars(params: {
  friendUserId: string;
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
  hangoutId: string;
}): Promise<Record<string, string>> {
  const { friendUserId, friendName, ownerName, pupName, startAt, endAt } = params;
  const loginUrl = await getLoginUrl(friendUserId);
  const dateTime = `${formatDateTime(startAt)} - ${formatTime(endAt)}`;

  return {
    '1': friendName,
    '2': ownerName,
    '3': pupName,
    '4': dateTime,
    '5': loginUrl,
  };
}

/**
 * Generate template variables for suggestion_rejected template
 * Sent to the friend who suggested the hangout when the owner rejects it
 */
export async function getSuggestionRejectedTemplateVars(params: {
  friendUserId: string;
  friendName: string;
  ownerName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
}): Promise<Record<string, string>> {
  const { friendUserId, friendName, ownerName, pupName, startAt, endAt } = params;
  const loginUrl = await getLoginUrl(friendUserId);
  const dateTime = `${formatDateTime(startAt)} - ${formatTime(endAt)}`;

  return {
    '1': friendName,
    '2': ownerName,
    '3': pupName,
    '4': dateTime,
    '5': loginUrl,
  };
}

/**
 * Generate template variables for suggestion_deleted template
 * Sent to the owner when a friend deletes their suggestion
 */
export async function getSuggestionDeletedTemplateVars(params: {
  ownerUserId: string;
  ownerName: string;
  friendName: string;
  pupName: string;
  startAt: Date;
  endAt: Date;
}): Promise<Record<string, string>> {
  const { ownerUserId, ownerName, friendName, pupName, startAt, endAt } = params;
  const loginUrl = await getLoginUrl(ownerUserId);
  const dateTime = `${formatDateTime(startAt)} - ${formatTime(endAt)}`;

  return {
    '1': ownerName,
    '2': friendName,
    '3': pupName,
    '4': dateTime,
    '5': loginUrl,
  };
}
