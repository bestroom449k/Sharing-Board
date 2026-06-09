import { useState } from 'react';
import { api } from '../../api/client.js';

// 이미지 첨부 컴포넌트. 파일 선택 → 서버 업로드 → 공개 URL을 value 로 올려준다.
// value: 현재 이미지 URL(없으면 null), onChange(url|null): 변경 콜백.
export default function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일을 다시 선택해도 onChange 가 동작하도록 초기화
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="img-uploader">
      {value ? (
        <div className="img-preview">
          <img src={value} alt="첨부 이미지" />
          <button type="button" className="img-remove" onClick={() => onChange(null)}>
            이미지 제거
          </button>
        </div>
      ) : (
        <label className="img-drop">
          {uploading ? '업로드 중…' : '🖼 이미지 첨부 (JPG/PNG/GIF/WEBP, 5MB 이하)'}
          <input type="file" accept="image/*" hidden onChange={onFile} disabled={uploading} />
        </label>
      )}
      {error && <div className="form-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
