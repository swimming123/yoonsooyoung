<script setup lang="ts">
defineProps<{ label: string; for?: string; align?: 'center' | 'start' }>()
</script>

<template>
  <div class="row" :class="align === 'start' ? 'start' : ''">
    <label v-if="$props.for" class="label" :for="$props.for">{{ label }}</label>
    <span v-else class="label">{{ label }}</span>
    <div class="field"><slot /></div>
  </div>
</template>

<style scoped>
.row { display: grid; grid-template-columns: 1fr 3fr; gap: 8px 16px; align-items: center; }
.row.start { align-items: start; }
.row.start .label { padding-top: 9px; }
.label { font-size: 0.9rem; font-weight: 600; color: var(--ed-text); }
.field { min-width: 0; }
@media (max-width: 640px) {
  .row { grid-template-columns: 1fr; }
  .row.start .label { padding-top: 0; }
}
</style>
