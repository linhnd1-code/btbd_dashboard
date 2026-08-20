from core.database import get_db
from core.security import get_current_user, require_roles
from fastapi import APIRouter, Depends, HTTPException, Query
from schemas.fleet import (
    AppSettingsIn,
    AppSettingsOut,
    CompareRowOut,
    FleetAlertsOut,
    FleetStatsOut,
    HealthScoreOut,
    MaintenanceRecordCreateIn,
    MaintenanceRecordListOut,
    MaintenanceRecordOut,
    MaintenanceScheduleOut,
    PerformanceRowOut,
    SmartAlertOut,
    VehicleLookupOut,
    VehicleOut,
)
from services import fleet_service, sheet_sync
from sqlalchemy.orm import Session

# Toàn bộ module Fleet chứa dữ liệu nội bộ nhạy cảm (chi phí, biển số, hồ sơ xe...) — chặn
# `Depends(get_current_user)` ở CẤP ROUTER để bắt buộc đăng nhập cho MỌI endpoint bên dưới,
# tránh phải nhớ gắn thủ công từng route (dễ sót). Route nào cần thêm giới hạn role
# (ví dụ chỉ Admin/Quản lý mới được sửa) thì gắn thêm `Depends(require_roles(...))` riêng.
router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    try:
        stats = fleet_service.get_fleet_stats(db)
        return {"status": "success", "message": "OK", "data": FleetStatsOut(**stats)}
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được thống kê đội xe: {exc}"
        )


@router.get("/records")
def get_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    plate_number: str | None = None,
    area: str | None = None,
    week: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        result = fleet_service.get_maintenance_records(
            db, page, page_size, plate_number, area, week
        )
        return {
            "status": "success",
            "message": "OK",
            "data": MaintenanceRecordListOut(**result),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được nhật ký BTBD: {exc}"
        )


@router.get("/alerts")
def get_alerts(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    try:
        result = fleet_service.get_fleet_alerts(db, limit)
        return {"status": "success", "message": "OK", "data": FleetAlertsOut(**result)}
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được cảnh báo đội xe: {exc}"
        )


@router.get("/vehicles")
def get_vehicles(
    status: str | None = None,
    brand: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        vehicles = fleet_service.get_vehicles(db, status, brand, search)
        return {
            "status": "success",
            "message": "OK",
            "data": [VehicleOut.model_validate(v) for v in vehicles],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được danh sách xe: {exc}"
        )


@router.get("/documents")
def get_documents(doc_type: str | None = None, db: Session = Depends(get_db)):
    try:
        rows = fleet_service.get_all_documents(db, doc_type)
        return {"status": "success", "message": "OK", "data": rows}
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được hồ sơ giấy tờ: {exc}"
        )


@router.get("/maintenance-schedule")
def get_maintenance_schedule(db: Session = Depends(get_db)):
    try:
        rows = fleet_service.get_maintenance_schedule(db)
        return {
            "status": "success",
            "message": "OK",
            "data": [MaintenanceScheduleOut(**r) for r in rows],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được lịch bảo dưỡng: {exc}"
        )


