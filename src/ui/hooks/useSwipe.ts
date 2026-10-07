import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';

/** A drag shorter than this (px) is a tap, not a swipe. */
const TAP_SLOP_PX = 8;
/** A drag past this (px) up or down counts as a swipe in that direction. */
const SWIPE_PX = 40;

interface SwipeOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  /** How far (px) the sheet may follow the finger upwards; downwards it follows freely. */
  maxUp?: number;
}

/**
 * Vertical swipe on a sheet, as on iOS: `style` makes the sheet follow the finger and spring
 * back; a long enough drag up or down calls the matching action. A tap is still a tap (buttons
 * keep working, and keyboard users have the same actions on real buttons).
 */
export function useSwipe({ onSwipeUp, onSwipeDown, maxUp = 40 }: SwipeOptions) {
  const startRef = useRef<{ y: number; moved: boolean } | null>(null);
  // Set after a swipe, so the click that the browser fires on release is ignored.
  const swallowClickRef = useRef(false);
  const [offset, setOffset] = useState<number | null>(null);

  const style: CSSProperties | undefined =
    offset === null
      ? undefined
      : { transform: `translateY(${String(offset)}px)`, transition: 'none' };

  const handlers = {
    onPointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      startRef.current = { y: event.clientY, moved: false };
    },
    onPointerMove(event: PointerEvent) {
      const drag = startRef.current;
      if (!drag) return;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.abs(dy) < TAP_SLOP_PX) return;
      if (!drag.moved) {
        drag.moved = true;
        // Keep receiving the moves even if the finger leaves the sheet.
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      }
      setOffset(Math.max(-maxUp, dy));
    },
    onPointerUp(event: PointerEvent) {
      const drag = startRef.current;
      startRef.current = null;
      setOffset(null);
      if (!drag) return;
      const dy = event.clientY - drag.y;
      // Some browsers send few or no moves for a quick flick: judge by where the finger ended.
      if (!drag.moved && Math.abs(dy) < TAP_SLOP_PX) return;
      // The browser fires that click (if at all) right after this event: forget it afterwards,
      // or the next real tap would be lost.
      swallowClickRef.current = true;
      setTimeout(() => {
        swallowClickRef.current = false;
      }, 0);
      if (dy <= -SWIPE_PX) onSwipeUp?.();
      else if (dy >= SWIPE_PX) onSwipeDown?.();
    },
    onPointerCancel() {
      startRef.current = null;
      setOffset(null);
    },
    onClickCapture(event: MouseEvent) {
      if (!swallowClickRef.current) return;
      swallowClickRef.current = false;
      event.stopPropagation();
      event.preventDefault();
    },
  };
  return { handlers, style };
}
