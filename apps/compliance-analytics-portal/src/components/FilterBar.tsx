interface FilterBarProps {
  onPriorityChange?: (value: string) => void;
  onTypeChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
}

export function FilterBar({
  onPriorityChange,
  onTypeChange,
  onStatusChange,
}: FilterBarProps): React.JSX.Element {
  return (
    <div data-testid="filter-bar" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <select aria-label="Priority" onChange={(e) => onPriorityChange?.(e.target.value)}>
        <option value="">All Priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select aria-label="Type" onChange={(e) => onTypeChange?.(e.target.value)}>
        <option value="">All Types</option>
        <option value="missing_hotel">Missing Hotel</option>
        <option value="partial_coverage">Partial Coverage</option>
        <option value="duty_of_care_gap">Duty of Care</option>
      </select>
      <select aria-label="Status" onChange={(e) => onStatusChange?.(e.target.value)}>
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