@router.get("/vehicle/{plate_number}")
def get_vehicle_lookup(plate_number: str, db: Session = Depends(get_db)):
    try:
        result = fleet_service.get_vehicle_lookup(db, plate_number)
        if not result:
            raise HTTPException(status_code=404, detail="Không tìm thấy biển số này")
        return {
            "status": "success",
            "message": "OK",
            "data": VehicleLookupOut(**result),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không tra cứu được xe: {exc}")


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    try:
        settings = fleet_service.get_settings(db)
        return {
            "status": "success",
            "message": "OK",
            "data": AppSettingsOut.model_validate(settings),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không lấy được cài đặt: {exc}")


@router.put("/settings")
def update_settings(
    payload: AppSettingsIn,
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles("admin")),
):
    try:
        data = {k: v for k, v in payload.model_dump().items() if v is not None}
        settings = fleet_service.update_settings(db, data)
        return {
            "status": "success",
            "message": "Đã lưu cài đặt",
            "data": AppSettingsOut.model_validate(settings),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không lưu được cài đặt: {exc}")


@router.get("/health-scores")
def get_health_scores(db: Session = Depends(get_db)):
    try:
        rows = fleet_service.get_health_scores(db)
        return {
            "status": "success",
            "message": "OK",
            "data": [HealthScoreOut(**r) for r in rows],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không tính được điểm sức khỏe: {exc}"
        )


@router.get("/smart-alerts")
def get_smart_alerts(db: Session = Depends(get_db)):
    try:
        rows = fleet_service.get_smart_alerts(db)
        return {
            "status": "success",
            "message": "OK",
            "data": [SmartAlertOut(**r) for r in rows],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không tính được cảnh báo tổng hợp: {exc}"
        )


@router.get("/roadside-incidents")
def get_roadside_incidents(db: Session = Depends(get_db)):
    try:
        rows = fleet_service.get_roadside_incidents(db)
        return {
            "status": "success",
            "message": "OK",
            "data": [MaintenanceRecordOut.model_validate(r) for r in rows],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được sự cố dọc đường: {exc}"
        )


@router.get("/overview-extra")
def get_overview_extra(db: Session = Depends(get_db)):
    try:
        data = fleet_service.get_overview_extra(db)
        return {"status": "success", "message": "OK", "data": data}
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được dữ liệu tổng quan mở rộng: {exc}"
        )


@router.get("/maintenance-track")
def get_maintenance_track(db: Session = Depends(get_db)):
    try:
        data = fleet_service.get_maintenance_track(db)
        return {"status": "success", "message": "OK", "data": data}
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được dữ liệu theo dõi bảo dưỡng: {exc}"
        )


@router.get("/repair-track")
def get_repair_track(db: Session = Depends(get_db)):
    try:
        data = fleet_service.get_repair_track(db)
        return {"status": "success", "message": "OK", "data": data}
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được dữ liệu theo dõi sửa chữa: {exc}"
        )


@router.get("/reports")
def get_reports(
    period: str = Query("week", pattern="^(week|month)$"), db: Session = Depends(get_db)
):
    try:
        rows = fleet_service.get_reports(db, period)
        return {"status": "success", "message": "OK", "data": rows}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không lấy được báo cáo: {exc}")


@router.post("/records", status_code=201)
def create_record(
    payload: MaintenanceRecordCreateIn,
    db: Session = Depends(get_db),
    _current_user=Depends(require_roles("admin", "manager")),
):
    try:
        record = fleet_service.create_maintenance_record(db, payload.model_dump())
        return {
            "status": "success",
            "message": "Đã tạo phiếu bảo dưỡng",
            "data": MaintenanceRecordOut.model_validate(record),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không tạo được phiếu bảo dưỡng: {exc}"
        )


@router.get("/performance")
def get_performance(db: Session = Depends(get_db)):
    try:
        rows = fleet_service.get_performance(db)
        return {
            "status": "success",
            "message": "OK",
            "data": [PerformanceRowOut(**r) for r in rows],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Không lấy được hiệu suất đội xe: {exc}"
        )


@router.get("/compare")
def get_compare(plates: str, db: Session = Depends(get_db)):
    try:
        plate_list = [p.strip() for p in plates.split(",") if p.strip()]
        rows = fleet_service.get_vehicle_compare(db, plate_list)
        return {
            "status": "success",
            "message": "OK",
            "data": [CompareRowOut(**r) for r in rows],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không so sánh được xe: {exc}")


@router.post("/sync")
def sync_sheet(db: Session = Depends(get_db)):
    """Tải trực tiếp dữ liệu mới nhất từ Google Sheet (link công khai) và nạp lại DB."""
    try:
        result = sheet_sync.sync_from_sheet(db)
        return {
            "status": "success",
            "message": "Đã đồng bộ dữ liệu từ Google Sheet",
            "data": result,
        }
    except Exception as exc:
        sheet_sync.record_sync_error(str(exc))
        raise HTTPException(
            status_code=502, detail=f"Không đồng bộ được từ Google Sheet: {exc}"
        )


@router.get("/sync-status")
def get_sync_status():
    return {"status": "success", "message": "OK", "data": sheet_sync.LAST_SYNC_STATUS}
