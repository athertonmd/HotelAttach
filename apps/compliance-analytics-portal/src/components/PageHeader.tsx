interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps): React.JSX.Element {
  return (
    <div data-testid="page-header" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        {actions && <div>{actions}</div>}
      </div>
      {description && <p style={{ color: '#666', marginTop: 4 }}>{description}</p>}
    </div>
  );
}
