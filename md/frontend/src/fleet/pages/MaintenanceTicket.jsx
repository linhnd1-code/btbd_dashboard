import { useState } from 'react';
import { createMaintenanceRecord } from '../api';

const WORK_TYPES = ['Bảo dưỡng', 'Sửa chữa', 'Thay lốp', 'Bảo dưỡng, Sửa chữa'];

export default function MaintenanceTicket() {
  const [form, setForm] = useState({
    plate_number: '',
    entry_date: new Date().toISOString().slice(0, 16),
    work_type: 'Bảo dưỡng',
    maintenance_category: '',
    detail: '',
    garage: '',
    cost: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        entry_date: new Date(form.entry_date).toISOString(),
        cost: form.cost ? parseInt(form.cost, 10) : null,
      };
      const created = await createMaintenanceRecord(payload);
      setSavedId(created.id);
      setForm((f) => ({ ...f, plate_number: '', detail: '', cost: '', note: '' }));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1>Phiếu bảo dưỡng</h1>
      <div style={{ fontSize: 12.5, color: '#7a828e', marginBottom: 16 }}>
        Ghi trực tiếp vào nhật ký BTBD thật (bảng <code>maintenance_records</code>) — hiển thị ngay ở trang Nhật ký sửa
        chữa sau khi lưu.
      </div>

      <form onSubmit={onSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label>Biển số xe *</label>
          <input className="input" required value={form.plate_number} onChange={(e) => update('plate_number', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Ngày vào xưởng *</label>
            <input
              type="datetime-local"
              className="input"
              required
              value={form.entry_date}
              onChange={(e) => update('entry_date', e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Loại công việc *</label>
            <select className="input" value={form.work_type} onChange={(e) => update('work_type', e.target.value)}>
              {WORK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Hạng mục</label>
          <input className="input" placeholder="VD: Bảo dưỡng định kỳ" value={form.maintenance_category} onChange={(e) => update('maintenance_category', e.target.value)} />
        </div>
        <div className="field">
          <label>Chi tiết</label>
          <textarea className="input" value={form.detail} onChange={(e) => update('detail', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Gara thực hiện</label>
            <input className="input" value={form.garage} onChange={(e) => update('garage', e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Chi phí (đ)</label>
            <input className="input" type="number" min="0" value={form.cost} onChange={(e) => update('cost', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Ghi chú</label>
          <input className="input" value={form.note} onChange={(e) => update('note', e.target.value)} />
        </div>

        {error && <div style={{ color: '#e5484d', fontSize: 13 }}>{error}</div>}
        {savedId && <div style={{ color: '#16a34a', fontSize: 13 }}>Đã lưu phiếu #{savedId} thành công.</div>}

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
          {saving ? 'Đang lưu...' : 'Lưu phiếu'}
        </button>
      </form>
    </div>
  );
}
