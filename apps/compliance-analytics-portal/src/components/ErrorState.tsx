interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps): React.JSX.Element {
  return (
    <div data-testid="error-state" role="alert" style={{ color: '#d32f2f', padding: 16 }}>
      {message}
    </div>
  );
}
