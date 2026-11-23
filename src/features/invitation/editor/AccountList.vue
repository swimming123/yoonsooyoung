<script setup lang="ts">
import { newId, type Account } from '../types'

const props = defineProps<{ side: '신랑' | '신부' }>()
const list = defineModel<Account[]>({ required: true })
const owners = [props.side, `${props.side} 아버님`, `${props.side} 어머님`]

function add() {
  const used = new Set(list.value.map((a) => a.owner))
  list.value.push({ id: newId(), owner: owners.find((o) => !used.has(o)) ?? props.side, bank: '', number: '', holder: '' })
}
function remove(id: string) {
  list.value = list.value.filter((a) => a.id !== id)
}
</script>

<template>
  <div class="accounts">
    <div v-for="a in list" :key="a.id" class="acc">
      <select v-model="a.owner" aria-label="계좌 주인">
        <option v-for="o in owners" :key="o" :value="o">{{ o }}</option>
      </select>
      <input v-model.trim="a.holder" placeholder="예금주" aria-label="예금주" />
      <input v-model.trim="a.bank" placeholder="은행" aria-label="은행" />
      <input v-model.trim="a.number" placeholder="계좌번호" inputmode="numeric" aria-label="계좌번호" />
      <button type="button" class="del" aria-label="이 계좌 삭제" @click="remove(a.id)">✕</button>
    </div>
    <button v-if="list.length < 3" type="button" class="add" @click="add">+ {{ side }}측 계좌 추가</button>
  </div>
</template>

<style scoped>
.accounts { display: flex; flex-direction: column; gap: 8px; }
.acc {
  display: grid; grid-template-columns: 1.1fr 1fr 1fr auto; gap: 6px;
  padding-bottom: 8px; border-bottom: 1px solid var(--ed-line);
}
.acc input[aria-label='계좌번호'] { grid-column: 1 / 4; grid-row: 2; }
.del { border: 0; background: none; color: var(--ed-sub); padding: 0 6px; }
.add { border: 1px dashed var(--ed-line); background: none; color: var(--ed-sub); min-height: 40px; }
@media (max-width: 640px) {
  .acc { grid-template-columns: 1fr 1fr auto; }
  .acc input[aria-label='은행'] { grid-column: 1 / 3; grid-row: 2; }
  .acc input[aria-label='계좌번호'] { grid-column: 1 / 3; grid-row: 3; }
}
</style>
