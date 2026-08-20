import { useEffect, useState } from 'react';
import { fetchRoadsideIncidents } from '../api';
import { fmtDate, fmtVnd } from '../theme';
import DataTable from '../components/DataTable';
import Loading from '../components/Loading';
import PlateLink from '../components/PlateLink';

export default function Roadside() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoadsideIncidents().then(setRows).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!rows) return <Loading />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1>Sửa chữa dọc đường</h1>
        <div style={{ fontSize: 12.5, color: '#7a828e' }}>
          Nhận diện từ ghi chú/chi tiết thật trong nhật ký BTBD có chứa từ khóa "cứu hộ", "cứu pan", "dọc đường", "lưu
          động", "kéo xe" — không phải danh mục riêng trong Sheet nguồn.
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <DataTable
          columns={[
            { key: 'entry_date', label: 'Ngày', render: (r) => fmtDate(r.entry_date) },
            { key: 'plate_number', label: 'Biển số', render: (r) => <PlateLink plate={r.plate_number} /> },
            { key: 'detail', label: 'Chi tiết', render: (r) => r.detail || '-' },
            { key: 'note', label: 'Ghi chú', render: (r) => r.note || '-' },
            { key: 'garage', label: 'Đơn vị xử lý' },
            { key: 'cost', label: 'Chi phí', align: 'right', render: (r) => (r.cost != null ? fmtVnd(r.cost) : '-') },
          ]}
          rows={rows}
          emptyMessage="Không phát hiện sự cố dọc đường nào trong dữ liệu"
        />
      </div>
    </div>
  );
}
