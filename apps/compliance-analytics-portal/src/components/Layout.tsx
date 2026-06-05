import { Outlet, NavLink } from 'react-router-dom';
import { useDemo } from '../auth/demo-context';
import { RoleSelector } from './RoleSelector';
import { TenantSelector } from './TenantSelector';
import { DemoBanner } from './DemoBanner';

const navItems = [
  { to: '/analytics/opportunities', label: 'Opportunities', icon: '📊' },
  { to: '/analytics/duty-of-care', label: 'Duty of Care', icon: '🛡️' },
  { to: '/analytics/engagement', label: 'Engagement', icon: '💬' },
  { to: '/analytics/escalations', label: 'Escalations', icon: '🚨' },
];

export function Layout(): React.JSX.Element {
  const { permissions } = useDemo();
  const visibleNav = navItems.filter((item) => permissions.dashboards.includes(item.to));

  return (
    <div className="flex h-screen bg-slate-50">
      <nav className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white tracking-tight">HCI Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Compliance Intelligence</p>
        </div>
        <ul className="flex-1 py-4 space-y-1 px-3">
          {visibleNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-700/70 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="border-t border-slate-700 py-3 space-y-1">
          <RoleSelector />
          <TenantSelector />
        </div>
        <div className="p-4 border-t border-slate-700 text-xs text-slate-500">v0.1.0 — Phase 1</div>
      </nav>
      <div className="flex-1 flex flex-col overflow-hidden">
        <DemoBanner />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
