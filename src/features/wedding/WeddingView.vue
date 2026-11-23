<script setup lang="ts">
import { RouterLink } from 'vue-router'
// 1단계: 기존 웨딩플래너(public/wedding/*.html)를 그대로 iframe 으로 보여줍니다.
// 배포할 때 postbuild 가 이 페이지들의 Firebase 설정을 사이트와 같은 프로젝트로 바꿔 넣어서
// 데이터와 로그인 상태가 사이트와 그대로 이어집니다. (기존 프로젝트 데이터는 /wedding/migrate 로 옮김)
// 2단계에서 이 화면을 Vue 컴포넌트로 옮기고 Firestore 접근은 repository 로 감쌉니다.
const base = `${import.meta.env.BASE_URL}wedding/`
const editor = `${base}index.html`
const timeline = `${base}timeline.html`
const invite = `${base}invite.html`
</script>

<template>
  <div class="head">
    <h1>웨딩플래너</h1>
    <nav class="links">
      <a :href="editor" target="_blank" rel="noopener">새 창에서 열기 ↗</a>
      <a :href="timeline" target="_blank" rel="noopener">공개 타임라인 ↗</a>
      <RouterLink :to="{ name: 'invitation-editor' }">청첩장 꾸미기</RouterLink>
      <RouterLink :to="{ name: 'wedding-migrate' }">데이터 옮기기</RouterLink>
      <a :href="invite" target="_blank" rel="noopener">기존 모바일 청첩장 ↗</a>
    </nav>
  </div>
  <iframe :src="editor" title="웨딩플래너" class="planner" />
</template>

<style scoped>
.head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.head h1 { margin: 0 0 12px; }
.links { display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.9rem; }
.planner { width: 100%; height: calc(100vh - 170px); min-height: 520px; border: 1px solid var(--line); border-radius: 8px; }
</style>
