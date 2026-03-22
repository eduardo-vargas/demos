import { useState, useEffect } from 'react';

function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(m.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    m.addEventListener('change', listener);
    return () => m.removeEventListener('change', listener);
  }, [breakpoint]);

  return isMobile;
}

export function useBreakpoint(): 'base' | 'S' | 'M' | 'L' | 'XL' {
  const isBase = useMatchMedia('(max-width: 480px)');
  const isS = useMatchMedia('(min-width: 481px) and (max-width: 700px)');
  const isM = useMatchMedia('(min-width: 701px) and (max-width: 1000px)');
  const isL = useMatchMedia('(min-width: 1001px) and (max-width: 1300px)');
  // const isXL = useMatchMedia('(min-width: 1301px)');

  if (isBase) return 'base';
  if (isS) return 'S';
  if (isM) return 'M';
  if (isL) return 'L';
  return 'XL';
}
