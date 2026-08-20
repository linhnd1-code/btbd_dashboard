"""Múi giờ chuẩn cho nghiệp vụ đội xe: Hà Nội (UTC+07:00).

Dùng thay cho datetime.now()/utcnow() trần ở những nơi cần mốc thời gian hiển
thị cho người dùng (đồng bộ, hạn giấy tờ, chi phí theo tuần/tháng/năm...) — để
kết quả không phụ thuộc múi giờ hệ điều hành máy chủ đang chạy backend.
"""

from datetime import datetime
from zoneinfo import ZoneInfo

HANOI_TZ = ZoneInfo("Asia/Ho_Chi_Minh")


def now_hanoi() -> datetime:
    return datetime.now(HANOI_TZ)
