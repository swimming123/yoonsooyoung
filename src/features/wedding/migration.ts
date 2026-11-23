// 기존 웨딩플래너 Firebase 프로젝트(wedding-log-ab8be)의 데이터를 이 사이트 프로젝트로 복사합니다.
// 웨딩플래너 페이지(public/wedding/*.html)가 읽고 쓰는 위치를 빠짐없이 적어 둡니다.

/** 기존 웨딩플래너 프로젝트 설정 (공개 값. public/wedding/index.html 과 같음) */
export const sourceFirebaseOptions = {
  apiKey: 'AIzaSyCv4C_YQfPmq3vWAzfH9hicceBKn7uGDcQ',
  authDomain: 'wedding-log-ab8be.firebaseapp.com',
  projectId: 'wedding-log-ab8be',
  storageBucket: 'wedding-log-ab8be.firebasestorage.app',
  messagingSenderId: '1051939244748',
  appId: '1:1051939244748:web:42e1b03187ce036f8c9069',
}

export type CopyTarget =
  | { kind: 'doc'; path: [string, string]; label: string }
  | { kind: 'collection'; path: string; label: string }

export const COPY_TARGETS: CopyTarget[] = [
  { kind: 'doc', path: ['app', 'settings'], label: '설정 (예식일·타임라인 공개 설정)' },
  { kind: 'doc', path: ['app', 'checklist'], label: '체크리스트' },
  { kind: 'doc', path: ['app', 'expenses'], label: '지출 장부' },
  { kind: 'doc', path: ['app', 'infosheet'], label: '정보 메모' },
  { kind: 'doc', path: ['app', 'invitation'], label: '청첩장 시안' },
  { kind: 'collection', path: 'invitationPhotos', label: '청첩장 사진' },
  { kind: 'collection', path: 'moodboardBoards', label: '무드보드' },
  { kind: 'collection', path: 'moodboardSections', label: '무드보드 섹션' },
  { kind: 'collection', path: 'guests', label: '하객 명단' },
]

export function targetKey(t: CopyTarget): string {
  return t.kind === 'doc' ? t.path.join('/') : t.path
}
