"""
Parser cho file markdown xuất từ Google Sheet quản lý đội xe (BTBD).

Sheet gốc chứa nhiều bảng nối liền nhau (mỗi bảng cách nhau bởi 1 dòng trống,
bắt đầu bằng dòng căn lề kiểu "| :-: | :-: | ..."). Hàm parse_sheet() tách các
bảng dựa theo dòng tiêu đề, vì thứ tự bảng có thể thay đổi khi người dùng
export lại từ Google Sheet.
"""

import re
from datetime import datetime

VN_MONTHS_RE = re.compile(r"^\d{1,2}/\d{1,2}/\d{4}(\s+\d{1,2}:\d{2}(:\d{2})?)?$")


def clean_cell(raw: str) -> str:
    """Bỏ khoảng trắng thừa và un-escape dấu trừ mà Google Drive markdown hoá thành "\\-"."""
    value = raw.strip()
    if value.startswith("\\-"):
        value = "-" + value[2:]
    return value


def parse_row(line: str) -> list[str]:
    """Tách 1 dòng markdown table "| a | b | c |" thành list ô, đã clean_cell."""
    cells = line.strip().split("|")[1:-1]
    return [clean_cell(c) for c in cells]


def to_int(value: str) -> int | None:
    if not value:
        return None
    cleaned = value.replace(",", "").replace(".", "").strip()
    try:
        return int(cleaned)
    except ValueError:
        return None


def to_float(value: str) -> float | None:
    if not value:
        return None
    cleaned = value.replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def to_date(value: str) -> datetime | None:
    if not value or not VN_MONTHS_RE.match(value):
        return None
    fmt = "%d/%m/%Y %H:%M:%S" if len(value.split()) > 1 else "%d/%m/%Y"
    try:
        return datetime.strptime(value, fmt)
    except ValueError:
        return None


def split_tables(text: str) -> list[list[list[str]]]:
    """
    Trả về list các bảng; mỗi bảng là list các dòng đã parse_row (header ở vị trí [0]).
    Bỏ qua dòng căn lề "| :-: | ... |".
    """
    tables: list[list[list[str]]] = []
    current: list[list[str]] = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            if current:
                tables.append(current)
                current = []
            continue
        if re.match(r"^\|(\s*:?-+:?\s*\|)+$", line):
            continue
        row = parse_row(line)
        # Google Sheets chèn 1 dòng toàn ô trống trước header thật (dòng tiêu đề trang trí) - bỏ qua.
        if not current and not any(row):
            continue
        current.append(row)
    if current:
        tables.append(current)
    return tables


def is_index_row(row: list[str]) -> bool:
    """Google Sheet đôi khi chèn 1 dòng số thứ tự cột ("| 1 | 2 | 3 |...") ngay sau header."""
    non_empty = [c for c in row if c]
    return bool(non_empty) and all(c.isdigit() for c in non_empty)


def find_table(tables: list[list[list[str]]], first_header_cell: str, must_contain: str) -> list[list[str]] | None:
    for table in tables:
        if not table:
            continue
        header = table[0]
        if header and header[0] == first_header_cell and any(must_contain in h for h in header):
            body = table[1:]
            if body and is_index_row(body[0]):
                body = body[1:]
            return body
    return None


def parse_maintenance_records(text: str) -> list[dict]:
    """Bảng 1: Nhật ký sửa chữa/bảo dưỡng (header bắt đầu bằng "BKS")."""
    tables = split_tables(text)
    rows = find_table(tables, "BKS", "Kiểm tra")
    if not rows:
        return []
    records = []
    for row in rows:
        if len(row) < 20 or not row[0]:
            continue
        records.append(
            {
                "plate_number": row[0],
                "vehicle_info": row[1] or None,
                "manufacture_year": to_int(row[2]),
                "odo": to_int(row[3]),
                "odo_target": to_int(row[4]),
                "entry_date": to_date(row[5]),
                "work_type": row[6] or None,
                "maintenance_category": row[7] or None,
                "detail": row[8] or None,
                "garage": row[9] or None,
                "expected_finish_date": to_date(row[10]),
                "exit_date": to_date(row[11]),
                "total_hours": to_float(row[12]),
                "note": row[13] or None,
                "cost": to_int(row[14]),
                "managing_department": row[15] or None,
                "area": row[16] or None,
                "week": row[17] or None,
                "odo_overdue": to_int(row[18]),
                "compliance_check": row[19] or None,
            }
        )
    return records


def parse_vehicles(text: str) -> list[dict]:
    """Bảng 2: Danh sách xe (header bắt đầu bằng "Tình trạng", có cột "Niên hạn")."""
    tables = split_tables(text)
    rows = find_table(tables, "Tình trạng", "Niên hạn")
    if not rows:
        return []
    vehicles = []
    for row in rows:
        if len(row) < 39 or not row[1]:
            continue
        vehicles.append(
            {
                "plate_number": row[1],
                "status": row[0] or None,
                "load_capacity": row[2] or None,
                "brand": row[3] or None,
                "vehicle_model": row[4] or None,
                "manufacture_year": to_int(row[5]),
                "manager_unit": row[6] or None,
                "fleet_team": row[7] or None,
                "lifespan_year": row[8] or None,
                "operation_date": to_date(row[9]),
                "years_used": row[10] or None,
                "registration_number": row[11] or None,
                "registration_date": row[12] or None,
                "chassis_number": row[13] or None,
                "engine_number": row[14] or None,
                "inspection_code": row[27] or None,
                "management_number": row[28] or None,
                "receipt_date": row[29] or None,
                "inspection_expiry": row[32] or None,
                "road_fee_expiry": row[33] or None,
                "registration_expiry": row[34] or None,
                "civil_insurance_expiry": row[35] or None,
                "physical_insurance_expiry": row[36] or None,
                "decal_expiry": row[37] or None,
                "odo": to_int(row[38]),
                "insurance_provider": row[39] if len(row) > 39 else None,
            }
        )
    return vehicles


def parse_maintenance_status(text: str) -> list[dict]:
    """Bảng 3: Theo dõi bảo dưỡng định kỳ theo ODO (header bắt đầu bằng "Trạng thái", có cột "ODO hiện tại")."""
    tables = split_tables(text)
    rows = find_table(tables, "Trạng thái", "ODO hiện tại")
    if not rows:
        return []
    statuses = []
    for row in rows:
        if len(row) < 21 or not row[1]:
            continue
        statuses.append(
            {
                "plate_number": row[1],
                "status": row[0] or None,
                "load_capacity": row[2] or None,
                "brand": row[3] or None,
                "vehicle_model": row[4] or None,
                "manager_unit": row[5] or None,
                "manufacture_year": to_int(row[6]),
                "current_odo": to_int(row[7]),
                "odo_update_date": to_date(row[8]),
                "last_maintenance_odo": to_int(row[9]),
                "last_maintenance_date": to_date(row[10]),
                "last_maintenance_odo_target": to_int(row[11]),
                "next_maintenance_odo": to_int(row[13]) if len(row) > 13 else None,
                "remaining_odo": to_int(row[14]) if len(row) > 14 else None,
                "alert_status": row[15] if len(row) > 15 else None,
                "battery_replace_date": row[16] if len(row) > 16 else None,
                "tire_odo": to_int(row[17]) if len(row) > 17 else None,
                "tire_replace_date": row[18] if len(row) > 18 else None,
                "tire_used_km": to_int(row[19]) if len(row) > 19 else None,
                "battery_date": row[20] if len(row) > 20 else None,
                "note": row[21] if len(row) > 21 else None,
            }
        )
    return statuses
