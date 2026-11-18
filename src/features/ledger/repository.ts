import type { Category, NewCategory, NewTransaction, Transaction } from './types'

/**
 * 화면은 이 인터페이스만 사용합니다.
 * 지금은 firestoreRepository 가 구현하고, 백엔드로 옮기면 apiRepository 를 만들어
 * useLedgerRepository() 가 돌려주는 구현만 바꾸면 됩니다.
 */
export interface LedgerRepository {
  listCategories(): Promise<Category[]>
  createCategory(input: NewCategory): Promise<Category>
  /** month: YYYY-MM */
  listTransactions(month: string): Promise<Transaction[]>
  createTransaction(input: NewTransaction): Promise<Transaction>
  updateTransaction(id: string, input: Partial<NewTransaction>): Promise<void>
  deleteTransaction(id: string): Promise<void>
}

export const DEFAULT_CATEGORIES: NewCategory[] = [
  { name: '식비', kind: 'expense', order: 1 },
  { name: '교통', kind: 'expense', order: 2 },
  { name: '주거·통신', kind: 'expense', order: 3 },
  { name: '생활용품', kind: 'expense', order: 4 },
  { name: '여가', kind: 'expense', order: 5 },
  { name: '기타 지출', kind: 'expense', order: 9 },
  { name: '급여', kind: 'income', order: 1 },
  { name: '기타 수입', kind: 'income', order: 9 },
]
