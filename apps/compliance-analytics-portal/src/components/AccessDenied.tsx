import { useDemo } from '../auth/demo-context';
import { ROLE_LABELS } from '../auth/roles';

export function AccessDenied(): React.JSX.Element {
  const { role } = useDemo();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
      <p className="text-slate-600 max-w-md">
        Your current role ({ROLE_LABELS[role]}) does not have access to this dashboard. Switch to a
        different role using the sidebar selector.
      </p>
    </div>
  );
}
