<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { hadLogin, useAuthStore } from '@/stores/auth'
import { firebaseConfigured } from '@/lib/firebaseConfig'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  // 로그인한 적 있는 브라우저에서만 Firebase 를 불러옵니다.
  if (hadLogin()) void authStore.init()
})

async function logout() {
  await authStore.logout()
  await router.push({ name: 'home' })
}
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="brand">yoonsooyoung</RouterLink>
    <nav>
      <RouterLink to="/blog">블로그</RouterLink>
      <template v-if="authStore.isOwner">
        <RouterLink to="/ledger">가계부</RouterLink>
        <RouterLink to="/wedding">웨딩플래너</RouterLink>
      </template>
    </nav>
    <div class="auth">
      <button v-if="authStore.isLoggedIn" class="link" @click="logout">로그아웃</button>
      <RouterLink v-else-if="firebaseConfigured" to="/login">로그인</RouterLink>
    </div>
  </header>
  <main class="container" :class="{ wide: route.meta.wide }">
    <RouterView />
  </main>
</template>
