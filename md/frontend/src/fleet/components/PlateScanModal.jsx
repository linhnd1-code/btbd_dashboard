import { useEffect, useRef, useState } from 'react';
import { createWorker, PSM } from 'tesseract.js';

const GUIDE = { xPct: 0.1, yPct: 0.36, wPct: 0.8, hPct: 0.28 };

export default function PlateScanModal({ onClose, onDetected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState('starting'); // starting | live | scanning | error
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setPhase('live');
      })
      .catch((e) => {
        setPhase('error');
        setError(`Không truy cập được camera: ${e.message}. Trình duyệt cần quyền camera và kết nối HTTPS/localhost.`);
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setPhase('scanning');
    try {
      const sx = video.videoWidth * GUIDE.xPct;
      const sy = video.videoHeight * GUIDE.yPct;
      const sw = video.videoWidth * GUIDE.wPct;
      const sh = video.videoHeight * GUIDE.hPct;
      const canvas = canvasRef.current;
      canvas.width = sw * 2;
      canvas.height = sh * 2;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-',
      });
      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      const cleaned = (data.text || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '').trim();
      if (!cleaned) {
        setPhase('error');
        setError('Không đọc được ký tự nào trong khung. Đưa biển số sát khung hơn, đủ sáng rồi chụp lại.');
        return;
      }
      onDetected(cleaned);
    } catch (e) {
      setPhase('error');
      setError(`Lỗi nhận diện: ${e.message}`);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,12,18,.6)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="card" style={{ width: 480, maxWidth: '92vw', padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <h4 style={{ margin: 0 }}>Quét biển số bằng camera</h4>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9aa1ab' }}>
            <i className="ph-bold ph-x" style={{ fontSize: 16 }} />
          </button>
        </div>

        {phase === 'error' && <div style={{ color: '#e5484d', fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#000', minHeight: 200 }}>
          <video ref={videoRef} muted playsInline style={{ width: '100%', display: phase === 'scanning' ? 'none' : 'block' }} />
          {phase === 'live' && (
            <div
              style={{
                position: 'absolute', left: `${GUIDE.xPct * 100}%`, top: `${GUIDE.yPct * 100}%`,
                width: `${GUIDE.wPct * 100}%`, height: `${GUIDE.hPct * 100}%`,
                border: '2px dashed #4ade80', borderRadius: 6, boxShadow: '0 0 0 2000px rgba(0,0,0,.35)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 11, color: '#4ade80', marginBottom: -18, whiteSpace: 'nowrap' }}>Đưa biển số vào khung</span>
            </div>
          )}
          {phase === 'scanning' && (
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 8 }}>
              <i className="ph-duotone ph-spinner-gap" style={{ fontSize: 26, animation: 'flt-spin .8s linear infinite' }} />
              <span style={{ fontSize: 12.5 }}>Đang nhận diện ký tự (chạy trực tiếp trên máy)...</span>
            </div>
          )}
          {phase === 'starting' && (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b929c', fontSize: 12.5 }}>Đang mở camera...</div>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div style={{ fontSize: 11, color: '#9aa1ab', margin: '8px 0 0' }}>
          OCR thật (Tesseract.js) chạy ngay trên trình duyệt — không gửi ảnh lên server. Độ chính xác phụ thuộc ánh sáng và góc chụp, hãy kiểm tra lại kết quả trước khi tra cứu.
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Đóng
          </button>
          <button type="button" className="btn btn-primary" onClick={capture} disabled={phase !== 'live'}>
            <i className="ph-duotone ph-camera" />
            Chụp &amp; nhận diện
          </button>
        </div>
      </div>
    </div>
  );
}
