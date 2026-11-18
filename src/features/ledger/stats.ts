// 통계 계산은 순수 함수로만 둡니다. 나중에 서버로 옮길 때 이 파일만 Python 으로 옮기면 됩니다.
import type { Category, Transaction } from './types'

export interface MonthSummary {
  income: number
  expense: number
  balance: number
}

export function summarize(txs: Transaction[]): MonthSummary {
  let income = 0
  let expense = 0
  for (const t of txs) {
    if (t.kind === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense, balance: income - expense }
}

export interface CategoryTotal {
  categoryId: string
  name: string
  amount: number
  /** 전체 지출 중 비율 0–1 */
  share: number
}

/** 지출만 카테고리별로 합산해 큰 순서로 */
export function expenseByCategory(txs: Transaction[], categories: Category[]): CategoryTotal[] {
  const names = new Map(categories.map((c) => [c.id, c.name]))
  const totals = new Map<string, number>()
  for (const t of txs) {
    if (t.kind !== 'expense') continue
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount)
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0)
  return [...totals.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      name: names.get(categoryId) ?? '미분류',
      amount,
      share: sum === 0 ? 0 : amount / sum,
    }))
    .sort((a, b) => b.amount - a.amount)
}

/** 날짜별로 묶기(최신 날짜 먼저) */
export function groupByDate(txs: Transaction[]): { date: string; items: Transaction[] }[] {
  const groups = new Map<string, Transaction[]>()
  for (const t of [...txs].sort((a, b) => b.date.localeCompare(a.date))) {
    const list = groups.get(t.date) ?? []
    list.push(t)
    groups.set(t.date, list)
  }
  return [...groups.entries()].map(([date, items]) => ({ date, items }))
}

export const won = (n: number): string => `${n.toLocaleString('ko-KR')}원`
