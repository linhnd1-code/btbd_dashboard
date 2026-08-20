from datetime import datetime, timedelta

from core.timezone import now_hanoi
from models.app_settings import AppSettings
from models.maintenance_record import MaintenanceRecord
from models.vehicle import Vehicle
from models.vehicle_maintenance_status import VehicleMaintenanceStatus
from sqlalchemy import func
from sqlalchemy.orm import Session

DOC_EXPIRY_FIELDS = [
    ("inspection_expiry", "Hạn đăng kiểm"),
    ("road_fee_expiry", "Hạn phí đường bộ"),
    ("registration_expiry", "Hạn giấy đăng ký"),
    ("civil_insurance_expiry", "Hạn BH dân sự"),
    ("physical_insurance_expiry", "Hạn BH vật chất"),
    ("decal_expiry", "Hạn phù hiệu"),
]

ROADSIDE_KEYWORDS = ["cứu hộ", "cứu pan", "dọc đường", "lưu động", "kéo xe"]


def get_settings(db: Session) -> AppSettings:
    settings = db.query(AppSettings).filter(AppSettings.id == 1).first()
    if not settings:
        settings = AppSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_settings(db: Session, data: dict) -> AppSettings:
    settings = get_settings(db)
    for key, value in data.items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings


def _days_remaining(raw_value: str | None) -> int | None:
    """Số ngày còn lại tới hạn. Giá trị chữ (vd "hết hạn") coi như đã quá hạn."""
    if not raw_value:
        return None
    text = raw_value.strip()
    expiry_date = None
    # Dữ liệu thật lưu theo str(datetime) từ Excel ("%Y-%m-%d %H:%M:%S"); giữ thêm
    # vài dạng khác để không vỡ nếu nguồn dữ liệu đổi format sau này.
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y"):
        try:
            expiry_date = datetime.strptime(text, fmt)
            break
        except ValueError:
            continue
    if expiry_date is None:
        return -1
    return (expiry_date.date() - now_hanoi().date()).days


def get_fleet_stats(db: Session) -> dict:
    settings = get_settings(db)
    total_vehicles = db.query(func.count(Vehicle.id)).scalar() or 0
    active_vehicles = (
        db.query(func.count(Vehicle.id)).filter(Vehicle.status == "Hoạt động").scalar()
        or 0
    )
    total_records = db.query(func.count(MaintenanceRecord.id)).scalar() or 0
    total_cost = (
        db.query(func.coalesce(func.sum(MaintenanceRecord.cost), 0)).scalar() or 0
    )

    compliance_rows = (
        db.query(MaintenanceRecord.compliance_check, func.count(MaintenanceRecord.id))
        .group_by(MaintenanceRecord.compliance_check)
        .all()
    )
    correct_count = next(
        (c for label, c in compliance_rows if label == "Đúng định mức"), 0
    )
    checked_total = sum(c for label, c in compliance_rows if label)
    compliance_rate = (
        round(correct_count / checked_total * 100, 1) if checked_total else 0.0
    )

    due_for_maintenance = (
        db.query(func.count(VehicleMaintenanceStatus.id))
        .filter(
            (VehicleMaintenanceStatus.alert_status == "Đến kỳ BD")
            | (VehicleMaintenanceStatus.remaining_odo <= settings.due_threshold_km)
        )
        .scalar()
        or 0
    )

    def _breakdown(column):
        rows = (
            db.query(
                column,
                func.count(MaintenanceRecord.id),
                func.coalesce(func.sum(MaintenanceRecord.cost), 0),
            )
            .filter(column.isnot(None))
            .group_by(column)
            .order_by(func.sum(MaintenanceRecord.cost).desc())
            .all()
        )
        return [
            {"label": label, "count": count, "total_cost": cost}
            for label, count, cost in rows
        ]

    cost_by_area = _breakdown(MaintenanceRecord.area)
    cost_by_garage = _breakdown(MaintenanceRecord.garage)
    records_by_week = sorted(
        _breakdown(MaintenanceRecord.week), key=lambda r: r["label"]
    )
    compliance_breakdown = [
        {"label": label or "Chưa kiểm tra", "count": count, "total_cost": 0}
        for label, count in compliance_rows
    ]

    expiring_documents = _count_expiring_documents(
        db, settings.expiry_alert_window_days
    )

    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "total_records": total_records,
        "total_cost": total_cost,
        "compliance_rate": compliance_rate,
        "due_for_maintenance": due_for_maintenance,
        "expiring_documents": expiring_documents,
        "cost_by_area": cost_by_area,
        "cost_by_garage": cost_by_garage,
        "records_by_week": records_by_week,
        "compliance_breakdown": compliance_breakdown,
    }


