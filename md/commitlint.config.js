module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Tính năng mới (New feature)
        'fix',      // Sửa lỗi (Bug fix)
        'docs',     // Cập nhật tài liệu (Documentation)
        'style',    // Format code, dấu phẩy, khoảng trắng (Formatting)
        'refactor', // Cấu trúc lại code nhưng không đổi logic (Refactoring)
        'test',     // Bổ sung script test (Adding tests)
        'chore',    // Chỉnh sửa linh tinh như cập nhật thư viện (Maintenance)
        'revert',   // Lùi lại phiên bản cũ (Reverting)
        'perf'      // Tối ưu hiệu năng (Performance improvement)
      ]
    ],
    'subject-case': [0, 'never'] // Bỏ qua bắt buộc viết thường/hoa ở đầu câu
  }
};
