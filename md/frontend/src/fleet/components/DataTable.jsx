export default function DataTable({ columns, rows, emptyMessage = 'Không có dữ liệu', onRowClick }) {
  if (!rows.length) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#9aa1ab', fontSize: 13 }}>{emptyMessage}</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.align === 'right' ? { textAlign: 'right' } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? row.plate_number + i}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} style={col.align === 'right' ? { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } : undefined}>
                  {col.render ? col.render(row, i) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
