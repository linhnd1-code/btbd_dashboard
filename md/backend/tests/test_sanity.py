import pytest

def test_system_sanity():
    """
    Bài test đầu tiên để đảm bảo CI/CD Pipeline chạy mượt mà.
    Bất kỳ đoạn code mới nào thêm vào cũng BẮT BUỘC phải có test case.
    """
    assert 1 + 1 == 2
    assert True is True
