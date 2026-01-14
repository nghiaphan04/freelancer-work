"use client";

import { useRef, useEffect, useCallback } from "react";

interface UseScrollPositionOptions {
  onLoadMore?: () => void;
  hasMore: boolean;
  loading: boolean;
  itemsLength: number;
  loadMoreThreshold?: number;
}

export function useScrollPosition({
  onLoadMore,
  hasMore,
  loading,
  itemsLength,
  loadMoreThreshold = 50,
}: UseScrollPositionOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevItemsLengthRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || itemsLength === 0) return;

    const prevLength = prevItemsLengthRef.current;
    const currentLength = itemsLength;
    const prevScrollHeight = prevScrollHeightRef.current;

    if (prevLength === 0 && currentLength > 0) {
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: "auto" });
        prevItemsLengthRef.current = currentLength;
        prevScrollHeightRef.current = container.scrollHeight;
      });
      return;
    }

    if (currentLength > prevLength && prevScrollHeight > 0) {
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const heightDiff = newScrollHeight - prevScrollHeight;

        if (heightDiff > 0 && container.scrollTop < 200) {
          container.scrollTop = heightDiff + container.scrollTop;
        } else if (container.scrollTop + container.clientHeight >= prevScrollHeight - 100) {
          endRef.current?.scrollIntoView({ behavior: "smooth" });
        }

        prevItemsLengthRef.current = currentLength;
        prevScrollHeightRef.current = container.scrollHeight;
      });
      return;
    }

    prevItemsLengthRef.current = currentLength;
    prevScrollHeightRef.current = container.scrollHeight;
  }, [itemsLength]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !hasMore || loading) return;

    const { scrollTop, scrollHeight } = container;

    if (scrollTop < loadMoreThreshold) {
      prevScrollHeightRef.current = scrollHeight;
      prevItemsLengthRef.current = itemsLength;
      onLoadMore?.();
    }
  }, [hasMore, loading, itemsLength, loadMoreThreshold, onLoadMore]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior });
  }, []);

  const scrollToElement = useCallback((element: HTMLElement | null, behavior: ScrollBehavior = "smooth") => {
    element?.scrollIntoView({ behavior, block: "center" });
  }, []);

  return {
    containerRef,
    endRef,
    handleScroll,
    scrollToBottom,
    scrollToElement,
  };
}
