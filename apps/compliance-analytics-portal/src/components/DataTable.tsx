interface Column {
  key: string;
  header: string;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, unknown>[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable({
  columns,
  rows,
  loading,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
}: DataTableProps): React.JSX.Element {
  if (loading) return <div data-testid="table-loading">Loading...</div>;
  if (rows.length === 0) return <div data-testid="table-empty">No data available</div>;

  const totalPages = total ? Math.ceil(total / pageSize) : 1;

  return (
    <div>
      <table data-testid="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: 8, borderBottom: '1px solid #f5f5f5' }}>
                  {String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {onPageChange && totalPages > 1 && (
        <div data-testid="table-pagination" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
