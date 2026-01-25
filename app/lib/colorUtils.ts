// Color and styling utilities for calendar events

import type { HangoutStatus } from '@prisma/client';

// Color palette for friend assignment (12 distinct colors)
const FRIEND_COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#7C3AED', // Violet
];

// Color constants for different hangout states
export const OPEN_HANGOUT_COLOR = '#FDE68A'; // Yellow - unassigned
export const SUGGESTED_HANGOUT_COLOR = '#BFDBFE'; // Light blue - suggestions

/**
 * Generate a consistent color for a friend based on their user ID.
 * Uses a simple hash function to map UUID to color palette.
 */
export function getFriendColor(friendUserId: string): string {
  // Simple hash: sum character codes
  let hash = 0;
  for (let i = 0; i < friendUserId.length; i++) {
    hash = friendUserId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Map to palette index
  const index = Math.abs(hash) % FRIEND_COLOR_PALETTE.length;
  return FRIEND_COLOR_PALETTE[index];
}

/**
 * Get border and opacity styles based on hangout status
 */
export function getHangoutStyles(status: HangoutStatus): {
  opacity: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderWidth: number;
} {
  switch (status) {
    case 'ASSIGNED':
      return { opacity: 1, borderStyle: 'solid', borderWidth: 2 };
    case 'OPEN':
      return { opacity: 0.4, borderStyle: 'dashed', borderWidth: 2 };
    case 'COMPLETED':
    case 'CANCELLED':
      return { opacity: 0.3, borderStyle: 'solid', borderWidth: 1 };
    default:
      return { opacity: 1, borderStyle: 'solid', borderWidth: 2 };
  }
}

/**
 * Get styles for suggested hangouts
 */
export function getSuggestionStyles(): {
  opacity: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderWidth: number;
} {
  return { opacity: 0.3, borderStyle: 'dotted', borderWidth: 2 };
}

/**
 * Generate a title for a hangout event.
 * Uses custom eventName if provided, otherwise generates from pup and friend names.
 */
export function generateHangoutTitle(hangout: {
  eventName: string | null;
  pup: { name: string };
  assignedFriend?: { name: string } | null;
  status: HangoutStatus;
}): string {
  // Use custom event name if provided
  if (hangout.eventName && hangout.eventName.trim()) {
    return hangout.eventName;
  }

  // Auto-generate from pup and friend
  const pupName = hangout.pup.name;

  if (hangout.status === 'ASSIGNED' && hangout.assignedFriend) {
    return `${pupName} - ${hangout.assignedFriend.name}`;
  }

  return `${pupName} (Open)`;
}

/**
 * Generate a title for a hangout suggestion.
 */
export function generateSuggestionTitle(suggestion: {
  pup: { name: string };
  suggestedByFriend: { name: string };
}): string {
  return `${suggestion.pup.name} - ${suggestion.suggestedByFriend.name}`;
}

/**
 * Truncate long event names for display
 */
export function truncateEventName(name: string, maxLength: number = 50): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + '...';
}

/**
 * Format time range for display
 */
export function formatTimeRange(start: Date, end: Date): string {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const startDate = formatDate(start);
  const endDate = formatDate(end);

  // Same day
  if (startDate === endDate) {
    return `${startDate} ${formatTime(start)} - ${formatTime(end)}`;
  }

  // Different days
  return `${startDate} ${formatTime(start)} - ${endDate} ${formatTime(end)}`;
}
