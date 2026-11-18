<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { allTags, posts } from './posts'

const route = useRoute()
const tag = computed(() => (typeof route.query.tag === 'string' ? route.query.tag : ''))
const visible = computed(() => (tag.value ? posts.filter((p) => p.tags.includes(tag.value)) : posts))
</script>

<template>
  <h1>블로그</h1>
  <p class="tags">
    <RouterLink :to="{ name: 'blog' }" :class="{ active: !tag }">전체</RouterLink>
    <RouterLink
      v-for="t in allTags"
      :key="t"
      :to="{ name: 'blog', query: { tag: t } }"
      :class="{ active: tag === t }"
      >#{{ t }}</RouterLink
    >
  </p>
  <ul class="post-list">
    <li v-for="p in visible" :key="p.slug">
      <RouterLink :to="{ name: 'post', params: { slug: p.slug } }" class="title">{{ p.title }}</RouterLink>
      <span class="muted"> · {{ p.date }}</span>
      <p v-if="p.summary" class="muted">{{ p.summary }}</p>
    </li>
  </ul>
  <p v-if="visible.length === 0" class="muted">아직 글이 없어요.</p>
</template>

<style scoped>
.tags { display: flex; flex-wrap: wrap; gap: 10px; }
.tags a { color: var(--muted); }
.tags a.active { color: var(--accent); font-weight: 600; }
.post-list { list-style: none; padding: 0; }
.post-list li { padding: 14px 0; border-bottom: 1px solid var(--line); }
.post-list .title { font-size: 1.1rem; font-weight: 600; color: var(--text); }
.post-list p { margin: 4px 0 0; }
</style>
