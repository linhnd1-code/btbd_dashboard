from core.database import Base
from sqlalchemy import Column, DateTime, Float, Integer, String


class MaintenanceRecord(Base):
    """Nhật ký từng lượt bảo dưỡng/sửa chữa của xe (nhập xưởng - ra xưởng)."""

    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, index=True, nullable=False)
    vehicle_info = Column(String)
    manufacture_year = Column(Integer)
    odo = Column(Integer)
    odo_target = Column(Integer, nullable=True)
    entry_date = Column(DateTime, index=True)
    work_type = Column(String, index=True)
    maintenance_category = Column(String)
    detail = Column(String)
    garage = Column(String, index=True)
    expected_finish_date = Column(DateTime, nullable=True)
    exit_date = Column(DateTime, nullable=True)
    total_hours = Column(Float)
    note = Column(String)
    cost = Column(Integer, nullable=True)
    managing_department = Column(String)
    area = Column(String, index=True)
    week = Column(String, index=True)
    odo_overdue = Column(Integer, nullable=True)
    compliance_check = Column(String, index=True)
