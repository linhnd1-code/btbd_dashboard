import { useEffect, useState } from 'react';
import { fetchSyncStatus } from '../api';

const SYNC_INTERVAL_SECONDS = 60;

export default function SyncIndicator({ onClick }) {
  const [status, setStatus] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    function poll() {
      fetchSyncStatus()
        .then((s) => {
          if (alive) setStatus(s);
        })
        .catch(() => {});
    }
    poll();
    const pollId = setInterval(poll, 5000);
    const tickId = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      alive = false;
      clearInterval(pollId);
      clearInterval(tickId);
    };
  }, []);

  if (!status?.synced_at) return null;

  const elapsedSec = Math.max(0, Math.floor((now - new Date(status.synced_at).getTime()) / 1000));
  const remainingSec = Math.max(0, SYNC_INTERVAL_SECONDS - elapsedSec);
  const due = remainingSec === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Đồng bộ thật từ Google Sheet mỗi ${SYNC_INTERVAL_SECONDS}s. Lần gần nhất: ${elapsedSec}s trước (${status.vehicles} xe, ${status.records} nhật ký). Bấm để xem chi tiết / đồng bộ ngay.`}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--color-divider)', background: '#fff',
        borderRadius: 20, padding: '6px 12px', cursor: 'pointer', fontSize: 11.5, color: status.error ? '#e5484d' : '#5b636f',
      }}
    >
      <span
        style={{
          width: 7, height: 7, borderRadius: '50%', flex: 'none',
          background: status.error ? '#e5484d' : '#16a34a',
          animation: due && !status.error ? 'flt-pulse 1s ease-in-out infinite' : undefined,
        }}
      />
      {status.error ? <span>Lỗi đồng bộ gần nhất</span> : due ? <span>Đang đồng bộ...</span> : <span>Tự động làm mới sau {remainingSec}s</span>}
    </button>
  );
}
