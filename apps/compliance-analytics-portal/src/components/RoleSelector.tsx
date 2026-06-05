import { useDemo } from '../auth/demo-context';
import { ROLE_LABELS } from '../auth/roles';
import { DEMO_USERS } from '../auth/demo-users';

export function RoleSelector(): React.JSX.Element {
  const { user, setUser } = useDemo();

  return (
    <div className="px-3 py-2">
      <label htmlFor="role-selector" className="block text-xs text-slate-400 mb-1">
        Demo User
      </label>
      <select
        id="role-selector"
        aria-label="Role"
        value={user.id}
        onChange={(e) => {
          const selected = DEMO_USERS.find((u) => u.id === e.target.value);
          if (selected) setUser(selected);
        }}
        className="w-full bg-slate-800 text-slate-200 text-xs rounded px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-slate-400"
      >
        {DEMO_USERS.map((u) => (
          <option key={u.id} value={u.id}>
            {ROLE_LABELS[u.role]} — {u.email}
          </option>
        ))}
      </select>
    </div>
  );
}
