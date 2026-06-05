interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'No data available' }: EmptyStateProps): React.JSX.Element {
  return (
    <div data-testid="empty-state" style={{ padding: 32, textAlign: 'center', color: '#999' }}>
      {message}
    </div>
  );
}
