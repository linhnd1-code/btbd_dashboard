import { useEffect, useState } from 'react';
import { fetchFleetStats, fetchMaintenanceRecords } from '../api';
import { fmtInt } from '../theme';
import KpiCard from '../components/KpiCard';
import Bars from '../components/Bars';
import ProportionBar from '../components/ProportionBar';
import Loading from '../components/Loading';

export default function MaintenanceOverview() {
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFleetStats().then(setStats).catch((e) => setError(e.message));
    fetchMaintenanceRecords({ page: 1, pageSize: 200 }).then((r) => setRecords(r.items)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!stats || !records) return <Loading />;

  const byWorkType = {};
  records.forEach((r) => {
    (r.work_type || 'Khác').split(',').forEach((t) => {
      const key = t.trim();
      if (!key) return;
      byWorkType[key] = (byWorkType[key] || 0) + (r.cost || 0);
    });
  });
  const workTypeItems = Object.entries(byWorkType)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const avgCost = records.length ? Math.round(stats.total_cost / records.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1>Tổng quan Bảo dưỡng · Sửa chữa</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, alignItems: 'start' }}>
        <KpiCard label="Tổng chi phí BD-SC" value={fmtInt(stats.total_cost)} unit="đ" icon="coins" iconBg="#dcfce7" iconColor="#16a34a" />
        <KpiCard label="Số lượt BD-SC" value={stats.total_records} unit="lượt" icon="wrench" iconBg="#fef3c7" iconColor="#b98a00" />
        <KpiCard label="Chi phí TB / lượt" value={fmtInt(avgCost)} unit="đ" icon="calculator" iconBg="#eef4ff" iconColor="#3b82f6" />
        <KpiCard
          label="Tỷ lệ đúng định mức"
          value={stats.compliance_rate}
          unit="%"
          icon="check-circle"
          iconBg={stats.compliance_rate >= 80 ? '#dcfce7' : '#fef3c7'}
          iconColor={stats.compliance_rate >= 80 ? '#16a34a' : '#8a6d00'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'start' }}>
        <div>
          <h4>Chi phí bảo dưỡng · sửa chữa theo tuần</h4>
          <Bars data={stats.records_by_week.map((d) => ({ label: d.label.replace('2025-', ''), value: d.total_cost }))} color="#3b82f6" unit="đ" />
        </div>
        <div>
          <h4>Chi phí theo loại công việc</h4>
          <ProportionBar items={workTypeItems} color="#3b82f6" valueLabel={(v) => fmtInt(v) + ' đ'} />
        </div>
      </div>
    </div>
  );
}
