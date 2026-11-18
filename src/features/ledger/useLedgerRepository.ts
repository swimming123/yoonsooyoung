import { firestoreLedgerRepository } from './firestoreRepository'
import type { LedgerRepository } from './repository'

/** 백엔드로 옮길 때 여기서 반환하는 구현만 바꾸면 됩니다. */
export function useLedgerRepository(): LedgerRepository {
  return firestoreLedgerRepository
}
