type BadgeStatus =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'active'
  | 'closed'
  | 'rejected'
  | 'suppressed'
  | 'awaiting_action';

interface StatusBadgeProps {
  status: BadgeStatus;
}

const colors: Record<BadgeStatus, string> = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c',
  active: '#1976d2',
  closed: '#757575',
  rejected: '#d32f2f',
  suppressed: '#9e9e9e',
  awaiting_action: '#ff9800',
};

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  return (
    <span
      data-testid="status-badge"
      style={{
        backgroundColor: colors[status] ?? '#ccc',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
