from sqlalchemy import Column, Integer, String, DateTime

from core.database import Base


class VehicleMaintenanceStatus(Base):
    """Trạng thái bảo dưỡng định kỳ theo ODO hiện tại của từng xe (dùng để cảnh báo đến kỳ BD)."""

    __tablename__ = "vehicle_maintenance_status"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, index=True)
    load_capacity = Column(String)
    brand = Column(String)
    vehicle_model = Column(String)
    manager_unit = Column(String, index=True)
    manufacture_year = Column(Integer)
    current_odo = Column(Integer)
    odo_update_date = Column(DateTime, nullable=True)
    last_maintenance_odo = Column(Integer)
    last_maintenance_date = Column(DateTime, nullable=True)
    last_maintenance_odo_target = Column(Integer)
    next_maintenance_odo = Column(Integer)
    remaining_odo = Column(Integer, index=True)
    alert_status = Column(String, index=True)
    battery_replace_date = Column(String)
    tire_odo = Column(Integer)
    tire_replace_date = Column(String)
    tire_used_km = Column(Integer)
    battery_date = Column(String)
    note = Column(String)
