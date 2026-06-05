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
  if (loading)
    return (
      <div data-testid="table-loading" className="py-12 text-center text-slate-400">
        Loading...
      </div>
    );
  if (rows.length === 0)
    return (
      <div data-testid="table-empty" className="py-12 text-center text-slate-400">
        No data available
      </div>
    );

  const totalPages = total ? Math.ceil(total / pageSize) : 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table data-testid="data-table" className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {onPageChange && totalPages > 1 && (
        <div
          data-testid="table-pagination"
          className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50"
        >
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
