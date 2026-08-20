import { useEffect, useState } from 'react';
import { fetchReports } from '../api';
import { fmtInt, fmtMonthLabel } from '../theme';
import Bars from '../components/Bars';
import DataTable from '../components/DataTable';
import KpiCard from '../components/KpiCard';
import Loading from '../components/Loading';

export default function Reports() {
  const [period, setPeriod] = useState('week');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setRows(null);
    fetchReports(period).then(setRows).catch((e) => setError(e.message));
  }, [period]);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;

  const totalCost = rows ? rows.reduce((s, r) => s + r.total_cost, 0) : 0;
  const totalCount = rows ? rows.reduce((s, r) => s + r.count, 0) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Báo cáo</h1>
        <div className="seg">
          <label className={`seg-opt ${period === 'week' ? 'active' : ''}`}>
            <input type="radio" name="period" checked={period === 'week'} onChange={() => setPeriod('week')} />
            <span>Theo tuần</span>
          </label>
          <label className={`seg-opt ${period === 'month' ? 'active' : ''}`}>
            <input type="radio" name="period" checked={period === 'month'} onChange={() => setPeriod('month')} />
            <span>Theo tháng</span>
          </label>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#8b929c' }}>
        Lưu ý: báo cáo tính trên chi phí &amp; số lượt BTBD ghi nhận thực tế. Dữ liệu quãng đường (km) theo kỳ không có
        trong Sheet nguồn nên chưa thể hiện ở đây.
      </div>

      {!rows ? (
        <Loading />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, alignItems: 'start' }}>
            <KpiCard label="Tổng chi phí trong kỳ" value={fmtInt(totalCost)} unit="đ" icon="coins" iconBg="#dcfce7" iconColor="#16a34a" />
            <KpiCard label="Tổng số lượt BTBD" value={fmtInt(totalCount)} icon="wrench" iconBg="#fef3c7" iconColor="#b98a00" />
            <KpiCard
              label="Chi phí TB / kỳ"
              value={rows.length ? fmtInt(Math.round(totalCost / rows.length)) : '-'}
              unit="đ"
              icon="calculator"
              iconBg="#eef4ff"
              iconColor="#3b82f6"
            />
          </div>

          <div className="card">
            <h4>Chi phí BD-SC theo kỳ</h4>
            <Bars data={rows.map((r) => ({ label: period === 'month' ? fmtMonthLabel(r.label) : r.label, value: r.total_cost }))} color="#3b82f6" unit="đ" />
          </div>

          <div className="card" style={{ padding: 0 }}>
            <DataTable
              columns={[
                { key: 'label', label: 'Kỳ' },
                { key: 'count', label: 'Số lượt', align: 'right' },
                { key: 'total_cost', label: 'Chi phí', align: 'right', render: (r) => fmtInt(r.total_cost) + ' đ' },
              ]}
              rows={rows}
            />
          </div>
        </>
      )}
    </div>
  );
}
