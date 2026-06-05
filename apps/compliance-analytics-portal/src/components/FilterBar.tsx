interface FilterBarProps {
  onPriorityChange?: (value: string) => void;
  onTypeChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
}

const selectClasses =
  'px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';

export function FilterBar({
  onPriorityChange,
  onTypeChange,
  onStatusChange,
}: FilterBarProps): React.JSX.Element {
  return (
    <div data-testid="filter-bar" className="flex flex-wrap gap-3 mb-6">
      <select
        aria-label="Priority"
        className={selectClasses}
        onChange={(e) => onPriorityChange?.(e.target.value)}
      >
        <option value="">All Priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select
        aria-label="Type"
        className={selectClasses}
        onChange={(e) => onTypeChange?.(e.target.value)}
      >
        <option value="">All Types</option>
        <option value="missing_hotel">Missing Hotel</option>
        <option value="partial_coverage">Partial Coverage</option>
        <option value="duty_of_care_gap">Duty of Care</option>
      </select>
      <select
        aria-label="Status"
        className={selectClasses}
        onChange={(e) => onStatusChange?.(e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="awaiting_action">Awaiting Action</option>
        <option value="identified">Identified</option>
        <option value="communication_sent">Communication Sent</option>
        <option value="escalated">Escalated</option>
        <option value="closed">Closed</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );
}
