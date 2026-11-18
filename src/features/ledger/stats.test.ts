import { describe, expect, it } from 'vitest'
import { expenseByCategory, groupByDate, summarize } from './stats'
import { monthRange, shiftMonth } from './month'
import type { Category, Transaction } from './types'

const tx = (p: Partial<Transaction>): Transaction => ({
  id: 'x',
  date: '2026-11-01',
  kind: 'expense',
  amount: 0,
  categoryId: 'food',
  memo: '',
  createdBy: 'u',
  ...p,
})

const cats: Category[] = [
  { id: 'food', name: '식비', kind: 'expense', order: 1 },
  { id: 'bus', name: '교통', kind: 'expense', order: 2 },
]

describe('stats', () => {
  it('수입·지출·합계를 계산한다', () => {
    const s = summarize([
      tx({ kind: 'income', amount: 3_000_000 }),
      tx({ amount: 12_000 }),
      tx({ amount: 8_000 }),
    ])
    expect(s).toEqual({ income: 3_000_000, expense: 20_000, balance: 2_980_000 })
  })

  it('지출만 카테고리별로 합치고 큰 순서로 정렬한다', () => {
    const r = expenseByCategory(
      [
        tx({ categoryId: 'bus', amount: 1_000 }),
        tx({ categoryId: 'food', amount: 3_000 }),
        tx({ kind: 'income', categoryId: 'food', amount: 99_999 }),
      ],
      cats,
    )
    expect(r.map((c) => [c.name, c.amount, c.share])).toEqual([
      ['식비', 3_000, 0.75],
      ['교통', 1_000, 0.25],
    ])
  })

  it('날짜별로 최신순 묶음을 만든다', () => {
    const g = groupByDate([tx({ id: 'a', date: '2026-11-01' }), tx({ id: 'b', date: '2026-11-03' })])
    expect(g.map((d) => d.date)).toEqual(['2026-11-03', '2026-11-01'])
  })
})

describe('month', () => {
  it('12월의 다음 달은 다음 해 1월', () => {
    expect(monthRange('2026-12')).toEqual({ start: '2026-12-01', end: '2027-01-01' })
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-11', 2)).toBe('2027-01')
  })
})
