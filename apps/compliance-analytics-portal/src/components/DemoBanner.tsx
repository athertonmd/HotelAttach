import { useDemo } from '../auth/demo-context';
import { ROLE_LABELS } from '../auth/roles';

export function DemoBanner(): React.JSX.Element {
  const { user, role, tmcName, corporateName } = useDemo();

  const scopeParts = [ROLE_LABELS[role], tmcName, corporateName].filter(Boolean);

  return (
    <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-sm text-amber-900 flex items-center gap-4">
      <span className="font-semibold">Demo Mode — Mock Data Only</span>
      <span className="text-amber-700">{user.email}</span>
      <span className="text-amber-600 text-xs">{scopeParts.join(' · ')}</span>
    </div>
  );
}
