<script setup lang="ts" generic="T extends string | number | boolean">
defineProps<{
  options: { value: T; label: string; badge?: string; preview?: string; previewStyle?: Record<string, string> }[]
  columns?: number
  label: string
}>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="choices" role="radiogroup" :aria-label="label" :style="{ '--cols': columns ?? 3 }">
    <button
      v-for="o in options"
      :key="String(o.value)"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      class="choice"
      :class="{ on: model === o.value }"
      @click="model = o.value"
    >
      <span class="top">
        {{ o.label }}
        <span v-if="o.badge" class="badge">{{ o.badge }}</span>
      </span>
      <span v-if="o.preview" class="preview" :style="o.previewStyle">{{ o.preview }}</span>
    </button>
  </div>
</template>

<style scoped>
.choices { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 8px; }
.choice {
  display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 8px; min-height: 44px;
  border: 1px solid var(--ed-line); border-radius: 8px; background: var(--ed-card); color: var(--ed-text); font-size: 0.88rem;
  transition: border-color 0.12s, background 0.12s;
}
.choice:hover { border-color: var(--ed-brand); }
.choice.on { border-color: var(--ed-brand); background: var(--ed-brand-soft); color: var(--ed-brand-strong); font-weight: 600; }
.top { display: inline-flex; align-items: center; gap: 4px; }
.badge { font-size: 0.62rem; padding: 0 6px; border-radius: 8px; background: var(--ed-brand); color: #fff; font-weight: 600; }
.preview { font-size: 0.95rem; font-weight: 400; color: var(--ed-text); }
@media (max-width: 640px) { .choices { grid-template-columns: repeat(min(var(--cols), 2), minmax(0, 1fr)); } }
</style>
