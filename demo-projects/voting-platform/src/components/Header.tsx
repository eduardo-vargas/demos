import {
  Button,
  MenuTrigger,
  Menu,
  MenuItem,
  Text,
  Divider,
  Popover,
  ToggleButton,
} from '@react-spectrum/s2';
import { useNavigate } from 'react-router-dom';
import User from '@react-spectrum/s2/icons/User';
import { useAuth } from '../hooks/useAuth';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LavaLampThemePicker } from './LavaLampThemePicker';
import Group from '@react-spectrum/s2/icons/Group';
import LavaLampIcon from './icons/LavaLamp';
import { AuthenticateWithCloudflare } from './AuthenticateWithCloudflare';

interface HeaderProps {
  showLavaLamp: boolean;
  onToggleLavaLamp: () => void;
}

export function Header({ showLavaLamp, onToggleLavaLamp }: HeaderProps) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="header-content">
        <h1
          style={{ fontWeight: 600, fontSize: '1.125rem', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Voting Platform
        </h1>

        <div className="header-actions">
          {!loading && !user && <AuthenticateWithCloudflare />}

          {!loading && user && (
            <>
              <ToggleButton
                isQuiet
                size="M"
                isSelected={showLavaLamp}
                onPress={onToggleLavaLamp}
                aria-label="Toggle lava lamp background"
              >
                <LavaLampIcon />
              </ToggleButton>
              <MenuTrigger>
                <Button variant="genai" aria-label="Profile">
                  <User />
                </Button>
                <Popover hideArrow UNSAFE_style={{ width: 280 }}>
                  {user && (
                    <>
                      <div className="profile-email">
                        <Text UNSAFE_style={{ fontWeight: 500 }}>{user.email}</Text>
                      </div>
                      <Divider />
                    </>
                  )}
                  <Menu
                    onAction={key => {
                      if (key === 'my-meetings') {
                        navigate('/my-meetings');
                      } else if (key === 'logout') {
                        logout();
                      }
                    }}
                  >
                    <MenuItem id="my-meetings">
                      <Group />
                      <Text>My Meetings</Text>
                    </MenuItem>
                  </Menu>
                  <Divider />
                  <LavaLampThemePicker />
                  <ThemeSwitcher />
                  <Menu onAction={key => key === 'logout' && logout()}>
                    <MenuItem id="logout">Sign out</MenuItem>
                  </Menu>
                </Popover>
              </MenuTrigger>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
