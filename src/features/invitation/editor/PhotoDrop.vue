<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ label: string; multiple?: boolean; busy?: boolean }>()
const emit = defineEmits<{ files: [File[]] }>()
const input = ref<HTMLInputElement>()
const over = ref(false)

function pick(list: FileList | null | undefined) {
  const files = [...(list ?? [])].filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type))
  if (files.length) emit('files', props.multiple ? files : files.slice(0, 1))
  if (input.value) input.value.value = ''
}
</script>

<template>
  <div
    class="drop"
    :class="{ over, busy }"
    role="button"
    tabindex="0"
    :aria-label="label"
    @click="input?.click()"
    @keydown.enter.prevent="input?.click()"
    @keydown.space.prevent="input?.click()"
    @dragover.prevent="over = true"
    @dragleave="over = false"
    @drop.prevent="(over = false), pick($event.dataTransfer?.files)"
  >
    <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" :multiple="multiple" hidden @change="pick(($event.target as HTMLInputElement).files)" />
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <rect x="3.5" y="3" width="18" height="18" rx="4" /><circle cx="16.5" cy="8" r="2" /><path d="m3.5 15 4-4 5 5 3-3 6 5" />
    </svg>
    <p class="t">{{ busy ? '사진을 줄이는 중…' : label }}</p>
    <p class="s">JPG, PNG, WebP · 끌어다 놓아도 돼요</p>
  </div>
</template>

<style scoped>
.drop {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 130px; padding: 20px;
  border: 1.5px dashed var(--ed-line); border-radius: 10px; color: var(--ed-sub); cursor: pointer; text-align: center;
}
.drop:hover, .drop.over, .drop:focus-visible { border-color: var(--ed-brand); color: var(--ed-brand-strong); outline: none; }
.drop.busy { opacity: 0.6; pointer-events: none; }
.t { margin: 4px 0 0; font-size: 0.88rem; font-weight: 600; }
.s { margin: 0; font-size: 0.75rem; }
</style>
