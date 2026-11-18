<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { findPost, renderMarkdown } from './posts'

const props = defineProps<{ slug: string }>()
const post = computed(() => findPost(props.slug))
const html = computed(() => (post.value ? renderMarkdown(post.value.body) : ''))

watchEffect(() => {
  if (post.value) document.title = `${post.value.title} · yoonsooyoung`
})
</script>

<template>
  <article v-if="post">
    <h1>{{ post.title }}</h1>
    <p class="muted">
      {{ post.date }}
      <template v-for="t in post.tags" :key="t">
        · <RouterLink :to="{ name: 'blog', query: { tag: t } }">#{{ t }}</RouterLink>
      </template>
    </p>
    <!-- markdown-it 을 html:false 로 써서 글 안의 HTML 은 실행되지 않습니다. -->
    <div class="prose" v-html="html" />
    <p><RouterLink :to="{ name: 'blog' }">← 목록으로</RouterLink></p>
  </article>
  <template v-else>
    <h1>글을 찾을 수 없어요</h1>
    <p><RouterLink :to="{ name: 'blog' }">목록으로</RouterLink></p>
  </template>
</template>

<style scoped>
.prose :deep(pre) { background: var(--bg-soft); padding: 12px 16px; border-radius: 8px; overflow-x: auto; }
.prose :deep(code) { font-size: 0.92em; }
.prose :deep(img) { max-width: 100%; }
.prose :deep(blockquote) { margin: 0; padding-left: 16px; border-left: 3px solid var(--line); color: var(--muted); }
</style>
