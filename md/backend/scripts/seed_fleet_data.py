"""
Import (nạp) dữ liệu đội xe từ file backend/data/fleet_sheet_raw.md vào SQLite.

Cách dùng: chạy lại lệnh này mỗi khi có bản export mới từ Google Sheet
(ghi đè file fleet_sheet_raw.md rồi chạy lại script).

    cd backend
    python scripts/seed_fleet_data.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import Base, SessionLocal, engine  # noqa: E402
from models.maintenance_record import MaintenanceRecord  # noqa: E402
from models.vehicle import Vehicle  # noqa: E402
from models.vehicle_maintenance_status import VehicleMaintenanceStatus  # noqa: E402
from services.fleet_parser import parse_maintenance_records  # noqa: E402
from services.fleet_parser import parse_maintenance_status, parse_vehicles  # noqa: E402

DATA_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data",
    "fleet_sheet_raw.md",
)


def seed() -> None:
    Base.metadata.create_all(bind=engine)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    records = parse_maintenance_records(text)
    vehicles = parse_vehicles(text)
    statuses = parse_maintenance_status(text)

    db = SessionLocal()
    try:
        db.query(MaintenanceRecord).delete()
        db.query(Vehicle).delete()
        db.query(VehicleMaintenanceStatus).delete()

        db.bulk_insert_mappings(MaintenanceRecord, records)
        db.bulk_insert_mappings(Vehicle, vehicles)
        db.bulk_insert_mappings(VehicleMaintenanceStatus, statuses)

        db.commit()
    finally:
        db.close()

    print(
        f"Đã import {len(records)} nhật ký BTBD, {len(vehicles)} xe, {len(statuses)} trạng thái bảo dưỡng."
    )


if __name__ == "__main__":
    seed()
