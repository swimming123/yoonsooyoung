// Firebase Auth 오류 코드를 사람이 읽을 수 있는 안내로 바꿉니다.
// 코드는 원인을 찾을 때 필요하므로 화면에도 함께 보여줍니다.

export function authErrorCode(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e && typeof e.code === 'string') return e.code
  return 'unknown'
}

export function authErrorMessage(code: string): string {
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email' ||
    code === 'auth/invalid-login-credentials'
  ) {
    return '이메일 또는 비밀번호가 맞지 않아요.'
  }
  if (code.startsWith('auth/api-key-not-valid') || code === 'auth/invalid-api-key') {
    return 'Firebase API 키가 올바르지 않아요. GitHub Variables 의 VITE_FIREBASE_API_KEY 값에 따옴표·쉼표·공백이 섞였는지 확인하세요.'
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Firebase 콘솔에서 이메일/비밀번호 로그인이 꺼져 있어요. Authentication → 로그인 방법에서 켜 주세요.'
  }
  if (code === 'auth/configuration-not-found' || code === 'auth/project-not-found') {
    return 'Firebase 프로젝트 설정을 찾지 못했어요. VITE_FIREBASE_PROJECT_ID 와 VITE_FIREBASE_AUTH_DOMAIN 값을 확인하세요.'
  }
  if (code === 'auth/unauthorized-domain') {
    return '이 주소가 Firebase 승인된 도메인에 없어요. Authentication → 설정 → 승인된 도메인에 추가하세요.'
  }
  if (code === 'auth/network-request-failed') {
    return '네트워크 오류로 Firebase 에 연결하지 못했어요. 인터넷 연결을 확인하세요.'
  }
  if (code === 'auth/too-many-requests') {
    return '로그인 시도가 너무 많아 잠시 막혔어요. 몇 분 뒤에 다시 시도하세요.'
  }
  if (code === 'auth/user-disabled') {
    return '사용 중지된 계정이에요. Firebase 콘솔에서 계정 상태를 확인하세요.'
  }
  return '로그인에 실패했어요.'
}
