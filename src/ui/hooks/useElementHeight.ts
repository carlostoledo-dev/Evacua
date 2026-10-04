import { useEffect, useState } from 'react';

/**
 * Live height (px) of an element via ResizeObserver; 0 until measured.
 * Returns a callback ref to put on the element.
 */
export function useElementHeight(): [(element: HTMLElement | null) => void, number] {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(Math.round(entry.contentRect.height));
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [element]);
  return [setElement, height];
}
