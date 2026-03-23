import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, ToastContainer } from '@react-spectrum/s2';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { useDynamicFavicon } from './hooks/useDynamicFavicon';
import { Header } from './components/Header';
import { HomePage, MeetingPage, MeetingAdminPage, AdminDashboard, MyMeetingsPage } from './pages';
import { LavaLamp } from './LavaLamp';
import './styles.css';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };

function AppContent() {
  const { colorScheme, lavaLampTheme } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useDynamicFavicon({ iconColorVar: '--iconPrimary', fillColorVar: '--lavaLampFill' });

  const [userToggled, setUserToggled] = useState<boolean | null>(null);

  useEffect(() => {
    setUserToggled(null);
  }, [location.pathname]);

  const defaultLavaLamp = isHomePage;
  const showLavaLamp = userToggled !== null ? userToggled : defaultLavaLamp;

  const handleToggle = () => {
    setUserToggled(!showLavaLamp);
  };

  const contentStyle = {
    height: 'calc(100vh - 60px)',
    overflowY: 'auto' as const,
    padding: '32px 32px 0px 32px',
  };

  const backgroundContainerStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden' as const,
    borderRadius: '16px 16px 0 0',
  };

  return (
    <Provider
      colorScheme={colorScheme}
      styles={style({ backgroundColor: 'Background' })}
      UNSAFE_style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header showLavaLamp={showLavaLamp} onToggleLavaLamp={handleToggle} />
      <main
        className={style({
          position: 'relative',
          zIndex: 1,
          marginX: 16,
          overflow: 'hidden',
          borderTopRadius: 'lg',
          borderBottomRadius: 'none',
          boxShadow: '[0 0px 8px -4px var(--lavaLampFill)]',
          backgroundColor: 'layer-1',
        })}
      >
        {showLavaLamp && (
          <div style={backgroundContainerStyle}>
            <LavaLamp colorTheme={lavaLampTheme} style={{ position: 'absolute', inset: 0 }} />
          </div>
        )}
        <div style={contentStyle}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="/my-meetings" element={<MyMeetingsPage />} />
              <Route path="/:meetingId" element={<MeetingPage />} />
              <Route path="/:meetingId/admin" element={<MeetingAdminPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>
      <ToastContainer placement="bottom end" />
    </Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
