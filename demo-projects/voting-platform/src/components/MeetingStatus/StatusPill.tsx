import { Badge } from '@react-spectrum/s2';

interface StatusPillProps {
  status: 'Active' | 'Closed';
}

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span style={{ display: 'inline-block', width: 'fit-content' }}>
      <Badge variant={status === 'Active' ? 'positive' : 'neutral'}>{status}</Badge>
    </span>
  );
}
