import { useEffect, useState } from 'react';
import { fetchMaintenanceRecords } from '../api';
import { fmtDate, fmtVnd } from '../theme';
import DataTable from '../components/DataTable';
import Tag from '../components/Tag';
import Loading from '../components/Loading';
import PlateLink from '../components/PlateLink';

export default function RepairLog({ embedded = false }) {
  const [records, setRecords] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchMaintenanceRecords({ page, pageSize: 15, plateNumber: search })
      .then(setRecords)
      .catch((e) => setError(e.message));
  }, [page, search]);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          {!embedded && <h1 style={{ marginBottom: 4 }}>Theo dõi sửa chữa</h1>}
          {records && (
            <div style={{ fontSize: 13, color: '#7a828e' }}>
              {records.total} bản ghi
            </div>
          )}
        </div>
        <div className="field" style={{ width: 240 }}>
          <input
            className="input"
            placeholder="Tìm theo biển số..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
      </div>

      {!records ? (
        <Loading />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <DataTable
            columns={[
              { key: 'entry_date', label: 'Ngày', render: (r) => fmtDate(r.entry_date) },
              { key: 'plate_number', label: 'Biển số', render: (r) => <PlateLink plate={r.plate_number} /> },
              { key: 'maintenance_category', label: 'Hạng mục', render: (r) => r.maintenance_category || r.work_type || '-' },
              { key: 'detail', label: 'Mô tả', render: (r) => r.detail || '-' },
              { key: 'garage', label: 'Xưởng' },
              { key: 'cost', label: 'Chi phí', align: 'right', render: (r) => (r.cost != null ? fmtVnd(r.cost) : '-') },
              {
                key: 'compliance_check',
                label: 'Kiểm tra',
                render: (r) =>
                  r.compliance_check ? (
                    <Tag
                      label={r.compliance_check}
                      color={r.compliance_check === 'Đúng định mức' ? '#16a34a' : '#e5484d'}
                      bg={r.compliance_check === 'Đúng định mức' ? '#dcfce7' : '#fee2e2'}
                    />
                  ) : (
                    '-'
                  ),
              },
            ]}
            rows={records.items}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
            <span style={{ fontSize: 13, color: '#7a828e' }}>
              Trang {records.page} / {Math.max(1, Math.ceil(records.total / records.page_size))}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Trước
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page >= Math.ceil(records.total / records.page_size)}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
