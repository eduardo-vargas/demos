import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LavaLampTheme, LAVA_LAMP_THEMES } from '../config/lavaLampThemes';

type ColorScheme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

interface AuthUser {
  email: string;
  authenticated: boolean;
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

/**
 * LOCAL DEV ONLY: Parse CF_Authorization cookie to simulate auth
 * WARNING: This should NEVER run in production - only for local dev
 */
function getLocalDevAuth(): AuthUser | null {
  // Only run in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  try {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const cfAuthCookie = getCookie('CF_Authorization');
    if (!cfAuthCookie) return null;

    // Decode JWT payload (basic JWT parsing - not validation!)
    const payload = JSON.parse(atob(cfAuthCookie.split('.')[1]));

    return {
      email: payload.email || 'dev@example.com',
      authenticated: true,
    };
  } catch (e) {
    console.warn('[DEV] Failed to parse CF_Authorization cookie:', e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize theme from localStorage or default to 'system'
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    // Check if user has a preference stored
    const stored = localStorage.getItem('theme') as ThemePreference | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
    return 'system';
  });

  // Initialize lava lamp theme from localStorage or default to 'aurora'
  const [lavaLampTheme, setLavaLampThemeState] = useState<LavaLampTheme>(() => {
    const stored = localStorage.getItem('lavaLampTheme') as LavaLampTheme | null;
    if (stored && Object.keys(LAVA_LAMP_THEMES).includes(stored)) {
      return stored;
    }
    return 'sunset';
  });

  // Initialize lava lamp enabled state from localStorage or default to true
  const [lavaLampEnabled, setLavaLampEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem('lavaLampEnabled');
    if (stored !== null) {
      return stored === 'true';
    }
    return false;
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  // Set lava lamp enabled function
  const setLavaLampEnabled = (enabled: boolean) => {
    setLavaLampEnabledState(enabled);
    localStorage.setItem('lavaLampEnabled', String(enabled));
  };

  // Set lava lamp theme function
  const setLavaLampTheme = (newTheme: LavaLampTheme) => {
    setLavaLampThemeState(newTheme);
    localStorage.setItem('lavaLampTheme', newTheme);
  };

  // Apply theme function
  const applyTheme = useCallback((scheme: ColorScheme) => {
    // Apply theme using multiple approaches to ensure compatibility
    document.documentElement.setAttribute('data-color-scheme', scheme);
    document.documentElement.style.colorScheme = scheme;

    // Also apply class-based theming as fallback
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

  // Set theme function
  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Listen to system theme changes and update colorScheme based on theme preference
  useEffect(() => {
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const scheme = mq.matches ? 'dark' : 'light';
      applyTheme(scheme);

      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme, applyTheme]);

  // Fetch auth status on mount
  useEffect(() => {
    // In dev mode, check for manually added CF_Authorization cookie first
    const localDevUser = getLocalDevAuth();
    if (localDevUser) {
      setUser(localDevUser);
      setLoading(false);
      return;
    }

    // Production: Always verify with API
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) {
          setUser({ email: data.email, authenticated: true });
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    window.location.href = '/api/auth/logout';
  };

  const login = () => {
    // Cloudflare Access will intercept and show login page
    // We just need to trigger a page reload or navigate
    window.location.reload();
  };

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
