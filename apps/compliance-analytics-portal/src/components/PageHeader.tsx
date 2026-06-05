interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps): React.JSX.Element {
  return (
    <div data-testid="page-header" className="mb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {actions && <div>{actions}</div>}
      </div>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}
