import { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { LavaLampTheme, LAVA_LAMP_THEMES, LAVA_LAMP_THEME_LIST } from '../config/lavaLampThemes';
import { ToastQueue } from '@react-spectrum/s2';

type ColorScheme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface AuthUser {
  email: string;
  authenticated: boolean;
  exp?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  theme: ThemePreference;
  colorScheme: ColorScheme;
  setTheme: (theme: ThemePreference) => void;
  lavaLampTheme: LavaLampTheme;
  setLavaLampTheme: (theme: LavaLampTheme) => void;
  lavaLampEnabled: boolean;
  setLavaLampEnabled: (enabled: boolean) => void;
  logout: () => void;
  login: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// ==================== UTILITY FUNCTIONS ====================

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
  return null;
}

/**
 * Deletes all Cloudflare Access cookies by name prefix.
 * Attempts multiple path variations to ensure deletion across different cookie scopes.
 */
function deleteCFCookies(): void {
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
    if (name.startsWith('CF_')) {
      // Try common paths to ensure deletion across subdomains/paths
      const paths = ['/', '/api', '/app', ''];
      paths.forEach(path => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
      });
      // Also try without path (for root domain cookies)
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  });
}

interface JWTPayload {
  email?: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Parses the Cloudflare Authorization cookie and checks expiration.
 * Returns the JWT payload and whether the token is expired.
 */
function parseCFCookie(): { payload: JWTPayload; isExpired: boolean } | null {
  const cookie = getCookie('CF_Authorization');
  if (!cookie) return null;

  try {
    const payload = JSON.parse(atob(cookie.split('.')[1])) as JWTPayload;
    const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : false;
    return { payload, isExpired };
  } catch {
    return null;
  }
}

// ==================== PROVIDER ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Theme state
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem('theme') as ThemePreference | null;
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
  });

  const [lavaLampTheme, setLavaLampThemeState] = useState<LavaLampTheme>(() => {
    const stored = localStorage.getItem('lavaLampTheme') as LavaLampTheme | null;
    return stored && Object.keys(LAVA_LAMP_THEMES).includes(stored) ? stored : 'sunset';
  });

  const [lavaLampEnabled, setLavaLampEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem('lavaLampEnabled');
    return stored !== null ? stored === 'true' : false;
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  // Use ref for expiration interval to avoid stale closures
  const expirationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastWarningRef = useRef<number>(0);

  // Theme setters
  const setLavaLampEnabled = useCallback((enabled: boolean) => {
    setLavaLampEnabledState(enabled);
    localStorage.setItem('lavaLampEnabled', String(enabled));
  }, []);

  const setLavaLampTheme = useCallback((newTheme: LavaLampTheme) => {
    setLavaLampThemeState(newTheme);
    localStorage.setItem('lavaLampTheme', newTheme);
  }, []);

  const setTheme = useCallback((newTheme: ThemePreference) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  // Apply theme
  const applyTheme = useCallback((scheme: ColorScheme) => {
    document.documentElement.setAttribute('data-color-scheme', scheme);
    document.documentElement.style.colorScheme = scheme;
    document.documentElement.classList.remove(
      'spectrum--light',
      'spectrum--dark',
      'spectrum--darkest'
    );
    document.documentElement.classList.add(
      scheme === 'dark' ? 'spectrum--dark' : 'spectrum--light'
    );
    setColorScheme(scheme);
  }, []);

  // Set lava lamp CSS variable
  useEffect(() => {
    const currentTheme = LAVA_LAMP_THEME_LIST.find(t => t.id === lavaLampTheme);
    if (currentTheme) {
      document.documentElement.style.setProperty('--lavaLampFill', currentTheme.color);
    }
  }, [lavaLampTheme]);

  // System theme listener
  useEffect(() => {
    if (theme !== 'system') {
      applyTheme(theme);
      return;
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mq.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  // Auth initialization
  useEffect(() => {
    const jwtInfo = parseCFCookie();

    // Dev mode: use cookie for auth
    if (!import.meta.env.PROD && jwtInfo) {
      if (jwtInfo.isExpired) {
        deleteCFCookies();
        setLoading(false);
        return;
      }
      setUser({
        email: jwtInfo.payload.email || 'dev@example.com',
        authenticated: true,
        exp: jwtInfo.payload.exp,
      });
      setLoading(false);
      return;
    }

    // Production: verify with API
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        const contentType = r.headers.get('content-type');
        if (contentType?.includes('application/json')) return r.json();
        const text = await r.text();
        if (text.includes('authenticated')) return JSON.parse(text);
        return { authenticated: false };
      })
      .then(data => {
        if (data.authenticated) {
          setUser({ email: data.email, authenticated: true });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Session expiration monitoring
  useEffect(() => {
    if (!user?.exp) {
      if (expirationIntervalRef.current) {
        clearInterval(expirationIntervalRef.current);
        expirationIntervalRef.current = null;
      }
      return;
    }

    const handleExpiration = () => {
      const expMs = user.exp! * 1000;
      const timeLeft = expMs - Date.now();

      if (timeLeft <= 0) {
        ToastQueue.negative('Session expired', { timeout: 2000 });
        deleteCFCookies();
        setUser(null);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      // Warn at 60s, 30s, 10s, 5s marks (not every 5 seconds)
      if (timeLeft <= 60000 && timeLeft > 0) {
        const warningMarks = [60, 30, 10, 5];
        const seconds = Math.ceil(timeLeft / 1000);
        const shouldWarn = warningMarks.some(mark => {
          const inRange = seconds <= mark && seconds > mark - 5;
          const notRecent = Date.now() - lastWarningRef.current > 4500;
          return inRange && notRecent;
        });

        if (shouldWarn) {
          ToastQueue.negative(`Session expiring in ${seconds}s`, { timeout: 2500 });
          lastWarningRef.current = Date.now();
        }
      }
    };

    expirationIntervalRef.current = setInterval(handleExpiration, 1000);
    handleExpiration();

    return () => {
      if (expirationIntervalRef.current) {
        clearInterval(expirationIntervalRef.current);
        expirationIntervalRef.current = null;
      }
    };
  }, [user?.exp]);

  const logout = useCallback(async () => {
    setUser(null);

    // Call API to clear server-side cookies
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Silently fail - client-side logout already completed
    }

    // Also clear client-side cookies
    deleteCFCookies();
  }, []);

  const login = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        colorScheme,
        setTheme,
        lavaLampTheme,
        setLavaLampTheme,
        lavaLampEnabled,
        setLavaLampEnabled,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
