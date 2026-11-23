<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ title: string; required?: boolean; hint?: string }>()
const open = defineModel<boolean>('open', { default: false })
const id = useId()
</script>

<template>
  <div class="sec" :class="{ open }">
    <h3>
      <button type="button" :aria-expanded="open" :aria-controls="id" @click="open = !open">
        <span>
          {{ title }}
          <span v-if="required" class="req">필수</span>
        </span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </h3>
    <div v-show="open" :id="id" class="body">
      <p v-if="hint" class="hint">{{ hint }}</p>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.sec { background: var(--ed-card); border-radius: 10px; }
h3 { margin: 0; }
h3 button {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 18px 18px; border: 0; background: none; font-size: 1.02rem; font-weight: 700; color: var(--ed-text); border-radius: 10px;
}
h3 svg { transition: transform 0.2s; color: var(--ed-sub); }
.open h3 svg { transform: rotate(180deg); }
.req { margin-left: 6px; font-size: 0.7rem; font-weight: 600; color: var(--ed-brand); vertical-align: 2px; }
.body { padding: 4px 18px 24px; display: flex; flex-direction: column; gap: 22px; }
.hint { margin: 0; padding: 12px 14px; border-radius: 10px; background: var(--ed-soft); color: var(--ed-sub); font-size: 0.82rem; }
</style>
