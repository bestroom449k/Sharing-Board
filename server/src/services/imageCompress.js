// 업로드 전 이미지 압축(최적화) 서비스.
// - 너무 큰 이미지를 화면 표시에 충분한 크기로 리사이즈
// - 모든 포맷을 WebP(손실 압축)로 변환해 용량을 크게 줄임
//   (PNG 무손실은 사진을 못 줄이므로, 투명도까지 지원하는 WebP 로 통일)
// - EXIF 방향 보정(.rotate())으로 휴대폰 사진이 눕는 문제 방지
// 처리에 실패하거나 오히려 더 커지면 원본을 그대로 반환한다(업로드 자체는 막지 않음).
import sharp from 'sharp';

// 가로/세로 최대 픽셀. 링크인바이오는 휴대폰 폭(~400px)에서 보이므로 1280이면 충분.
const MAX_DIM = 1280;
// WebP 손실 압축 품질. 80은 용량·화질 균형점.
const QUALITY = 80;

export async function compressImage(buffer, mime) {
  try {
    // GIF(애니메이션)는 프레임을 보존해야 하므로 animated 로 읽고, 애니메이션 WebP 로 출력.
    const isGif = mime === 'image/gif';
    const out = await sharp(buffer, { animated: isGif })
      .rotate() // EXIF 방향 자동 보정
      .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
      // 모든 입력 포맷(JPEG/PNG/GIF/WebP)을 WebP 손실 압축으로 통일.
      .webp({ quality: QUALITY })
      .toBuffer();

    // 이미 매우 작은 이미지는 WebP 변환본이 오히려 클 수 있다 → 그때는 원본 포맷 유지.
    if (out.length >= buffer.length) return { buffer, mime, compressed: false };
    return { buffer: out, mime: 'image/webp', compressed: true };
  } catch {
    // 손상 파일 등으로 처리가 실패해도 원본으로 업로드를 진행한다.
    return { buffer, mime, compressed: false };
  }
}
