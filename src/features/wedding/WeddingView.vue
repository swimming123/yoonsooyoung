<script setup lang="ts">
import { onMounted, ref } from 'vue'

// 1단계: 기존 웨딩플래너 HTML 을 public/wedding/ 에 그대로 두고 iframe 으로 보여줍니다.
// 같은 도메인이라 Firebase 로그인 상태가 공유됩니다.
// 2단계에서 이 화면을 Vue 컴포넌트로 옮기고 Firestore 접근은 repository 로 감쌉니다.
const src = `${import.meta.env.BASE_URL}wedding/index.html`
const status = ref<'checking' | 'ready' | 'missing'>('checking')

onMounted(async () => {
  try {
    const res = await fetch(src, { method: 'HEAD' })
    status.value = res.ok ? 'ready' : 'missing'
  } catch {
    status.value = 'missing'
  }
})
</script>

<template>
  <h1>웨딩플래너</h1>
  <iframe v-if="status === 'ready'" :src="src" title="웨딩플래너" class="planner" />
  <p v-else-if="status === 'missing'" class="notice">
    아직 웨딩플래너 파일이 없어요. 기존 HTML·JS·CSS 파일을 <code>public/wedding/</code> 폴더에 넣고
    시작 파일 이름을 <code>index.html</code> 로 맞춘 뒤 배포하세요.
  </p>
</template>

<style scoped>
.planner { width: 100%; height: 80vh; border: 1px solid var(--line); border-radius: 8px; }
</style>
