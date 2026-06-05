interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  variant = 'default',
}: KpiCardProps): React.JSX.Element {
  return (
    <div
      data-testid="kpi-card"
      data-variant={variant}
      style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, minWidth: 180 }}
    >
      <div style={{ fontSize: 14, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#999' }}>{subtitle}</div>}
      {trend && (
        <div data-testid="kpi-trend" style={{ fontSize: 12 }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </div>
      )}
    </div>
  );
}
