import { useEffect, useState } from 'react';
import { fetchSyncStatus, syncSheet } from '../api';
import { fmtDateTime } from '../theme';
import { useFleet } from '../FleetContext';

function fmtSyncedAt(iso) {
  if (!iso) return 'chưa đồng bộ lần nào';
  return `${fmtDateTime(iso)} (giờ Hà Nội)`;
}

export default function ImportModal() {
  const { importOpen, setImportOpen } = useFleet();
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (importOpen) fetchSyncStatus().then(setStatus).catch(() => {});
  }, [importOpen]);

  if (!importOpen) return null;

  async function onSync() {
    setSyncing(true);
    setError('');
    setResult(null);
    try {
      const data = await syncSheet();
      setResult(data);
      setStatus(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="dialog-backdrop" onClick={() => setImportOpen(false)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Cập nhật dữ liệu</div>
        <div className="dialog-body" style={{ fontSize: 13.5 }}>
          Dữ liệu được đồng bộ trực tiếp từ Google Sheet (link công khai của Sheet "M12 Data bot btbd 1") — hệ thống tự
          động đồng bộ lại mỗi 60 giây (xem thanh đếm cạnh nút "Làm mới" ở topbar). Bấm nút dưới để đồng bộ ngay lập tức.
        </div>

        <div style={{ fontSize: 12.5, color: '#7a828e' }}>
          Lần đồng bộ gần nhất: <strong>{fmtSyncedAt(status?.synced_at)}</strong>
          {status?.records != null && (
            <> — {status.records} nhật ký BTBD · {status.vehicles} xe · {status.statuses} trạng thái BD</>
          )}
        </div>

        {error && <div style={{ color: '#e5484d', fontSize: 13 }}>Lỗi: {error}</div>}
        {result && !error && (
          <div style={{ color: '#16a34a', fontSize: 13 }}>
            Đã đồng bộ xong: {result.records} nhật ký · {result.vehicles} xe · {result.statuses} trạng thái BD.
          </div>
        )}

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setImportOpen(false)}>
            Đóng
          </button>
          <button type="button" className="btn btn-primary" onClick={onSync} disabled={syncing}>
            <i className={`ph-duotone ${syncing ? 'ph-spinner-gap' : 'ph-arrows-clockwise'}`} style={syncing ? { animation: 'flt-spin 0.8s linear infinite' } : undefined} />
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay từ Google Sheet'}
          </button>
        </div>
      </div>
    </div>
  );
}
