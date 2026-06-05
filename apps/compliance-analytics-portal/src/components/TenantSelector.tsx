import { useDemo } from '../auth/demo-context';
import { DEMO_TMCS, DEMO_CORPORATES } from '../auth/demo-users';

export function TenantSelector(): React.JSX.Element {
  const { permissions, tmcId, tmcName, corporateId, corporateName, setTmcId, setCorporateId } =
    useDemo();

  const corporates = tmcId ? (DEMO_CORPORATES[tmcId] ?? []) : [];

  return (
    <div className="px-3 py-2 space-y-2">
      {permissions.showTmcSelector && (
        <div>
          <label htmlFor="tenant-selector" className="block text-xs text-slate-400 mb-1">
            TMC Tenant
          </label>
          <select
            id="tenant-selector"
            value={tmcId ?? ''}
            onChange={(e) => setTmcId(e.target.value || null)}
            className="w-full bg-slate-800 text-slate-200 text-xs rounded px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-slate-400"
          >
            <option value="">All TMCs</option>
            {DEMO_TMCS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!permissions.showTmcSelector && tmcName && (
        <div className="text-xs text-slate-400">
          <span className="block text-slate-500 font-medium">TMC</span>
          {tmcName}
        </div>
      )}

      {permissions.showCorporateSelector && (
        <div>
          <label htmlFor="corporate-selector" className="block text-xs text-slate-400 mb-1">
            Corporate
          </label>
          <select
            id="corporate-selector"
            value={corporateId ?? ''}
            onChange={(e) => setCorporateId(e.target.value || null)}
            className="w-full bg-slate-800 text-slate-200 text-xs rounded px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-slate-400"
          >
            <option value="">All Corporates</option>
            {corporates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!permissions.showCorporateSelector && corporateName && (
        <div className="text-xs text-slate-400">
          <span className="block text-slate-500 font-medium">Corporate</span>
          {corporateName}
        </div>
      )}
    </div>
  );
}
