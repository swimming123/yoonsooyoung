<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { firebaseConfigured, firebaseOptions } from '@/lib/firebaseConfig'
import { authErrorCode, authErrorMessage } from '@/lib/authErrors'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const errorCode = ref('')
const busy = ref(false)
// 어느 Firebase 프로젝트로 빌드됐는지 확인용(공개 값)
const projectId = firebaseOptions.projectId

if (firebaseConfigured) void authStore.init()

// 주인으로 로그인되면 원래 가려던 곳으로 보냅니다.
watchEffect(() => {
  if (authStore.isOwner) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    void router.replace(redirect)
  }
})

async function login() {
  error.value = ''
  errorCode.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = '이메일과 비밀번호를 입력해 주세요.'
    return
  }
  busy.value = true
  try {
    await authStore.login(email.value.trim(), password.value)
  } catch (e) {
    console.error('로그인 실패', e)
    errorCode.value = authErrorCode(e)
    error.value = authErrorMessage(errorCode.value)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <h1>로그인</h1>
  <p v-if="!firebaseConfigured" class="notice">
    Firebase 설정값이 아직 없습니다. README의 “Firebase 설정” 절을 따라 값을 넣으면 로그인할 수 있어요.
  </p>
  <template v-else>
    <p v-if="authStore.isLoggedIn && !authStore.isOwner" class="notice">
      {{ authStore.user?.email }} 계정은 이 화면에 접근할 수 없어요.
    </p>
    <form class="login-form" @submit.prevent="login">
      <label>
        이메일
        <input v-model="email" type="email" autocomplete="username" />
      </label>
      <label>
        비밀번호
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>
      <button class="primary" type="submit" :disabled="busy">로그인</button>
      <p v-if="error" class="error">
        {{ error }}
        <small v-if="errorCode" class="muted">오류 코드: {{ errorCode }}</small>
      </p>
    </form>
    <p class="muted">웨딩플래너에서 쓰던 계정으로 로그인하세요.</p>
    <p class="muted small">Firebase 프로젝트: {{ projectId }}</p>
  </template>
</template>

<style scoped>
.login-form { display: flex; flex-direction: column; gap: 12px; max-width: 320px; }
.login-form label { display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem; color: var(--muted); }
.error { color: var(--expense); margin: 0; display: flex; flex-direction: column; gap: 2px; }
.small { font-size: 0.8rem; }
</style>
