'use client';

import { useSwipeable, SwipeEventData } from 'react-swipeable';
import { useCallback, useState } from 'react';

type UseCalendarGesturesOptions = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
};

export function useCalendarGestures({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: UseCalendarGesturesOptions) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSwiping = useCallback((eventData: SwipeEventData) => {
    if (isAnimating) return;

    // Only handle horizontal swipes
    if (Math.abs(eventData.deltaX) > Math.abs(eventData.deltaY)) {
      // Limit the offset for a subtle visual feedback
      const maxOffset = 100;
      const offset = Math.max(-maxOffset, Math.min(maxOffset, eventData.deltaX));
      setSwipeOffset(offset);
    }
  }, [isAnimating]);

  const handleSwiped = useCallback((eventData: SwipeEventData) => {
    if (isAnimating) return;

    const { deltaX, velocity } = eventData;

    // Either a long swipe or a fast swipe triggers navigation
    const isSignificantSwipe = Math.abs(deltaX) > threshold || velocity > 0.5;

    if (isSignificantSwipe) {
      setIsAnimating(true);

      if (deltaX < 0) {
        // Swiped left -> go to next month
        setSwipeOffset(-100);
        setTimeout(() => {
          onSwipeLeft();
          setSwipeOffset(0);
          setIsAnimating(false);
        }, 150);
      } else {
        // Swiped right -> go to previous month
        setSwipeOffset(100);
        setTimeout(() => {
          onSwipeRight();
          setSwipeOffset(0);
          setIsAnimating(false);
        }, 150);
      }
    } else {
      // Reset offset with animation
      setSwipeOffset(0);
    }
  }, [isAnimating, onSwipeLeft, onSwipeRight, threshold]);

  const handlers = useSwipeable({
    onSwiping: handleSwiping,
    onSwiped: handleSwiped,
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 10,
  });

  return {
    handlers,
    swipeOffset,
    isAnimating,
  };
}
