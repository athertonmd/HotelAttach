import { Outlet, NavLink } from 'react-router-dom';

const navItems = [
  { to: '/analytics/opportunities', label: 'Opportunities' },
  { to: '/analytics/duty-of-care', label: 'Duty of Care' },
  { to: '/analytics/engagement', label: 'Engagement' },
  { to: '/analytics/escalations', label: 'Escalations' },
];

export function Layout(): React.JSX.Element {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{ width: 220, padding: 16, borderRight: '1px solid #eee' }}>
        <h2>HCI Analytics</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {navItems.map((item) => (
            <li key={item.to} style={{ marginBottom: 8 }}>
              <NavLink to={item.to}>{item.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
