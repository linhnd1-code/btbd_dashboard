import { useState } from 'react';

export default function VideoEditor() {
  const [status, setStatus] = useState('');

  const handleRender = async () => {
    setStatus('Đang gửi yêu cầu tới máy chủ...');
    try {
      const response = await fetch('http://localhost:8000/api/v1/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_title: 'Demo_Video', duration: 30 })
      });
      const data = await response.json();
      setStatus(data.message);
    } catch (error) {
      setStatus('Lỗi: Máy chủ Backend (Python) chưa được bật!');
    }
  }

  return (
    <div>
      <h1>Trình Render Video (Automation)</h1>
      <p>Khu vực này cho phép bạn cấu hình kịch bản video và đẩy xuống Backend xử lý ngầm.</p>
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '500px' }}>
        <button 
          onClick={handleRender}
          style={{ padding: '10px 20px', cursor: 'pointer', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px' }}>
          🚀 Bắt đầu Render Video
        </button>
        <p style={{ marginTop: '15px', color: '#dc2626', fontWeight: 'bold' }}>{status}</p>
      </div>
    </div>
  )
}