def _count_expiring_documents(db: Session, window_days: int) -> int:
    vehicles = db.query(Vehicle).all()
    count = 0
    for vehicle in vehicles:
        for field_name, _ in DOC_EXPIRY_FIELDS:
            days = _days_remaining(getattr(vehicle, field_name))
            if days is not None and days <= window_days:
                count += 1
                break
    return count


def get_maintenance_records(
    db: Session,
    page: int,
    page_size: int,
    plate_number: str | None = None,
    area: str | None = None,
    week: str | None = None,
) -> dict:
    query = db.query(MaintenanceRecord)
    if plate_number:
        query = query.filter(MaintenanceRecord.plate_number.ilike(f"%{plate_number}%"))
    if area:
        query = query.filter(MaintenanceRecord.area == area)
    if week:
        query = query.filter(MaintenanceRecord.week == week)

    total = query.count()
    items = (
        query.order_by(MaintenanceRecord.entry_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


def get_vehicles(
    db: Session,
    status: str | None = None,
    brand: str | None = None,
    search: str | None = None,
) -> list[Vehicle]:
    query = db.query(Vehicle)
    if status:
        query = query.filter(Vehicle.status == status)
    if brand:
        query = query.filter(Vehicle.brand == brand)
    if search:
        query = query.filter(Vehicle.plate_number.ilike(f"%{search}%"))
    return query.order_by(Vehicle.plate_number).all()


def _doc_status(days: int | None, window_days: int) -> str:
    if days is None:
        return "ok"
    if days < 0:
        return "expired"
    if days <= window_days:
        return "soon"
    return "ok"


def get_all_documents(db: Session, doc_type: str | None = None) -> list[dict]:
    settings = get_settings(db)
    vehicles = db.query(Vehicle).all()
    rows = []
    for vehicle in vehicles:
        for field_name, label in DOC_EXPIRY_FIELDS:
            if doc_type and doc_type != label:
                continue
            raw_value = getattr(vehicle, field_name)
            if not raw_value:
                continue
            days = _days_remaining(raw_value)
            rows.append(
                {
                    "plate_number": vehicle.plate_number,
                    "manager_unit": vehicle.manager_unit,
                    "brand": vehicle.brand,
                    "doc_type": label,
                    "expiry_raw": raw_value,
                    "days_remaining": days,
                    "doc_status": _doc_status(days, settings.expiry_alert_window_days),
                }
            )
    rows.sort(key=lambda r: (r["days_remaining"] is None, r["days_remaining"]))
    return rows


def _schedule_status(
    remaining_odo: int | None, alert_status: str | None, due_km: int, upcoming_km: int
) -> str:
    if remaining_odo is not None and remaining_odo < 0:
        return "overdue"
    if alert_status == "Đến kỳ BD" or (
        remaining_odo is not None and remaining_odo <= due_km
    ):
        return "due"
    if remaining_odo is not None and remaining_odo <= upcoming_km:
        return "upcoming"
    return "ok"


def get_maintenance_schedule(db: Session) -> list[dict]:
    settings = get_settings(db)
    rows = db.query(VehicleMaintenanceStatus).all()
    result = [
        {
            "plate_number": r.plate_number,
            "status": r.status,
            "brand": r.brand,
            "manager_unit": r.manager_unit,
            "current_odo": r.current_odo,
            "next_maintenance_odo": r.next_maintenance_odo,
            "remaining_odo": r.remaining_odo,
            "alert_status": r.alert_status,
            "schedule_status": _schedule_status(
                r.remaining_odo,
                r.alert_status,
                settings.due_threshold_km,
                settings.upcoming_threshold_km,
            ),
            "note": r.note,
        }
        for r in rows
    ]
    result.sort(key=lambda r: (r["remaining_odo"] is None, r["remaining_odo"]))
    return result


def get_vehicle_lookup(db: Session, plate_number: str) -> dict | None:
    settings = get_settings(db)
    vehicle = db.query(Vehicle).filter(Vehicle.plate_number == plate_number).first()
    if not vehicle and len(plate_number) >= 4:
        # Cho phép tra cứu bằng vài số cuối của biển số, không chỉ khớp tuyệt đối.
        matches = (
            db.query(Vehicle)
            .filter(Vehicle.plate_number.ilike(f"%{plate_number}"))
            .all()
        )
        if len(matches) == 1:
            vehicle = matches[0]
        elif len(matches) > 1:
            plates = ", ".join(m.plate_number for m in matches[:8])
            raise ValueError(
                f"Có {len(matches)} biển số khớp với '{plate_number}': {plates} — vui lòng nhập đầy đủ hơn hoặc chọn từ gợi ý"
            )
    if not vehicle:
        return None

    documents = []
    for field_name, label in DOC_EXPIRY_FIELDS:
        raw_value = getattr(vehicle, field_name)
        if not raw_value:
            continue
        days = _days_remaining(raw_value)
        documents.append(
            {
                "plate_number": vehicle.plate_number,
                "manager_unit": vehicle.manager_unit,
                "brand": vehicle.brand,
                "doc_type": label,
                "expiry_raw": raw_value,
                "days_remaining": days,
                "doc_status": _doc_status(days, settings.expiry_alert_window_days),
            }
        )

    status_row = (
        db.query(VehicleMaintenanceStatus)
        .filter(VehicleMaintenanceStatus.plate_number == plate_number)
        .first()
    )
    maintenance_status = None
    if status_row:
        maintenance_status = {
            "plate_number": status_row.plate_number,
            "status": status_row.status,
            "brand": status_row.brand,
            "manager_unit": status_row.manager_unit,
            "current_odo": status_row.current_odo,
            "next_maintenance_odo": status_row.next_maintenance_odo,
            "remaining_odo": status_row.remaining_odo,
            "alert_status": status_row.alert_status,
            "schedule_status": _schedule_status(
                status_row.remaining_odo,
                status_row.alert_status,
                settings.due_threshold_km,
                settings.upcoming_threshold_km,
            ),
            "note": status_row.note,
        }

    recent_records = (
        db.query(MaintenanceRecord)
        .filter(MaintenanceRecord.plate_number == plate_number)
        .order_by(MaintenanceRecord.entry_date.desc())
        .limit(20)
        .all()
    )

    return {
        "vehicle": vehicle,
        "documents": documents,
        "maintenance_status": maintenance_status,
        "recent_records": recent_records,
    }


def get_fleet_alerts(db: Session, limit: int = 20) -> dict:
    settings = get_settings(db)
    maintenance_due = (
        db.query(VehicleMaintenanceStatus)
        .filter(VehicleMaintenanceStatus.remaining_odo.isnot(None))
        .order_by(VehicleMaintenanceStatus.remaining_odo.asc())
        .limit(limit)
        .all()
    )

    document_expiring = []
    vehicles = db.query(Vehicle).all()
    for vehicle in vehicles:
        for field_name, label in DOC_EXPIRY_FIELDS:
            raw_value = getattr(vehicle, field_name)
            days = _days_remaining(raw_value)
            if days is not None and days <= settings.expiry_alert_window_days:
                document_expiring.append(
                    {
                        "plate_number": vehicle.plate_number,
                        "manager_unit": vehicle.manager_unit,
                        "doc_type": label,
                        "expiry_raw": raw_value,
                        "days_remaining": days,
                    }
                )
    document_expiring.sort(
        key=lambda d: (d["days_remaining"] is None, d["days_remaining"])
    )

    return {
        "maintenance_due": maintenance_due,
        "document_expiring": document_expiring[:limit],
    }


# ── Điểm sức khỏe xe ──
# Công thức minh bạch dựa hoàn toàn trên dữ liệu thật (không phải AI):
#   40% Tuân thủ bảo dưỡng (% "Đúng định mức" trong các lượt BTBD của xe)
#   25% Tần suất sửa chữa (ít lượt "Sửa chữa" hơn trung bình đội xe -> điểm cao hơn)
#   20% Tình trạng BD hiện tại (không quá hạn ODO bảo dưỡng)
#   15% Hồ sơ giấy tờ (không có giấy tờ hết hạn/sắp hết hạn)
def get_health_scores(db: Session) -> list[dict]:
    settings = get_settings(db)
    vehicles = db.query(Vehicle).all()
    schedules = {s.plate_number: s for s in db.query(VehicleMaintenanceStatus).all()}
    records = db.query(MaintenanceRecord).all()

    by_plate: dict[str, list[MaintenanceRecord]] = {}
    for r in records:
        by_plate.setdefault(r.plate_number, []).append(r)
    repair_counts = [
        sum(1 for r in recs if r.work_type and "Sửa chữa" in r.work_type)
        for recs in by_plate.values()
    ]
    avg_repairs = (sum(repair_counts) / len(repair_counts)) if repair_counts else 0

    results = []
    for vehicle in vehicles:
        recs = by_plate.get(vehicle.plate_number, [])
        checked = [r for r in recs if r.compliance_check]
        compliance_score = (
            100
            * sum(1 for r in checked if r.compliance_check == "Đúng định mức")
            / len(checked)
            if checked
            else 80.0
        )

        repair_count = sum(1 for r in recs if r.work_type and "Sửa chữa" in r.work_type)
        freq_score = (
            100.0
            if avg_repairs == 0
            else max(0.0, min(100.0, 100 - (repair_count - avg_repairs) * 15))
        )

        schedule = schedules.get(vehicle.plate_number)
        if (
            schedule
            and schedule.remaining_odo is not None
            and schedule.remaining_odo < 0
        ):
            bd_score = max(0.0, 100 + schedule.remaining_odo / 100)
        else:
            bd_score = 100.0

        doc_issue = False
        for field_name, _ in DOC_EXPIRY_FIELDS:
            days = _days_remaining(getattr(vehicle, field_name))
            if days is not None and days <= settings.expiry_alert_window_days:
                doc_issue = True
                break
        doc_score = 40.0 if doc_issue else 100.0

        score = round(
            compliance_score * 0.40
            + freq_score * 0.25
            + bd_score * 0.20
            + doc_score * 0.15
        )
        score = max(0, min(100, score))
        results.append(
            {
                "plate_number": vehicle.plate_number,
                "brand": vehicle.brand,
                "manager_unit": vehicle.manager_unit,
                "status": vehicle.status,
                "score": score,
                "compliance_score": round(compliance_score),
                "freq_score": round(freq_score),
                "bd_score": round(bd_score),
                "doc_score": round(doc_score),
                "repair_count": repair_count,
                "total_cost": sum(r.cost or 0 for r in recs),
            }
        )
    results.sort(key=lambda r: r["score"])
    return results


# ── Cảnh báo tổng hợp (rule-based, KHÔNG phải AI/machine learning) ──
def get_smart_alerts(db: Session) -> list[dict]:
    records = db.query(MaintenanceRecord).all()
    by_plate: dict[str, list[MaintenanceRecord]] = {}
    for r in records:
        by_plate.setdefault(r.plate_number, []).append(r)

    costs = [r.cost for r in records if r.cost]
    avg_cost = sum(costs) / len(costs) if costs else 0

    alerts = []
    for plate, recs in by_plate.items():
        total_cost = sum(r.cost or 0 for r in recs)
        repair_count = sum(1 for r in recs if r.work_type and "Sửa chữa" in r.work_type)
        if len(recs) >= 5 and avg_cost and total_cost / len(recs) > avg_cost * 1.8:
            alerts.append(
                {
                    "plate_number": plate,
                    "severity": "critical",
                    "title": "Chi phí BTBD cao bất thường",
                    "body": f"Chi phí trung bình mỗi lượt ({round(total_cost/len(recs)):,} đ) cao hơn 1.8 lần trung bình đội xe.",
                }
            )
        if repair_count >= 6:
            alerts.append(
                {
                    "plate_number": plate,
                    "severity": "warning",
                    "title": "Sửa chữa lặp lại nhiều lần",
                    "body": f"Xe đã có {repair_count} lượt sửa chữa trong dữ liệu hiện có.",
                }
            )

    schedules = db.query(VehicleMaintenanceStatus).all()
    for s in schedules:
        if s.remaining_odo is not None and s.remaining_odo < -1000:
            alerts.append(
                {
                    "plate_number": s.plate_number,
                    "severity": "critical",
                    "title": "Quá hạn bảo dưỡng nhiều",
                    "body": f"Đã vượt mốc bảo dưỡng {abs(s.remaining_odo):,} km, cần đưa vào xưởng ngay.",
                }
            )

    vehicles = db.query(Vehicle).all()
    for vehicle in vehicles:
        expired_docs = [
            label
            for field_name, label in DOC_EXPIRY_FIELDS
            if (d := _days_remaining(getattr(vehicle, field_name))) is not None
            and d < 0
        ]
        if len(expired_docs) >= 2:
            alerts.append(
                {
                    "plate_number": vehicle.plate_number,
                    "severity": "warning",
                    "title": "Nhiều giấy tờ đã hết hạn",
                    "body": f"Hết hạn: {', '.join(expired_docs)}.",
                }
            )

    severity_order = {"critical": 0, "warning": 1}
    alerts.sort(key=lambda a: severity_order.get(a["severity"], 2))
    return alerts


# ── Sự cố dọc đường: phát hiện bằng từ khóa trong ghi chú/chi tiết thật, không suy diễn ──
def get_roadside_incidents(db: Session) -> list[MaintenanceRecord]:
    records = db.query(MaintenanceRecord).all()
    matched = []
    for r in records:
        haystack = f"{r.note or ''} {r.detail or ''}".lower()
        if any(keyword in haystack for keyword in ROADSIDE_KEYWORDS):
            matched.append(r)
    matched.sort(key=lambda r: r.entry_date or datetime.min, reverse=True)
    return matched


def get_reports(db: Session, period: str = "week") -> list[dict]:
    column = (
        MaintenanceRecord.week
        if period == "week"
        else func.strftime("%Y-%m", MaintenanceRecord.entry_date)
    )
    rows = (
        db.query(
            column.label("period"),
            func.count(MaintenanceRecord.id),
            func.coalesce(func.sum(MaintenanceRecord.cost), 0),
        )
        .filter(column.isnot(None))
        .group_by("period")
        .order_by("period")
        .all()
    )
    return [
        {"label": label, "count": count, "total_cost": cost}
        for label, count, cost in rows
    ]


def create_maintenance_record(db: Session, data: dict) -> MaintenanceRecord:
    record = MaintenanceRecord(**data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def _month_key(dt) -> str | None:
    return dt.strftime("%Y-%m") if dt else None


OVERVIEW_CATEGORIES = ["Bảo dưỡng", "Sửa chữa", "Thay lốp"]
CATEGORY_COLORS = {
    "Bảo dưỡng": "#3b82f6",
    "Sửa chữa": "#e5484d",
    "Thay lốp": "#f59e0b",
    "Khác": "#8a5cf6",
}


def get_overview_extra(db: Session) -> dict:
    now = now_hanoi().replace(tzinfo=None)
    week_start = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    records = db.query(MaintenanceRecord).all()

    cost_this_week = sum(
        r.cost or 0 for r in records if r.entry_date and r.entry_date >= week_start
    )
    cost_this_month = sum(
        r.cost or 0 for r in records if r.entry_date and r.entry_date >= month_start
    )
    cost_this_year = sum(
        r.cost or 0 for r in records if r.entry_date and r.entry_date >= year_start
    )

    monthly_stack: dict[str, dict] = {}
    monthly_odo: dict[str, int] = {}
    for r in records:
        month = _month_key(r.entry_date)
        if not month:
            continue
        bucket = monthly_stack.setdefault(
            month, {c: 0 for c in OVERVIEW_CATEGORIES + ["Khác"]}
        )
        types = [t.strip() for t in (r.work_type or "").split(",") if t.strip()]
        matched = [c for c in OVERVIEW_CATEGORIES if c in types]
        cost_share = (r.cost or 0) / len(matched) if matched else (r.cost or 0)
        if matched:
            for cat in matched:
                bucket[cat] += cost_share
        else:
            bucket["Khác"] += cost_share
        monthly_odo[month] = monthly_odo.get(month, 0) + (r.odo or 0)

    months = sorted(monthly_stack.keys())
    monthly_category_stack = [
        {
            "label": m,
            "parts": [
                round(monthly_stack[m][c]) for c in OVERVIEW_CATEGORIES + ["Khác"]
            ],
        }
        for m in months
    ]
    monthly_odo_sum = [{"label": m, "value": monthly_odo[m]} for m in months]

    health_buckets = {
        "Khỏe mạnh (≥80)": 0,
        "Cần theo dõi (50-79)": 0,
        "Nguy cơ hỏng hóc (<50)": 0,
    }
    for row in get_health_scores(db):
        if row["score"] >= 80:
            health_buckets["Khỏe mạnh (≥80)"] += 1
        elif row["score"] >= 50:
            health_buckets["Cần theo dõi (50-79)"] += 1
        else:
            health_buckets["Nguy cơ hỏng hóc (<50)"] += 1

    return {
        "cost_this_week": cost_this_week,
        "cost_this_month": cost_this_month,
        "cost_this_year": cost_this_year,
        "monthly_category_stack": monthly_category_stack,
        "category_labels": OVERVIEW_CATEGORIES + ["Khác"],
        "category_colors": [CATEGORY_COLORS[c] for c in OVERVIEW_CATEGORIES + ["Khác"]],
        "monthly_odo_sum": monthly_odo_sum,
        "health_buckets": [{"label": k, "value": v} for k, v in health_buckets.items()],
    }


def get_maintenance_track(db: Session) -> dict:
    records = [
        r
        for r in db.query(MaintenanceRecord).all()
        if r.work_type and "Bảo dưỡng" in r.work_type
    ]
    schedules = db.query(VehicleMaintenanceStatus).all()

    compliance_rows = {}
    monthly = {}
    for r in records:
        label = r.compliance_check or "Chưa kiểm tra"
        compliance_rows[label] = compliance_rows.get(label, 0) + 1
        month = _month_key(r.entry_date)
        if not month:
            continue
        bucket = monthly.setdefault(
            month, {"count": 0, "cost": 0, "on_time": 0, "checked": 0}
        )
        bucket["count"] += 1
        bucket["cost"] += r.cost or 0
        if r.compliance_check:
            bucket["checked"] += 1
            if r.compliance_check == "Đúng định mức":
                bucket["on_time"] += 1

    months = sorted(monthly.keys())
    monthly_trend = [
        {
            "label": m,
            "on_time_rate": (
                round(monthly[m]["on_time"] / monthly[m]["checked"] * 100, 1)
                if monthly[m]["checked"]
                else 0
            ),
            "count": monthly[m]["count"],
        }
        for m in months
    ]
    monthly_cost = [{"label": m, "value": monthly[m]["cost"]} for m in months]
    monthly_count = [{"label": m, "value": monthly[m]["count"]} for m in months]

    def _deviation_by(key_fn):
        buckets = {}
        for s in schedules:
            if s.remaining_odo is None:
                continue
            key = key_fn(s) or "Không rõ"
            buckets.setdefault(key, []).append(s.remaining_odo)
        rows = [
            {"label": k, "value": round(sum(v) / len(v))} for k, v in buckets.items()
        ]
        rows.sort(key=lambda r: r["value"])
        return rows

    deviation_by_dept = _deviation_by(lambda s: s.manager_unit)
    deviation_by_brand = _deviation_by(lambda s: s.brand)

    with_odo = [s for s in schedules if s.remaining_odo is not None]
    top_late = sorted(with_odo, key=lambda s: s.remaining_odo)[:10]
    top_early = sorted(with_odo, key=lambda s: s.remaining_odo, reverse=True)[:10]

    def _row(s):
        return {
            "plate_number": s.plate_number,
            "manager_unit": s.manager_unit,
            "remaining_odo": s.remaining_odo,
            "schedule_status": _schedule_status(
                s.remaining_odo,
                s.alert_status,
                get_settings(db).due_threshold_km,
                get_settings(db).upcoming_threshold_km,
            ),
        }

    return {
        "compliance": [{"label": k, "value": v} for k, v in compliance_rows.items()],
        "monthly_trend": monthly_trend,
        "monthly_cost": monthly_cost,
        "monthly_count": monthly_count,
        "deviation_by_dept": deviation_by_dept,
        "deviation_by_brand": deviation_by_brand,
        "top_late": [_row(s) for s in top_late],
        "top_early": [_row(s) for s in top_early],
    }


def get_repair_track(db: Session) -> dict:
    records = [
        r
        for r in db.query(MaintenanceRecord).all()
        if r.work_type and "Sửa chữa" in r.work_type
    ]
    vehicles_by_plate = {v.plate_number: v for v in db.query(Vehicle).all()}

    by_dept: dict[str, int] = {}
    by_brand: dict[str, int] = {}
    by_plate: dict[str, dict] = {}
    by_category: dict[str, dict] = {}
    monthly_cost: dict[str, int] = {}
    monthly_plates: dict[str, set] = {}

    for r in records:
        cost = r.cost or 0
        dept_key = r.area or "Không rõ"
        by_dept[dept_key] = by_dept.get(dept_key, 0) + cost

        vehicle = vehicles_by_plate.get(r.plate_number)
        brand_key = (vehicle.brand if vehicle else None) or "Không rõ"
        by_brand[brand_key] = by_brand.get(brand_key, 0) + cost

        plate_bucket = by_plate.setdefault(r.plate_number, {"count": 0, "cost": 0})
        plate_bucket["count"] += 1
        plate_bucket["cost"] += cost

        for cat in (r.work_type or "Khác").split(","):
            cat = cat.strip() or "Khác"
            cat_bucket = by_category.setdefault(cat, {"count": 0, "cost": 0})
            cat_bucket["count"] += 1
            cat_bucket["cost"] += cost

        month = _month_key(r.entry_date)
        if month:
            monthly_cost[month] = monthly_cost.get(month, 0) + cost
            monthly_plates.setdefault(month, set()).add(r.plate_number)

    months = sorted(monthly_cost.keys())

    top_cost_list = sorted(
        by_plate.items(), key=lambda kv: kv[1]["cost"], reverse=True
    )[:20]
    top_freq_list = sorted(
        by_plate.items(), key=lambda kv: kv[1]["count"], reverse=True
    )[:20]

    return {
        "total_records": len(records),
        "total_cost": sum(r.cost or 0 for r in records),
        "distinct_vehicles": len(by_plate),
        "cost_by_dept": [
            {"label": k, "value": v}
            for k, v in sorted(by_dept.items(), key=lambda kv: kv[1], reverse=True)
        ],
        "cost_by_brand": [
            {"label": k, "value": v}
            for k, v in sorted(by_brand.items(), key=lambda kv: kv[1], reverse=True)
        ],
        "monthly_cost": [{"label": m, "value": monthly_cost[m]} for m in months],
        "monthly_count": [
            {"label": m, "value": len(monthly_plates[m])} for m in months
        ],
        "category_freq": [
            {"label": k, "count": v["count"], "cost": v["cost"]}
            for k, v in sorted(
                by_category.items(), key=lambda kv: kv[1]["cost"], reverse=True
            )
        ],
        "top_cost_list": [
            {"plate_number": p, "count": v["count"], "cost": v["cost"]}
            for p, v in top_cost_list
        ],
        "top_freq_list": [
            {"plate_number": p, "count": v["count"], "cost": v["cost"]}
            for p, v in top_freq_list
        ],
    }


def get_performance(db: Session) -> list[dict]:
    """
    Hiệu suất đội xe dựa trên dữ liệu thật duy nhất có sẵn cho việc này: thời gian
    xe nằm xưởng (total_hours) mỗi lượt BTBD. KHÔNG có dữ liệu tiêu hao nhiên liệu
    hay uptime% trong Sheet nguồn nên không hiển thị 2 chỉ số đó (không bịa số).
    Vài dòng có total_hours âm (lỗi giờ vào/ra trong dữ liệu gốc) bị loại khỏi tổng.
    """
    vehicles = {v.plate_number: v for v in db.query(Vehicle).all()}
    records = db.query(MaintenanceRecord).all()
    by_plate: dict[str, list[MaintenanceRecord]] = {}
    for r in records:
        by_plate.setdefault(r.plate_number, []).append(r)

    results = []
    for plate, recs in by_plate.items():
        valid_hours = [
            r.total_hours for r in recs if r.total_hours and r.total_hours > 0
        ]
        total_downtime = round(sum(valid_hours), 1) if valid_hours else 0.0
        vehicle = vehicles.get(plate)
        results.append(
            {
                "plate_number": plate,
                "brand": vehicle.brand if vehicle else None,
                "manager_unit": vehicle.manager_unit if vehicle else None,
                "visit_count": len(recs),
                "total_downtime_hours": total_downtime,
                "avg_hours_per_visit": (
                    round(total_downtime / len(valid_hours), 1) if valid_hours else None
                ),
            }
        )
    results.sort(key=lambda r: r["total_downtime_hours"], reverse=True)
    return results


def get_vehicle_compare(db: Session, plates: list[str]) -> list[dict]:
    health_by_plate = {h["plate_number"]: h for h in get_health_scores(db)}
    result = []
    for plate in plates:
        vehicle = db.query(Vehicle).filter(Vehicle.plate_number == plate).first()
        if not vehicle:
            continue
        health = health_by_plate.get(plate, {})
        result.append(
            {
                "plate_number": vehicle.plate_number,
                "brand": vehicle.brand,
                "vehicle_model": vehicle.vehicle_model,
                "status": vehicle.status,
                "odo": vehicle.odo,
                "score": health.get("score"),
                "repair_count": health.get("repair_count", 0),
                "total_cost": health.get("total_cost", 0),
            }
        )
    return result
