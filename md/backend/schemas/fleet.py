from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MaintenanceRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plate_number: str
    vehicle_info: str | None
    odo: int | None
    entry_date: datetime | None
    work_type: str | None
    maintenance_category: str | None
    detail: str | None
    garage: str | None
    exit_date: datetime | None
    total_hours: float | None
    cost: int | None
    note: str | None
    area: str | None
    week: str | None
    compliance_check: str | None


class MaintenanceRecordListOut(BaseModel):
    items: list[MaintenanceRecordOut]
    total: int
    page: int
    page_size: int


class BreakdownItem(BaseModel):
    label: str
    count: int
    total_cost: int


class FleetStatsOut(BaseModel):
    total_vehicles: int
    active_vehicles: int
    total_records: int
    total_cost: int
    compliance_rate: float
    due_for_maintenance: int
    expiring_documents: int
    cost_by_area: list[BreakdownItem]
    cost_by_garage: list[BreakdownItem]
    records_by_week: list[BreakdownItem]
    compliance_breakdown: list[BreakdownItem]


class MaintenanceDueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plate_number: str
    status: str | None
    alert_status: str | None
    current_odo: int | None
    next_maintenance_odo: int | None
    remaining_odo: int | None
    manager_unit: str | None


class DocumentExpiringOut(BaseModel):
    plate_number: str
    manager_unit: str | None
    doc_type: str
    expiry_raw: str
    days_remaining: int | None


class FleetAlertsOut(BaseModel):
    maintenance_due: list[MaintenanceDueOut]
    document_expiring: list[DocumentExpiringOut]


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plate_number: str
    status: str | None
    load_capacity: str | None
    brand: str | None
    vehicle_model: str | None
    manufacture_year: int | None
    manager_unit: str | None
    fleet_team: str | None
    odo: int | None
    inspection_expiry: str | None
    road_fee_expiry: str | None
    registration_expiry: str | None
    civil_insurance_expiry: str | None
    physical_insurance_expiry: str | None
    decal_expiry: str | None


class DocumentRowOut(BaseModel):
    plate_number: str
    manager_unit: str | None
    brand: str | None
    doc_type: str
    expiry_raw: str | None
    days_remaining: int | None
    doc_status: str


class MaintenanceScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plate_number: str
    status: str | None
    brand: str | None
    manager_unit: str | None
    current_odo: int | None
    next_maintenance_odo: int | None
    remaining_odo: int | None
    alert_status: str | None
    schedule_status: str
    note: str | None


class VehicleLookupOut(BaseModel):
    vehicle: VehicleOut
    documents: list[DocumentRowOut]
    maintenance_status: MaintenanceScheduleOut | None
    recent_records: list[MaintenanceRecordOut]


class AppSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    expiry_alert_window_days: int
    due_threshold_km: int
    upcoming_threshold_km: int


class AppSettingsIn(BaseModel):
    expiry_alert_window_days: int | None = None
    due_threshold_km: int | None = None
    upcoming_threshold_km: int | None = None


class HealthScoreOut(BaseModel):
    plate_number: str
    brand: str | None
    manager_unit: str | None
    status: str | None
    score: int
    compliance_score: int
    freq_score: int
    bd_score: int
    doc_score: int
    repair_count: int
    total_cost: int


class SmartAlertOut(BaseModel):
    plate_number: str
    severity: str
    title: str
    body: str


class CompareRowOut(BaseModel):
    plate_number: str
    brand: str | None
    vehicle_model: str | None
    status: str | None
    odo: int | None
    score: int | None
    repair_count: int
    total_cost: int


class PerformanceRowOut(BaseModel):
    plate_number: str
    brand: str | None
    manager_unit: str | None
    visit_count: int
    total_downtime_hours: float
    avg_hours_per_visit: float | None


class MaintenanceRecordCreateIn(BaseModel):
    plate_number: str
    entry_date: datetime
    work_type: str
    maintenance_category: str | None = None
    detail: str | None = None
    garage: str | None = None
    cost: int | None = None
    note: str | None = None
