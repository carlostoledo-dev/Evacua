import { useEffect, useState } from 'react';

/**
 * Live height (px) of an element's border box via ResizeObserver; 0 until measured.
 * Returns a callback ref to put on the element.
 */
export function useElementHeight(): [(element: HTMLElement | null) => void, number] {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      // Border box: padding and safe-area insets count, they cover the map too.
      if (entry) setHeight(Math.round(entry.target.getBoundingClientRect().height));
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [element]);
  return [setElement, height];
}
