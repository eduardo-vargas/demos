import { ToggleButtonGroup, ToggleButton } from '@react-spectrum/s2';
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };
import DeviceLaptop from '@react-spectrum/s2/icons/DeviceLaptop';
import Lighten from '@react-spectrum/s2/icons/Lighten';
import Contrast from '@react-spectrum/s2/icons/Contrast';
import { useAuth } from '../hooks/useAuth';

export function ThemeSwitcher() {
  const { theme, setTheme } = useAuth();

  return (
    <div style={{ width: '100%', padding: '0 4px' }}>
      <ToggleButtonGroup
        aria-label="Theme selection"
        selectionMode="single"
        selectedKeys={[theme]}
        size="L"
        onSelectionChange={keys => {
          const selected = Array.from(keys)[0] as 'light' | 'dark' | 'system';
          if (selected) setTheme(selected);
        }}
        density="compact"
        UNSAFE_style={{ justifyContent: 'center' }}
        styles={style({ marginBottom: 8, width: '100%' })}
      >
        <ToggleButton id="system" aria-label="System theme">
          <DeviceLaptop />
        </ToggleButton>
        <ToggleButton id="light" aria-label="Light theme">
          <Lighten />
        </ToggleButton>
        <ToggleButton id="dark" aria-label="Dark theme">
          <Contrast />
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}
