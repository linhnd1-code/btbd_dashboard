import { useEffect, useState } from 'react';
import { fetchRepairTrack } from '../api';
import { fmtInt, fmtMonthLabel, lastMonths } from '../theme';
import KpiCard from '../components/KpiCard';
import Bars from '../components/Bars';
import ProportionBar from '../components/ProportionBar';
import DataTable from '../components/DataTable';
import Loading from '../components/Loading';
import PlateLink from '../components/PlateLink';
import RepairLog from './RepairLog';

export default function RepairTrack() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRepairTrack().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!data) return <Loading />;

  const avgCost = data.total_records ? Math.round(data.total_cost / data.total_records) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1>Theo dõi sửa chữa</h1>
        <div style={{ fontSize: 12.5, color: '#7a828e' }}>Toàn bộ số liệu tính từ các lượt "Sửa chữa" thật trong nhật ký BTBD.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, alignItems: 'start' }}>
        <KpiCard label="Tổng lượt sửa chữa" value={fmtInt(data.total_records)} icon="wrench" iconBg="#fef3c7" iconColor="#b98a00" />
        <KpiCard label="Số xe từng sửa chữa" value={fmtInt(data.distinct_vehicles)} icon="truck" iconBg="#eef4ff" iconColor="#3b82f6" />
        <KpiCard label="Tổng chi phí sửa chữa" value={fmtInt(data.total_cost)} unit="đ" icon="coins" iconBg="#fee2e2" iconColor="#e5484d" />
        <KpiCard label="Chi phí TB / lượt" value={fmtInt(avgCost)} unit="đ" icon="calculator" iconBg="#dcfce7" iconColor="#16a34a" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        <div>
          <h4>Chi phí sửa chữa theo bộ phận</h4>
          <ProportionBar items={data.cost_by_dept} color="#3b82f6" valueLabel={(v) => fmtInt(v) + ' đ'} />
        </div>
        <div>
          <h4>Chi phí sửa chữa theo hãng xe</h4>
          <ProportionBar items={data.cost_by_brand} color="#d6006c" valueLabel={(v) => fmtInt(v) + ' đ'} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <h4>
            Số xe sửa chữa theo tháng <span style={{ fontSize: 11, fontWeight: 400, color: '#9aa1ab' }}>(6 tháng gần nhất)</span>
          </h4>
          <Bars data={lastMonths(data.monthly_count).map((d) => ({ label: fmtMonthLabel(d.label), value: d.value }))} color="#3b82f6" unit="xe" />
        </div>
        <div className="card">
          <h4>
            Xu hướng chi phí sửa chữa theo tháng <span style={{ fontSize: 11, fontWeight: 400, color: '#9aa1ab' }}>(6 tháng gần nhất)</span>
          </h4>
          <Bars data={lastMonths(data.monthly_cost).map((d) => ({ label: fmtMonthLabel(d.label), value: d.value }))} color="#e5484d" unit="đ" />
        </div>
      </div>

      <div className="card">
        <h4>Tần suất &amp; chi phí theo loại công việc</h4>
        <DataTable
          columns={[
            { key: 'label', label: 'Loại công việc' },
            { key: 'count', label: 'Số lượt', align: 'right' },
            { key: 'cost', label: 'Chi phí', align: 'right', render: (r) => fmtInt(r.cost) + ' đ' },
          ]}
          rows={data.category_freq}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <h4>Top 20 xe chi phí sửa chữa cao nhất</h4>
          <DataTable
            columns={[
              { key: 'rank', label: '#', render: (_, i) => i + 1 },
              { key: 'plate_number', label: 'Biển số', render: (r) => <PlateLink plate={r.plate_number} /> },
              { key: 'count', label: 'Lượt', align: 'right' },
              { key: 'cost', label: 'Chi phí', align: 'right', render: (r) => fmtInt(r.cost) + ' đ' },
            ]}
            rows={data.top_cost_list}
          />
        </div>
        <div className="card">
          <h4>Top 20 xe sửa chữa nhiều lần nhất</h4>
          <DataTable
            columns={[
              { key: 'rank', label: '#', render: (_, i) => i + 1 },
              { key: 'plate_number', label: 'Biển số', render: (r) => <PlateLink plate={r.plate_number} /> },
              { key: 'count', label: 'Lượt', align: 'right' },
              { key: 'cost', label: 'Chi phí', align: 'right', render: (r) => fmtInt(r.cost) + ' đ' },
            ]}
            rows={data.top_freq_list}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 20px 0' }}>
          <h4>Nhật ký sửa chữa chi tiết</h4>
        </div>
        <div style={{ padding: '0 4px 4px' }}>
          <RepairLog embedded />
        </div>
      </div>
    </div>
  );
}
