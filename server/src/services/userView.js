// users 행의 '공개 디자인 설정'을 프론트 친화적 camelCase 로 추출(여러 라우트 공용).
// auth(toPublicUser) 와 public(toPublicProfile) 이 동일한 디자인 필드를 내려주도록 한다.
function parseSns(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v; // mysql2 가 JSON 을 이미 파싱한 경우
  try {
    const arr = JSON.parse(v);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function toDesign(row) {
  return {
    themeColor: row.theme_color,
    coverImageUrl: row.cover_image_url,
    profileLayout: row.profile_layout,
    profileAlign: row.profile_align,
    profileFontSize: row.profile_font_size,
    snsLinks: parseSns(row.sns_links),
    blockShape: row.block_shape,
    blockAlign: row.block_align,
    blockColor: row.block_color,
    bgType: row.bg_type,
    bgColor: row.bg_color,
    bgImageUrl: row.bg_image_url,
    noticeText: row.notice_text,
    noticeTextColor: row.notice_text_color,
    noticeBgColor: row.notice_bg_color,
    businessEnabled: !!row.business_enabled,
    businessUrl: row.business_url,
    searchEnabled: !!row.search_enabled,
    blockTextColor: row.block_text_color,
    profileTextColor: row.profile_text_color,
    businessTextColor: row.business_text_color,
  };
}
