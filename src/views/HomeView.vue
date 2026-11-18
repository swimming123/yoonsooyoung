<script setup lang="ts">
import { posts } from '@/features/blog/posts'

const recent = posts.slice(0, 5)
</script>

<template>
  <h1>안녕하세요</h1>
  <p class="muted">개발하며 배운 것과 생활 기록을 남기는 곳입니다.</p>

  <h2>최근 글</h2>
  <ul>
    <li v-for="p in recent" :key="p.slug">
      <RouterLink :to="{ name: 'post', params: { slug: p.slug } }">{{ p.title }}</RouterLink>
      <span class="muted"> · {{ p.date }}</span>
    </li>
  </ul>
  <p><RouterLink to="/blog">글 전체 보기 →</RouterLink></p>
</template>
