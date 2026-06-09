// 이미지 스토리지 서비스.
// - R2 설정이 완비되면 Cloudflare R2(S3 호환)에 업로드한다.
// - 설정이 없으면 개발 편의를 위해 서버 로컬 디스크(uploads/)에 저장하는 폴백을 사용한다.
// 어느 경우든 공개적으로 접근 가능한 절대 URL 문자열을 반환한다.
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config, isR2Configured } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/ 루트. 로컬 폴백 파일 경로를 객체 키로부터 그대로 만들 때 기준이 된다.
const SERVER_ROOT = path.join(__dirname, '..', '..');

// 업로드 객체 키/URL 의 공통 접두어(폴더명).
// R2 버킷 안에서도 images/ 폴더로 정리되고, 로컬 폴백도 server/images 폴더 +
// /images 정적 경로로 동일하게 맞춰 두 모드의 URL 형태를 일치시킨다.
export const STORAGE_PREFIX = 'images';

// 로컬 폴백 정적 서빙 루트(server/images). .gitignore 에 포함되어 있다.
const UPLOAD_DIR = path.join(SERVER_ROOT, STORAGE_PREFIX);

// 유저별 하위 폴더명으로 쓸 문자열을 경로-안전하게 정리한다.
// 닉네임에는 글자수 외 제약이 없으므로, 경로 구분자/상위경로(..)/제어문자 등을
// 제거해 디렉터리 탈출(path traversal)을 막는다. 한글·숫자 등 일반 문자는 보존.
export function sanitizeFolder(name) {
  const cleaned = String(name ?? '')
    .normalize('NFC')
    .replace(/[\\/]+/g, '_') // 경로 구분자 → _ (traversal 차단)
    .replace(/\.\.+/g, '_') // 연속된 점(상위 경로) → _
    .replace(/[\x00-\x1f]/g, '') // 제어문자 제거
    .replace(/[<>:"|?*]/g, '') // OS 예약/금지 문자 제거
    .replace(/\s+/g, '_') // 공백 → _
    .replace(/^[._]+|[._]+$/g, '') // 앞뒤 점/언더스코어 정리
    .slice(0, 50);
  return cleaned || 'user';
}

// 허용 이미지 MIME → 확장자 매핑(임의 확장자 주입 방지).
const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export function isAllowedImageMime(mime) {
  return Object.prototype.hasOwnProperty.call(MIME_EXT, mime);
}

// R2 클라이언트는 설정이 있을 때 한 번만 생성(지연 초기화).
let _s3 = null;
function getS3() {
  if (!_s3) {
    _s3 = new S3Client({
      region: 'auto', // R2 는 region 을 'auto' 로 둔다.
      endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    });
  }
  return _s3;
}

// 이미지 버퍼를 업로드하고 공개 URL을 반환한다.
//  buffer:    파일 바이트
//  mime:      MIME 타입(허용 목록은 라우트에서 1차 검증)
//  userName:  유저 이름(닉네임). images/{유저이름}/ 하위에 저장하기 위한 폴더명.
// 최종 객체 키 형태: images/{유저이름}/{uuid}.{ext}
export async function uploadImage(buffer, mime, userName) {
  const ext = MIME_EXT[mime] || 'bin';
  const folder = sanitizeFolder(userName);
  // 예측 불가능한 파일명(UUID)으로 충돌과 추측 접근을 막는다.
  const key = `${STORAGE_PREFIX}/${folder}/${randomUUID()}.${ext}`;

  if (isR2Configured) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: config.r2.bucket,
        Key: key,
        Body: buffer,
        ContentType: mime,
      }),
    );
    return `${config.r2.publicBaseUrl}/${key}`;
  }

  // ----- 로컬 디스크 폴백 -----
  // 객체 키(images/{유저}/{파일})를 그대로 디렉터리 구조로 만들어 저장한다.
  const localPath = path.join(SERVER_ROOT, key);
  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, buffer);
  // 정적 라우트(/images)로 서빙되므로 백엔드 절대 URL로 반환.
  return `${config.backendPublicUrl}/${key}`;
}

export const UPLOADS_LOCAL_DIR = UPLOAD_DIR;
