<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useLedgerRepository } from './useLedgerRepository'
import { DEFAULT_CATEGORIES } from './repository'
import { shiftMonth, today } from './month'
import { expenseByCategory, groupByDate, summarize, won } from './stats'
import type { Category, Transaction, TxKind } from './types'

const repo = useLedgerRepository()

const month = ref(today().slice(0, 7))
const categories = ref<Category[]>([])
const txs = ref<Transaction[]>([])
const loading = ref(false)
const error = ref('')

const form = reactive({
  date: today(),
  kind: 'expense' as TxKind,
  amount: '',
  categoryId: '',
  memo: '',
})

const categoryName = computed(() => new Map(categories.value.map((c) => [c.id, c.name])))
const formCategories = computed(() => categories.value.filter((c) => c.kind === form.kind))
const summary = computed(() => summarize(txs.value))
const byCategory = computed(() => expenseByCategory(txs.value, categories.value))
const groups = computed(() => groupByDate(txs.value))

async function run(task: () => Promise<void>) {
  error.value = ''
  loading.value = true
  try {
    await task()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  let list = await repo.listCategories()
  if (list.length === 0) {
    // 처음 쓰는 경우 기본 카테고리를 만듭니다.
    for (const c of DEFAULT_CATEGORIES) await repo.createCategory(c)
    list = await repo.listCategories()
  }
  categories.value = list
}

async function loadMonth() {
  txs.value = await repo.listTransactions(month.value)
}

onMounted(() =>
  run(async () => {
    await loadCategories()
    await loadMonth()
  }),
)
watch(month, () => run(loadMonth))

// 수입/지출을 바꾸면 그 종류의 첫 카테고리를 고릅니다.
watch(
  formCategories,
  (list) => {
    if (!list.some((c) => c.id === form.categoryId)) form.categoryId = list[0]?.id ?? ''
  },
  { immediate: true },
)

async function add() {
  const amount = Number(form.amount.replace(/[^\d]/g, ''))
  if (!amount || !form.categoryId) {
    error.value = '금액과 카테고리를 입력하세요.'
    return
  }
  await run(async () => {
    await repo.createTransaction({
      date: form.date,
      kind: form.kind,
      amount,
      categoryId: form.categoryId,
      memo: form.memo.trim(),
    })
    form.amount = ''
    form.memo = ''
    if (form.date.startsWith(month.value)) await loadMonth()
    else month.value = form.date.slice(0, 7)
  })
}

async function remove(t: Transaction) {
  if (!confirm(`${t.date} ${won(t.amount)} 내역을 지울까요?`)) return
  await run(async () => {
    await repo.deleteTransaction(t.id)
    await loadMonth()
  })
}
</script>

<template>
  <h1>가계부</h1>

  <div class="month-nav">
    <button @click="month = shiftMonth(month, -1)" aria-label="이전 달">‹</button>
    <strong>{{ month.replace('-', '년 ') }}월</strong>
    <button @click="month = shiftMonth(month, 1)" aria-label="다음 달">›</button>
  </div>

  <section class="summary">
    <div><span class="muted">수입</span><b class="income">{{ won(summary.income) }}</b></div>
    <div><span class="muted">지출</span><b class="expense">{{ won(summary.expense) }}</b></div>
    <div><span class="muted">합계</span><b>{{ won(summary.balance) }}</b></div>
  </section>

  <form class="quick-add" @submit.prevent="add">
    <div class="kind">
      <label><input type="radio" value="expense" v-model="form.kind" /> 지출</label>
      <label><input type="radio" value="income" v-model="form.kind" /> 수입</label>
    </div>
    <input type="date" v-model="form.date" required />
    <input v-model="form.amount" inputmode="numeric" placeholder="금액(원)" required />
    <select v-model="form.categoryId">
      <option v-for="c in formCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
    </select>
    <input v-model="form.memo" placeholder="메모" />
    <button class="primary" type="submit" :disabled="loading">추가</button>
  </form>

  <p v-if="error" class="notice">{{ error }}</p>

  <section v-if="byCategory.length" class="by-category">
    <h2>카테고리별 지출</h2>
    <div v-for="c in byCategory" :key="c.categoryId" class="bar-row">
      <span class="name">{{ c.name }}</span>
      <span class="bar"><span :style="{ width: `${Math.round(c.share * 100)}%` }" /></span>
      <span class="amount">{{ won(c.amount) }}</span>
    </div>
  </section>

  <section>
    <h2>내역</h2>
    <p v-if="!loading && groups.length === 0" class="muted">이 달의 내역이 없어요.</p>
    <div v-for="g in groups" :key="g.date" class="day">
      <div class="day-label muted">{{ g.date }}</div>
      <div v-for="t in g.items" :key="t.id" class="tx">
        <span class="cat">{{ categoryName.get(t.categoryId) ?? '미분류' }}</span>
        <span class="memo muted">{{ t.memo }}</span>
        <span :class="t.kind">{{ t.kind === 'income' ? '+' : '-' }}{{ won(t.amount) }}</span>
        <button class="link" @click="remove(t)" aria-label="삭제">삭제</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.month-nav { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.summary div { border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; }
.income { color: var(--income); }
.expense { color: var(--expense); }
.quick-add { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
.quick-add .kind { display: flex; gap: 10px; }
.quick-add input[inputmode] { width: 130px; }
.bar-row { display: grid; grid-template-columns: 90px 1fr 110px; gap: 10px; align-items: center; margin: 6px 0; }
.bar { background: var(--bg-soft); border-radius: 4px; height: 10px; overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--accent); }
.amount { text-align: right; }
.day { margin: 12px 0; }
.day-label { font-size: 0.9rem; border-bottom: 1px solid var(--line); padding-bottom: 4px; }
.tx { display: grid; grid-template-columns: 90px 1fr auto auto; gap: 12px; padding: 6px 0; align-items: center; }
@media (max-width: 560px) {
  .summary { grid-template-columns: 1fr; }
  .tx { grid-template-columns: 70px 1fr auto auto; }
}
</style>
