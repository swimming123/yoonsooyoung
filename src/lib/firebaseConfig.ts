// Firebase SDK 를 불러오지 않는 설정값만 모은 파일.
// 블로그 방문자는 Firebase SDK 를 내려받지 않도록, SDK 는 lib/firebase.ts 에서 필요할 때만 불러옵니다.

export const firebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Firebase 설정값이 채워졌는지. 비어 있으면 블로그만 동작합니다. */
export const firebaseConfigured = Boolean(firebaseOptions.apiKey && firebaseOptions.projectId)

/** 화면 표시용 주인 uid 목록. 실제 보호는 firestore.rules 가 합니다. */
export const ownerUids: string[] = (import.meta.env.VITE_OWNER_UIDS ?? '')
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean)
