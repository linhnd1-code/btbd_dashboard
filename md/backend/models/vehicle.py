from sqlalchemy import Column, Integer, String, DateTime

from core.database import Base


class Vehicle(Base):
    """Danh sách xe: thông tin đăng ký, hạn đăng kiểm/bảo hiểm/phù hiệu."""

    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, index=True)
    load_capacity = Column(String)
    brand = Column(String, index=True)
    vehicle_model = Column(String)
    manufacture_year = Column(Integer)
    manager_unit = Column(String, index=True)
    fleet_team = Column(String, index=True)
    lifespan_year = Column(String)
    operation_date = Column(DateTime, nullable=True)
    years_used = Column(String)
    registration_number = Column(String)
    registration_date = Column(String)
    chassis_number = Column(String)
    engine_number = Column(String)
    inspection_code = Column(String)
    management_number = Column(String)
    receipt_date = Column(String)
    # Các cột hạn giấy tờ đôi khi chứa chữ ("hết hạn") thay vì ngày, nên lưu String thô.
    inspection_expiry = Column(String)
    road_fee_expiry = Column(String)
    registration_expiry = Column(String)
    civil_insurance_expiry = Column(String)
    physical_insurance_expiry = Column(String)
    decal_expiry = Column(String)
    odo = Column(Integer)
    insurance_provider = Column(String)
