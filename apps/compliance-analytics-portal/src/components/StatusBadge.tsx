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

const badgeStyles: Record<BadgeStatus, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  suppressed: 'bg-slate-100 text-slate-500 border-slate-200',
  awaiting_action: 'bg-amber-100 text-amber-700 border-amber-200',
};

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  const classes = badgeStyles[status] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${classes}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
