import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { monthRange } from './month'
import type { LedgerRepository } from './repository'
import type { Category, NewCategory, NewTransaction, Transaction } from './types'

// 컬렉션 이름은 나중에 테이블 이름과 맞추기 쉽게 접두사를 붙입니다.
const CATEGORIES = 'ledger_categories'
const TRANSACTIONS = 'ledger_transactions'

function currentUid(): string {
  const uid = auth().currentUser?.uid
  if (!uid) throw new Error('로그인이 필요합니다.')
  return uid
}

export const firestoreLedgerRepository: LedgerRepository = {
  async listCategories() {
    const snap = await getDocs(query(collection(db(), CATEGORIES), orderBy('order')))
    return snap.docs.map((d) => {
      const data = d.data()
      return { id: d.id, name: data.name, kind: data.kind, order: data.order } satisfies Category
    })
  },

  async createCategory(input: NewCategory) {
    const ref = await addDoc(collection(db(), CATEGORIES), {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: ref.id, ...input }
  },

  async listTransactions(month: string) {
    const { start, end } = monthRange(month)
    const snap = await getDocs(
      query(
        collection(db(), TRANSACTIONS),
        where('date', '>=', start),
        where('date', '<', end),
        orderBy('date', 'desc'),
      ),
    )
    return snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        date: data.date,
        kind: data.kind,
        amount: data.amount,
        categoryId: data.categoryId,
        memo: data.memo ?? '',
        createdBy: data.createdBy,
      } satisfies Transaction
    })
  },

  async createTransaction(input: NewTransaction) {
    const createdBy = currentUid()
    const ref = await addDoc(collection(db(), TRANSACTIONS), {
      ...input,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: ref.id, createdBy, ...input }
  },

  async updateTransaction(id, input) {
    await updateDoc(doc(db(), TRANSACTIONS, id), { ...input, updatedAt: serverTimestamp() })
  },

  async deleteTransaction(id) {
    await deleteDoc(doc(db(), TRANSACTIONS, id))
  },
}
