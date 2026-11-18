import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from 'firebase/auth'
import { firebaseConfigured, ownerUids } from '@/lib/firebaseConfig'

// Firebase SDK 는 로그인 상태를 처음 확인할 때 불러옵니다(블로그만 보는 방문자는 받지 않음).
const loadSdk = async () => {
  const [{ auth }, firebaseAuth] = await Promise.all([import('@/lib/firebase'), import('firebase/auth')])
  return { auth: auth(), firebaseAuth }
}

// 이 브라우저에서 로그인한 적이 있는지 표시. 있을 때만 첫 화면에서 SDK 를 불러와
// 메뉴(가계부·웨딩플래너)를 보여줍니다. 로그인 정보 자체는 Firebase 가 따로 보관합니다.
const LOGIN_HINT = 'yoonsooyoung:logged-in'

export function hadLogin(): boolean {
  try {
    return localStorage.getItem(LOGIN_HINT) === '1'
  } catch {
    return false
  }
}

function rememberLogin(on: boolean) {
  try {
    if (on) localStorage.setItem(LOGIN_HINT, '1')
    else localStorage.removeItem(LOGIN_HINT)
  } catch {
    // 저장소를 못 쓰면 메뉴가 로그인 후에만 보일 뿐 기능에는 영향 없음
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const ready = ref(!firebaseConfigured)

  let readyPromise: Promise<void> | undefined

  /** 첫 로그인 상태가 확인될 때까지 기다립니다. 라우터 가드에서 사용합니다. */
  function init(): Promise<void> {
    if (!firebaseConfigured) return Promise.resolve()
    readyPromise ??= loadSdk().then(
      ({ auth, firebaseAuth }) =>
        new Promise<void>((resolve) => {
          firebaseAuth.onAuthStateChanged(auth, (u) => {
            user.value = u
            ready.value = true
            rememberLogin(u !== null)
            resolve()
          })
        }),
    )
    return readyPromise
  }

  const isLoggedIn = computed(() => user.value !== null)
  /** 주인 목록이 비어 있으면 로그인한 사람을 주인으로 봅니다(초기 설정용). */
  const isOwner = computed(
    () => user.value !== null && (ownerUids.length === 0 || ownerUids.includes(user.value.uid)),
  )

  /** 웨딩플래너에서 쓰던 이메일/비밀번호 계정으로 로그인합니다(같은 uid 를 그대로 사용). */
  async function login(email: string, password: string) {
    const { auth, firebaseAuth } = await loadSdk()
    await firebaseAuth.signInWithEmailAndPassword(auth, email, password)
    rememberLogin(true)
  }

  async function logout() {
    const { auth, firebaseAuth } = await loadSdk()
    await firebaseAuth.signOut(auth)
    rememberLogin(false)
  }

  return { user, ready, isLoggedIn, isOwner, init, login, logout }
})
