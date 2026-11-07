import { useState, useEffect, useMemo, RefObject } from 'react';

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

export interface UseVirtualizerOptions {
  count: number;
  itemHeight: number;
  overscan?: number;
  containerRef: RefObject<HTMLElement | null>;
}

export interface VirtualizerResult {
  virtualItems: VirtualItem[];
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  offsetTop: number;
  offsetBottom: number;
  isVirtualized: boolean;
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
}

/**
 * High-performance, zero-dependency virtual windowing hook for React 19.
 * Computes visible range with overscan buffer based on scroll offset and container dimensions.
 */
export function useVirtualizer({
  count,
  itemHeight,
  overscan = 5,
  containerRef,
}: UseVirtualizerOptions): VirtualizerResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Measure container height and listen to ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setContainerHeight(el.clientHeight || 600);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === el) {
          setContainerHeight(entry.contentRect.height || el.clientHeight || 600);
        }
      }
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // Handle scroll events with RAF (requestAnimationFrame) throttling for ultra smooth 60fps
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        if (el) {
          setScrollTop(el.scrollTop);
        }
        rafId = null;
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    // Initial read
    setScrollTop(el.scrollTop);

    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [containerRef]);

  const { virtualItems, totalHeight, startIndex, endIndex, offsetTop, offsetBottom } = useMemo(() => {
    const totalHeight = count * itemHeight;

    if (count === 0) {
      return {
        virtualItems: [],
        totalHeight: 0,
        startIndex: 0,
        endIndex: -1,
        offsetTop: 0,
        offsetBottom: 0,
      };
    }

    // Calculate start and end indices based on scrollTop and containerHeight
    const rawStartIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const rawEndIndex = rawStartIndex + visibleCount;

    const startIndex = Math.max(0, rawStartIndex - overscan);
    const endIndex = Math.min(count - 1, rawEndIndex + overscan);

    const virtualItems: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        start: i * itemHeight,
        size: itemHeight,
      });
    }

    const offsetTop = startIndex * itemHeight;
    const offsetBottom = Math.max(0, (count - 1 - endIndex) * itemHeight);

    return {
      virtualItems,
      totalHeight,
      startIndex,
      endIndex,
      offsetTop,
      offsetBottom,
    };
  }, [count, itemHeight, overscan, scrollTop, containerHeight]);

  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current;
    if (!el) return;
    const targetScroll = Math.max(0, Math.min(index * itemHeight, totalHeight - containerHeight));
    el.scrollTo({ top: targetScroll, behavior });
  };

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    offsetTop,
    offsetBottom,
    isVirtualized: count > 10,
    scrollToIndex,
  };
}
