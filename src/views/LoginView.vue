<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { firebaseConfigured } from '@/lib/firebaseConfig'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const error = ref('')

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
  try {
    await authStore.login()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
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
    <button class="primary" @click="login">Google 계정으로 로그인</button>
    <p v-if="error" class="muted">{{ error }}</p>
  </template>
</template>
