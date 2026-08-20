import { useState, useEffect } from 'react';

export default function Home() {
  const [status, setStatus] = useState('Đang kiểm tra kết nối với Backend...');

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/health')
      .then(res => res.json())
      .then(data => setStatus(data.message))
      .catch(() => setStatus('Lỗi: Chưa bật Backend Python! (Vui lòng chạy `python main.py`)'));
  }, []);

  return (
    <div>
      <h1>Khung Sườn Tổng Quan (Internal Framework)</h1>
      <p style={{ color: '#475569' }}>
        Đây là <b>bộ khung (Boilerplate)</b> vững chắc để bạn cắm các dự án con (Module) vào. Bất kể là làm App Render Video hay App Nội bộ, tất cả đều dùng chung bộ khung này.
      </p>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Trạng thái kết nối API (Frontend &lt;-&gt; Backend):</h3>
        <p style={{ color: status.includes('Lỗi') ? '#dc2626' : '#16a34a', fontWeight: 'bold', margin: 0 }}>
          {status}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', flex: 1 }}>
          <h3>App Render Video</h3>
          <p style={{ color: '#64748b' }}>Sẽ được phát triển trong thư mục <code>/src/pages/VideoEditor</code> và gọi API riêng.</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', flex: 1 }}>
          <h3>App Quản Lý Khác</h3>
          <p style={{ color: '#64748b' }}>Cũng sẽ được thêm vào hệ thống dưới dạng các Route độc lập.</p>
        </div>
      </div>
    </div>
  )
}
