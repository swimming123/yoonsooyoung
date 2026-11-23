<script setup lang="ts">
import { useId } from 'vue'
import { RELATIONS, type Person } from '../types'

const props = defineProps<{ who: '신랑' | '신부' }>()
const person = defineModel<Person>({ required: true })
const id = useId()
const relations = props.who === '신랑' ? RELATIONS.slice(0, 5) : RELATIONS.slice(5)
</script>

<template>
  <div class="group" :aria-label="who">
    <div class="line three">
      <label :for="`${id}-name`">{{ who }}</label>
      <input :id="`${id}-name`" v-model.trim="person.name" placeholder="성함" />
      <select v-model="person.relation" :aria-label="`${who} 부모님과의 관계`">
        <option v-for="r in relations" :key="r" :value="r">{{ r }}</option>
      </select>
    </div>
    <div class="line">
      <label :for="`${id}-tel`">연락처</label>
      <input :id="`${id}-tel`" v-model.trim="person.contact" type="tel" inputmode="tel" placeholder="예: 01012345678" />
    </div>
  </div>
  <div v-for="[key, label] in ([['father', '아버님'], ['mother', '어머님']] as const)" :key="key" class="group">
    <div class="line three">
      <label :for="`${id}-${key}`">{{ label }}</label>
      <input :id="`${id}-${key}`" v-model.trim="person[key].name" placeholder="성함" />
      <label class="check">
        <input v-model="person[key].deceased" type="checkbox" :aria-label="`${who} ${label} 고인(故)`" />
        故
      </label>
    </div>
    <div class="line">
      <label :for="`${id}-${key}-tel`">연락처</label>
      <input
        :id="`${id}-${key}-tel`"
        v-model.trim="person[key].contact"
        type="tel"
        inputmode="tel"
        placeholder="예: 01012345678"
        :disabled="person[key].deceased"
      />
    </div>
  </div>
  <p class="note">표시하고 싶은 항목만 채워 주세요. 비워 둔 항목은 청첩장에 나오지 않아요.</p>
</template>

<style scoped>
.group { display: flex; flex-direction: column; gap: 8px; }
.line { display: grid; grid-template-columns: 1fr 3fr; gap: 8px 16px; align-items: center; }
.line.three { grid-template-columns: 1fr 2fr 1fr; }
.line > label:first-child { font-size: 0.9rem; font-weight: 600; }
.check { display: inline-flex; align-items: center; gap: 6px; font-size: 0.95rem; color: var(--ed-sub); min-height: 44px; }
.check input { width: 18px; height: 18px; accent-color: var(--ed-brand); }
.note { margin: 0; padding: 12px 14px; border-radius: 10px; background: var(--ed-soft); color: var(--ed-sub); font-size: 0.82rem; }
@media (max-width: 640px) {
  .line, .line.three { grid-template-columns: 64px 1fr auto; }
  .line:not(.three) { grid-template-columns: 64px 1fr; }
}
</style>
