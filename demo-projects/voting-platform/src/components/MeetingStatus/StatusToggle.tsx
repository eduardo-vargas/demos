import { style } from '@react-spectrum/s2/style' with { type: 'macro' };

interface StatusToggleProps {
  value: 'Active' | 'Closed';
  onChange: (status: 'Active' | 'Closed') => void;
}

const activeButtonStyle = style({
  backgroundColor: 'positive',
  color: 'white',
  fontWeight: 'bold',
  borderRadius: 'lg',
  borderWidth: 0,
  borderStyle: 'none',
  borderColor: 'transparent',
});

const inactiveButtonStyle = style({
  backgroundColor: 'gray-100',
  color: 'gray-700',
  fontWeight: 'normal',
  borderRadius: 'lg',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'white',
});

const closedActiveStyle = style({
  backgroundColor: 'negative',
  color: 'white',
  fontWeight: 'bold',
  borderRadius: 'lg',
  borderWidth: 0,
  borderStyle: 'none',
  borderColor: 'transparent',
});

export function StatusToggle({ value, onChange }: StatusToggleProps) {
  const activeClass = value === 'Active' ? activeButtonStyle : inactiveButtonStyle;
  const closedClass = value === 'Closed' ? closedActiveStyle : inactiveButtonStyle;

  return (
    <div>
      <label
        htmlFor="status-toggle"
        className={style({ font: 'body-sm', color: 'neutral-subdued' })}
      >
        Status
      </label>
      <div
        id="status-toggle"
        style={{ display: 'flex', gap: 4, marginTop: 4, width: '100%', boxSizing: 'border-box' }}
      >
        <button
          className={activeClass}
          style={{ flex: 1, padding: '8px 16px', cursor: 'pointer' }}
          onClick={() => onChange('Active')}
        >
          Active
        </button>
        <button
          className={closedClass}
          style={{ flex: 1, padding: '8px 16px', cursor: 'pointer' }}
          onClick={() => onChange('Closed')}
        >
          Closed
        </button>
      </div>
    </div>
  );
}

export function sanitizeEmail(email: string): string {
  const atIndex = email.indexOf('@');
  return atIndex > 0 ? email.substring(0, atIndex) : email;
}
