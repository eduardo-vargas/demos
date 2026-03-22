import { ColorSwatch } from '@react-spectrum/s2';
import { useAuth } from '../hooks/useAuth';
import { LAVA_LAMP_THEME_LIST } from '../config/lavaLampThemes';
import { useEffect } from 'react';

export function LavaLampThemePicker() {
  const { lavaLampTheme, setLavaLampTheme } = useAuth();

  useEffect(() => {
    const currentTheme = LAVA_LAMP_THEME_LIST.find(t => t.id === lavaLampTheme);
    if (currentTheme) {
      document.documentElement.style.setProperty('--lavaLampFill', currentTheme.color);
    }
  }, [lavaLampTheme]);

  return (
    <div style={{ padding: '12px 16px' }}>
      <div
        style={{
          marginBottom: 8,
          fontSize: '14px',
          color: 'var(--spectrum-neutral-content-color-default)',
        }}
      >
        Lava Lamp Theme
      </div>
      <div style={{ display: 'flex', gap: 8 }} role="radiogroup" aria-label="Lava Lamp Theme">
        {LAVA_LAMP_THEME_LIST.map(theme => {
          const isSelected = lavaLampTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => {
                setLavaLampTheme(theme.id);
                document.documentElement.style.setProperty('--lavaLampFill', theme.color);
              }}
              title={theme.label}
              aria-checked={isSelected}
              role="radio"
              style={{
                cursor: 'pointer',
                padding: 4,
                borderRadius: '12px',
                border: isSelected ? '3px solid #1473e6' : 'none',
                background: isSelected ? 'rgba(20, 115, 230, 0.1)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
              onFocus={e => {
                if (isSelected) {
                  e.currentTarget.style.boxShadow = '0 0 0 6px rgba(20, 115, 230, 0.4)';
                }
              }}
              onBlur={e => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <ColorSwatch color={theme.color} size="M" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
