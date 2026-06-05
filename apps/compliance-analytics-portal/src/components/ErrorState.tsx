interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps): React.JSX.Element {
  return (
    <div data-testid="error-state" role="alert" className="flex items-center justify-center py-20">
      <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 max-w-md text-center">
        <div className="text-red-600 text-lg mb-1">⚠️</div>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  );
}
