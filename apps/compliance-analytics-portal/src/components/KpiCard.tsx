interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles: Record<string, { border: string; text: string; bg: string }> = {
  default: { border: 'border-blue-200', text: 'text-blue-700', bg: 'bg-blue-50' },
  success: { border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  warning: { border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50' },
  danger: { border: 'border-red-200', text: 'text-red-700', bg: 'bg-red-50' },
};

const trendConfig: Record<string, { icon: string; color: string }> = {
  up: { icon: '↑', color: 'text-emerald-600' },
  down: { icon: '↓', color: 'text-red-600' },
  stable: { icon: '→', color: 'text-slate-500' },
};

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  variant = 'default',
}: KpiCardProps): React.JSX.Element {
  const styles = variantStyles[variant] ?? variantStyles.default;

  return (
    <div
      data-testid="kpi-card"
      data-variant={variant}
      className={`rounded-xl border ${styles.border} ${styles.bg} p-5 min-w-[200px] flex-1 shadow-sm`}
    >
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</div>
      <div className={`text-3xl font-bold mt-1 ${styles.text}`}>{value}</div>
      {(subtitle || trend) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend && (
            <span
              data-testid="kpi-trend"
              className={`text-sm font-semibold ${trendConfig[trend].color}`}
            >
              {trendConfig[trend].icon}
            </span>
          )}
          {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
