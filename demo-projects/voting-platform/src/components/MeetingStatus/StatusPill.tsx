import { Badge } from '@react-spectrum/s2';

interface StatusPillProps {
  status: 'Active' | 'Closed';
  size?: 'S' | 'XS';
}

export function StatusPill({ status, size = 'S' }: StatusPillProps) {
  const compactStyles =
    size === 'XS'
      ? ({
          fontSize: '0.75rem',
          lineHeight: 1,
          minHeight: 'auto',
          height: '18px',
          padding: '0 4px',
          display: 'inline-flex',
          alignItems: 'center',
        } as const)
      : undefined;

  return (
    <span style={{ display: 'inline-block', width: 'fit-content' }}>
      <Badge variant={status === 'Active' ? 'positive' : 'neutral'} UNSAFE_style={compactStyles}>
        {status}
      </Badge>
    </span>
  );
}
