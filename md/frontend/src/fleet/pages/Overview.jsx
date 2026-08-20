import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchFleetStats,
  fetchFleetAlerts,
  fetchVehicles,
  fetchHealthScores,
  fetchSmartAlerts,
  fetchOverviewExtra,
  fetchRepairTrack,
  fetchDocuments,
  fetchMaintenanceSchedule,
} from '../api';
import { fmtDate, fmtInt, fmtMonthLabel, lastMonths, vehicleStatusMeta } from '../theme';
import KpiCard from '../components/KpiCard';
import Donut from '../components/Donut';
import Bars from '../components/Bars';
import GroupedBars from '../components/GroupedBars';
import Loading from '../components/Loading';
import { useFleet } from '../FleetContext';

function LinkCard({ to, children }) {
  return (
    <Link to={to} className="kpi-link">
      {children}
    </Link>
  );
}

const HEALTH_COLORS = { 'Khỏe mạnh (≥80)': '#3b82f6', 'Cần theo dõi (50-79)': '#16a34a', 'Nguy cơ hỏng hóc (<50)': '#f59e0b' };

export default function Overview() {
  const { applyVehicleFilters, hasFilters } = useFleet();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [vehicles, setVehicles] = useState(null);
  const [health, setHealth] = useState(null);
  const [smartAlerts, setSmartAlerts] = useState(null);
  const [extra, setExtra] = useState(null);
  const [repairTrack, setRepairTrack] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFleetStats().then(setStats).catch((e) => setError(e.message));
    fetchFleetAlerts(12).then(setAlerts).catch((e) => setError(e.message));
    fetchVehicles().then(setVehicles).catch((e) => setError(e.message));
    fetchHealthScores().then(setHealth).catch((e) => setError(e.message));
    fetchSmartAlerts().then(setSmartAlerts).catch((e) => setError(e.message));
    fetchOverviewExtra().then(setExtra).catch((e) => setError(e.message));
    fetchRepairTrack().then(setRepairTrack).catch((e) => setError(e.message));
    fetchDocuments().then(setDocuments).catch((e) => setError(e.message));
    fetchMaintenanceSchedule().then(setSchedule).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: '#e5484d' }}>Lỗi tải dữ liệu: {error}</div>;
  if (!stats || !alerts || !vehicles || !health || !smartAlerts || !extra || !repairTrack || !documents || !schedule) return <Loading />;

  const filteredVehicles = applyVehicleFilters(vehicles);
  const filteredPlates = new Set(filteredVehicles.map((v) => v.plate_number));

  const statusCounts = {};
  filteredVehicles.forEach((v) => {
    const key = v.status || 'Không rõ';
    statusCounts[key] = (statusCounts[key] || 0) + 1;
  });
  const statusSegments = Object.entries(statusCounts).map(([status, count]) => ({
    label: vehicleStatusMeta(status).label,
    value: count,
    color: vehicleStatusMeta(status).color,
  }));

  const healthSegments = extra.health_buckets.map((b) => ({ label: b.label, value: b.value, color: HEALTH_COLORS[b.label] || '#9aa1ab' }));
  const health_f = health.filter((h) => filteredPlates.has(h.plate_number));
  const avgHealthScore = health_f.length ? Math.round(health_f.reduce((s, h) => s + h.score, 0) / health_f.length) : 0;
  const healthTotal = healthSegments.reduce((s, h) => s + h.value, 0);

  const schedule_f = schedule.filter((s) => filteredPlates.has(s.plate_number));
  const documents_f = documents.filter((d) => filteredPlates.has(d.plate_number));

  const activeCount = filteredVehicles.filter((v) => v.status === 'Hoạt động').length;
  const inactiveCount = filteredVehicles.length - activeCount;
  const overdueCount = schedule_f.filter((s) => s.schedule_status === 'overdue').length;
  const dueCount = schedule_f.filter((s) => s.schedule_status === 'due').length;
  const inspectionExpiredCount = documents_f.filter((d) => d.doc_type === 'Hạn đăng kiểm' && d.doc_status === 'expired').length;
  const insuranceSoonCount = documents_f.filter(
    (d) => (d.doc_type === 'Hạn BH dân sự' || d.doc_type === 'Hạn BH vật chất') && d.doc_status !== 'ok'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1>Bảng thông tin chỉ số KPI chính</h1>
        <div style={{ fontSize: '12.5px', color: '#8b929c' }}>
          Áp dụng bộ lọc toàn cục · <strong style={{ color: '#3f4655' }}>{filteredVehicles.length}</strong>/{vehicles.length} xe
          {hasFilters ? ' (đã lọc)' : ''}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', columnGap: 15, rowGap: 20, alignItems: 'start' }}>
        <LinkCard to="/fleet/danh-sach-xe">
          <KpiCard label="Tổng số xe" value={filteredVehicles.length} icon="truck" iconBg="#eef4ff" iconColor="#3b82f6" sub="Tổng quy mô đội xe" />
        </LinkCard>
        <LinkCard to="/fleet/danh-sach-xe">
          <KpiCard
            label="Xe hoạt động"
            value={activeCount}
            icon="check-circle"
            iconBg="#dcfce7"
            iconColor="#16a34a"
            sub={`${Math.round((activeCount / (filteredVehicles.length || 1)) * 100)}% đội xe`}
          />
        </LinkCard>
        <LinkCard to="/fleet/danh-sach-xe">
          <KpiCard
            label="Xe ngừng hoạt động"
            value={inactiveCount}
            icon="prohibit-inset"
            iconBg={inactiveCount > 0 ? '#fee2e2' : '#dcfce7'}
            iconColor={inactiveCount > 0 ? '#e5484d' : '#16a34a'}
            sub={`${Math.round((inactiveCount / (filteredVehicles.length || 1)) * 100)}% đội xe`}
          />
        </LinkCard>
        <LinkCard to="/fleet/theo-doi-bao-duong">
          <KpiCard
            label="Xe đến kỳ bảo dưỡng"
            value={dueCount}
            icon="hourglass-medium"
            iconBg={dueCount > 0 ? '#fef3c7' : '#dcfce7'}
            iconColor={dueCount > 0 ? '#8a6d00' : '#16a34a'}
            sub="Cần lên lịch"
          />
        </LinkCard>
        <LinkCard to="/fleet/theo-doi-bao-duong">
          <KpiCard
            label="Xe trễ bảo dưỡng"
            value={overdueCount}
            icon="warning-octagon"
            iconBg={overdueCount > 0 ? '#fee2e2' : '#dcfce7'}
            iconColor={overdueCount > 0 ? '#e5484d' : '#16a34a'}
            sub="Quá định mức"
          />
        </LinkCard>
        <LinkCard to="/fleet/dang-kiem">
          <KpiCard
            label="Đăng kiểm hết hạn"
            value={inspectionExpiredCount}
            icon="identification-card"
            iconBg={inspectionExpiredCount > 0 ? '#fee2e2' : '#dcfce7'}
            iconColor={inspectionExpiredCount > 0 ? '#e5484d' : '#16a34a'}
            sub={`${inspectionExpiredCount} xe quá hạn`}
          />
        </LinkCard>
        <LinkCard to="/fleet/giay-to">
          <KpiCard
            label="Bảo hiểm hết hạn"
            value={insuranceSoonCount}
            icon="shield-warning"
            iconBg={insuranceSoonCount > 0 ? '#fef3c7' : '#dcfce7'}
            iconColor={insuranceSoonCount > 0 ? '#8a6d00' : '#16a34a'}
            sub="≤ 30 ngày"
          />
        </LinkCard>
        <LinkCard to="/fleet/bao-cao">
          <KpiCard label="Tổng chi phí tuần" value={fmtInt(extra.cost_this_week)} unit="đ" icon="currency-circle-dollar" iconBg="#eef4ff" iconColor="#3b82f6" sub="7 ngày gần nhất" />
        </LinkCard>
        <LinkCard to="/fleet/bao-cao">
          <KpiCard label="Tổng chi phí tháng" value={fmtInt(extra.cost_this_month)} unit="đ" icon="coins" iconBg="#f3e8ff" iconColor="#8a5cf6" sub="Tháng này" />
        </LinkCard>
        <LinkCard to="/fleet/bao-cao">
          <KpiCard label="Tổng chi phí năm" value={fmtInt(extra.cost_this_year)} unit="đ" icon="chart-line-up" iconBg="#dcfce7" iconColor="#16a34a" sub="Năm nay" />
        </LinkCard>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 1.1fr', gap: 16, alignItems: 'stretch' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h4>Trạng thái hoạt động xe</h4>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <Donut
                segments={statusSegments}
                centerLabel={`${Math.round((activeCount / (filteredVehicles.length || 1)) * 100)}%`}
                centerSub="hoạt động"
                size={190}
                thickness={30}
                labelSize={26}
                subSize={12}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
                {statusSegments.map((s) => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, flex: 'none', borderRadius: 3, background: s.color }} />
                    <span style={{ fontSize: 12, flex: 1, color: '#5b636f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                    <span style={{ font: '600 12.5px var(--font-heading)', whiteSpace: 'nowrap' }}>
                      {s.value} <span style={{ fontSize: 10.5, fontWeight: 400, color: '#9aa1ab' }}>({Math.round((s.value / (filteredVehicles.length || 1)) * 100)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h4>
              Chi phí sửa chữa theo tháng <span style={{ fontSize: 11, fontWeight: 400, color: '#9aa1ab' }}>(6 tháng gần nhất)</span>
            </h4>
            <Bars data={lastMonths(repairTrack.monthly_cost).map((d) => ({ label: fmtMonthLabel(d.label), value: d.value }))} color="#3b82f6" unit="đ" height={260} />
          </div>

          <div className="card" style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <h4 style={{ margin: 0, fontSize: 15.5 }}>Cảnh báo quan trọng</h4>
              <Link to="/fleet/ai-analytics" style={{ fontSize: 13 }}>
                Xem tất cả →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {alerts.maintenance_due.slice(0, 5).map((a) => (
                <div key={`m-${a.plate_number}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f1f4' }}>
                  <span style={{ width: 7, height: 7, flex: 'none', borderRadius: '50%', background: '#e5484d' }} />
                  <Link to={`/fleet/xe/${a.plate_number}`} className="plate-link" style={{ font: '600 13.5px var(--font-heading)', flex: 'none' }}>
                    {a.plate_number}
                  </Link>
                  <span style={{ fontSize: 12.5, color: '#9aa1ab', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Còn {fmtInt(a.remaining_odo)}km đến kỳ BD
                  </span>
                  <span className="tag" style={{ background: '#fee2e2', color: '#e5484d', fontSize: 11.5, flex: 'none' }}>
                    {a.alert_status}
                  </span>
                </div>
              ))}
              {alerts.document_expiring.slice(0, 5).map((a, i) => (
                <div key={`d-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f1f4' }}>
                  <span style={{ width: 7, height: 7, flex: 'none', borderRadius: '50%', background: '#edbb00' }} />
                  <Link to={`/fleet/xe/${a.plate_number}`} className="plate-link" style={{ font: '600 13.5px var(--font-heading)', flex: 'none' }}>
                    {a.plate_number}
                  </Link>
                  <span style={{ fontSize: 12.5, color: '#9aa1ab', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.doc_type} — {fmtDate(a.expiry_raw)}
                  </span>
                  <span className="tag" style={{ background: '#fef3c7', color: '#8a6d00', fontSize: 11.5, flex: 'none' }}>
                    {a.days_remaining < 0 ? 'Đã hết hạn' : 'Sắp hết hạn'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.5fr 1.1fr', gap: 16, alignItems: 'stretch' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h4>Sức khỏe đội xe</h4>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <Donut segments={healthSegments} centerLabel={avgHealthScore} centerSub="điểm TB" size={190} thickness={30} labelSize={26} subSize={12} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
                {healthSegments.map((s) => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, flex: 'none', borderRadius: 3, background: s.color }} />
                    <span style={{ fontSize: 12, flex: 1, color: '#5b636f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                    <span style={{ font: '600 12.5px var(--font-heading)', whiteSpace: 'nowrap' }}>
                      {s.value} <span style={{ fontSize: 10.5, fontWeight: 400, color: '#9aa1ab' }}>({Math.round((s.value / (healthTotal || 1)) * 100)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h4>
              Chi phí vận hành theo tháng <span style={{ fontSize: 11, fontWeight: 400, color: '#9aa1ab' }}>(6 tháng gần nhất)</span>
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', marginBottom: 6 }}>
              {extra.category_labels.map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, flex: 'none', borderRadius: 3, background: extra.category_colors[i] }} />
                  <span style={{ fontSize: 11.5, color: '#5b636f' }}>{label}</span>
                </div>
              ))}
            </div>
            <GroupedBars
              data={lastMonths(extra.monthly_category_stack).map((d) => ({ label: fmtMonthLabel(d.label), parts: d.parts }))}
              colors={extra.category_colors}
              seriesLabels={extra.category_labels}
              unit="đ"
              height={222}
            />
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h4>
              Tổng ODO ghi nhận theo tháng <span style={{ fontSize: 11, fontWeight: 400, color: '#9aa1ab' }}>(6 tháng gần nhất)</span>
            </h4>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Bars data={lastMonths(extra.monthly_odo_sum).map((d) => ({ label: fmtMonthLabel(d.label), value: d.value }))} color="#16a34a" unit="km" height={244} />
            </div>
            <div style={{ fontSize: 10.5, color: '#9aa1ab' }}>Không phải quãng đường thực đi.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
