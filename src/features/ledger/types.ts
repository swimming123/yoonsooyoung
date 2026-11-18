// 가계부 데이터 모양. 나중에 Django/FastAPI 로 옮길 때 테이블과 1:1 로 대응하도록
// 평평한 구조 + ID 참조로 둡니다.

export type TxKind = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  kind: TxKind
  order: number
}

export interface Transaction {
  id: string
  /** YYYY-MM-DD */
  date: string
  kind: TxKind
  /** 원 단위 정수 */
  amount: number
  categoryId: string
  memo: string
  createdBy: string
}

export type NewTransaction = Omit<Transaction, 'id' | 'createdBy'>
export type NewCategory = Omit<Category, 'id'>
