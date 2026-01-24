import { useEffect, useCallback, useRef } from "react";

/**
 * Performance optimization hook that provides utilities for
 * cross-browser performance improvements
 */
export function usePerformanceOptimization() {
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  
  // Detect browser capabilities
  const browserInfo = useRef({
    isFirefox: typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox'),
    isSafari: typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    isChrome: typeof navigator !== 'undefined' && navigator.userAgent.includes('Chrome'),
    isEdge: typeof navigator !== 'undefined' && navigator.userAgent.includes('Edg'),
    isMobile: typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    supportsPassive: false,
    prefersReducedMotion: typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  });

  // Check for passive event listener support
  useEffect(() => {
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: function() {
          browserInfo.current.supportsPassive = true;
          return true;
        }
      });
      window.addEventListener('testPassive', null as any, opts);
      window.removeEventListener('testPassive', null as any, opts);
    } catch (e) {
      browserInfo.current.supportsPassive = false;
    }
  }, []);

  // Lazy load images with Intersection Observer
  const setupLazyLoading = useCallback((selector: string = 'img[data-lazy]') => {
    if (!('IntersectionObserver' in window)) {
      // Fallback for older browsers
      const images = document.querySelectorAll<HTMLImageElement>(selector);
      images.forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
      });
      return;
    }

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-lazy');
              intersectionObserverRef.current?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '100px 0px',
        threshold: 0.01
      }
    );

    const images = document.querySelectorAll(selector);
    images.forEach(img => intersectionObserverRef.current?.observe(img));

    return () => intersectionObserverRef.current?.disconnect();
  }, []);

  // Debounce function for expensive operations
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }, []);

  // Throttle function for scroll/resize handlers
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  // Request idle callback with fallback
  const requestIdleCallback = useCallback((callback: () => void) => {
    if ('requestIdleCallback' in window) {
      return (window as any).requestIdleCallback(callback);
    }
    return setTimeout(callback, 1);
  }, []);

  // Add passive event listeners
  const addPassiveEventListener = useCallback((
    element: HTMLElement | Window | Document,
    event: string,
    handler: EventListenerOrEventListenerObject
  ) => {
    const options = browserInfo.current.supportsPassive ? { passive: true } : false;
    element.addEventListener(event, handler, options as AddEventListenerOptions);
    return () => element.removeEventListener(event, handler, options as AddEventListenerOptions);
  }, []);

  // Preload images
  const preloadImages = useCallback((urls: string[]) => {
    urls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Get optimal animation config based on browser/device
  const getAnimationConfig = useCallback(() => {
    if (browserInfo.current.prefersReducedMotion) {
      return { duration: 0, enabled: false };
    }
    
    if (browserInfo.current.isMobile) {
      return { duration: 0.15, enabled: true, simplified: true };
    }
    
    if (browserInfo.current.isSafari) {
      // Safari sometimes struggles with complex animations
      return { duration: 0.2, enabled: true, simplified: false };
    }
    
    return { duration: 0.3, enabled: true, simplified: false };
  }, []);

  return {
    browserInfo: browserInfo.current,
    setupLazyLoading,
    debounce,
    throttle,
    requestIdleCallback,
    addPassiveEventListener,
    preloadImages,
    getAnimationConfig,
  };
}

/**
 * Hook to mark performance timing
 */
export function usePerformanceMarks(componentName: string) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance?.mark) {
      window.performance.mark(`${componentName}-mount`);
      
      return () => {
        window.performance.mark(`${componentName}-unmount`);
        try {
          window.performance.measure(
            `${componentName}-lifetime`,
            `${componentName}-mount`,
            `${componentName}-unmount`
          );
        } catch {
          // Ignore measurement errors
        }
      };
    }
  }, [componentName]);
}

/**
 * Hook for optimized scroll handling
 */
export function useOptimizedScroll(
  callback: (scrollY: number) => void,
  throttleMs: number = 16
) {
  const ticking = useRef(false);
  const lastKnownScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      lastKnownScrollY.current = window.scrollY;
      
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          callback(lastKnownScrollY.current);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, throttleMs]);
}

/**
 * Hook for viewport visibility detection
 */
export function useViewportVisibility(
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) {
  const isVisible = useRef(false);
  const hasBeenVisible = useRef(false);

  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window)) {
      isVisible.current = true;
      hasBeenVisible.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          hasBeenVisible.current = true;
        }
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);

  return { isVisible, hasBeenVisible };
}
