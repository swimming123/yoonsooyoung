import { firebaseConfigured, firebaseOptions } from '@/lib/firebaseConfig'
import { cardFromLegacy, legacyFieldsFromCard, type LegacyDraft } from './legacy'
import { type InvitationCard, type InvitationPhoto, newId, normalizeCard } from './types'

// 기존 웨딩플래너와 같은 데이터를 씁니다.
//  - app/invitation 문서: { activeId, drafts: { [시안 id]: { name, order, groomName, …, blocks, card } } }
//  - invitationPhotos 컬렉션: { id, inviteId(=시안 id), order, image, role? }
// 새 편집 화면은 각 시안의 `card` 필드에 디자인을 저장하고, 이름·일시·장소 같은 기본 필드도 같이 맞춥니다.

export interface DraftSummary {
  id: string
  name: string
  order: number
  /** 새 편집 화면으로 꾸민 시안인지 */
  hasCard: boolean
}

export interface InvitationState {
  activeId: string
  drafts: DraftSummary[]
}

export interface InvitationRepository {
  /** 시안 목록과 대표 시안을 지켜봅니다. */
  watchState(cb: (state: InvitationState) => void, onError?: (e: Error) => void): () => void
  loadCard(draftId: string): Promise<InvitationCard>
  saveCard(draftId: string, card: InvitationCard): Promise<void>
  createDraft(name: string, card: InvitationCard): Promise<string>
  setActive(draftId: string): Promise<void>
  watchPhotos(draftId: string, cb: (photos: InvitationPhoto[]) => void): () => void
  savePhoto(photo: InvitationPhoto): Promise<void>
  deletePhoto(id: string): Promise<void>
}

type InvitationDoc = { activeId?: string; drafts?: Record<string, LegacyDraft> } & LegacyDraft

/** 문서에서 시안 목록을 뽑습니다. 시안이 없는 구버전(평면) 문서는 'main' 시안 하나로 봅니다. */
export function draftsOf(data: InvitationDoc | undefined): { activeId: string; drafts: Record<string, LegacyDraft> } {
  const raw = data?.drafts && Object.keys(data.drafts).length ? data.drafts : { main: { ...(data ?? {}), name: '메인 시안', order: 0 } }
  const ids = Object.keys(raw).sort((a, b) => (raw[a]!.order ?? 0) - (raw[b]!.order ?? 0))
  const activeId = data?.activeId && raw[data.activeId] ? data.activeId : ids[0]!
  return { activeId, drafts: raw }
}

function summaries(drafts: Record<string, LegacyDraft>): DraftSummary[] {
  return Object.entries(drafts)
    .map(([id, d]) => ({ id, name: d.name || '시안', order: d.order ?? 0, hasCard: !!d.card }))
    .sort((a, b) => a.order - b.order)
}

function photoSort(list: InvitationPhoto[]) {
  return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

// ───── Firestore ─────
async function firestoreRepository(): Promise<InvitationRepository> {
  const [{ db }, fs] = await Promise.all([import('@/lib/firebase'), import('firebase/firestore')])
  const invitationRef = fs.doc(db(), 'app', 'invitation')
  const photos = fs.collection(db(), 'invitationPhotos')
  const read = async () => {
    const snap = await fs.getDoc(invitationRef)
    return (snap.exists() ? snap.data() : undefined) as InvitationDoc | undefined
  }

  return {
    watchState(cb, onError) {
      return fs.onSnapshot(
        invitationRef,
        (snap) => {
          const { activeId, drafts } = draftsOf(snap.exists() ? (snap.data() as InvitationDoc) : undefined)
          cb({ activeId, drafts: summaries(drafts) })
        },
        (e) => onError?.(e),
      )
    },
    async loadCard(draftId) {
      const data = await read()
      const d = draftsOf(data).drafts[draftId]
      return d?.card ? normalizeCard(d.card) : cardFromLegacy(d ?? {})
    },
    async saveCard(draftId, card) {
      const data = await read()
      const hasDrafts = !!(data?.drafts && Object.keys(data.drafts).length)
      const fields = { ...legacyFieldsFromCard(card), card }
      if (hasDrafts) {
        // merge: 이름·순서·블록 등 기존 웨딩플래너가 쓰는 필드는 그대로 둡니다.
        await fs.setDoc(invitationRef, { drafts: { [draftId]: fields } }, { merge: true })
      } else {
        // 구버전 문서였다면 기존 웨딩플래너와 같은 방식으로 'main' 시안을 만들어 옮깁니다.
        await fs.setDoc(
          invitationRef,
          { activeId: 'main', drafts: { main: { id: 'main', name: '메인 시안', order: 0, ...fields } } },
          { merge: true },
        )
      }
    },
    async createDraft(name, card) {
      const data = await read()
      const { drafts } = draftsOf(data)
      const order = Math.max(-1, ...Object.values(drafts).map((d) => d.order ?? 0)) + 1
      const id = newId()
      await fs.setDoc(
        invitationRef,
        { drafts: { [id]: { id, name, order, blocks: [], ...legacyFieldsFromCard(card), card } } },
        { merge: true },
      )
      return id
    },
    async setActive(draftId) {
      await fs.setDoc(invitationRef, { activeId: draftId }, { merge: true })
    },
    watchPhotos(draftId, cb) {
      // 기존 웨딩플래너는 inviteId 가 없는 사진을 'main' 시안 것으로 봅니다.
      const q = draftId === 'main' ? photos : fs.query(photos, fs.where('inviteId', '==', draftId))
      return fs.onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => d.data() as InvitationPhoto)
        cb(photoSort(list.filter((p) => (p.inviteId || 'main') === draftId)))
      })
    },
    async savePhoto(photo) {
      await fs.setDoc(fs.doc(photos, photo.id), photo)
    },
    async deletePhoto(id) {
      await fs.deleteDoc(fs.doc(photos, id))
    },
  }
}

// ───── Firebase 설정이 없을 때(로컬 개발): 브라우저 저장소 ─────
const LOCAL_DOC = 'yoonsooyoung:invitation-doc'
const LOCAL_PHOTOS = 'yoonsooyoung:invitation-photos'

function localRepository(): InvitationRepository {
  let memDoc: InvitationDoc = {}
  let memPhotos: InvitationPhoto[] = []
  const stateListeners = new Set<() => void>()
  const photoListeners = new Set<() => void>()
  const get = <T>(key: string, fallback: T): T => {
    try {
      return (JSON.parse(localStorage.getItem(key) || 'null') as T) ?? fallback
    } catch {
      return fallback
    }
  }
  const put = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 용량 초과 등: 이번 세션에만 보관
    }
  }
  const readDoc = () => get<InvitationDoc>(LOCAL_DOC, memDoc)
  const writeDoc = (d: InvitationDoc) => {
    memDoc = d
    put(LOCAL_DOC, d)
    stateListeners.forEach((l) => l())
  }
  const readPhotos = () => get<InvitationPhoto[]>(LOCAL_PHOTOS, memPhotos)
  const writePhotos = (list: InvitationPhoto[]) => {
    memPhotos = list
    put(LOCAL_PHOTOS, list)
    photoListeners.forEach((l) => l())
  }
  const ensureDrafts = () => {
    const doc = readDoc()
    const { activeId, drafts } = draftsOf(doc)
    return { ...doc, activeId, drafts }
  }
  return {
    watchState(cb) {
      const emit = () => {
        const { activeId, drafts } = draftsOf(readDoc())
        cb({ activeId, drafts: summaries(drafts) })
      }
      stateListeners.add(emit)
      emit()
      return () => stateListeners.delete(emit)
    },
    async loadCard(draftId) {
      const d = draftsOf(readDoc()).drafts[draftId]
      return d?.card ? normalizeCard(d.card) : cardFromLegacy(d ?? {})
    },
    async saveCard(draftId, card) {
      const doc = ensureDrafts()
      doc.drafts[draftId] = { ...doc.drafts[draftId], ...legacyFieldsFromCard(card), card }
      writeDoc(doc)
    },
    async createDraft(name, card) {
      const doc = ensureDrafts()
      const id = newId()
      const order = Math.max(-1, ...Object.values(doc.drafts).map((d) => d.order ?? 0)) + 1
      doc.drafts[id] = { name, order, ...legacyFieldsFromCard(card), card }
      writeDoc(doc)
      return id
    },
    async setActive(draftId) {
      writeDoc({ ...ensureDrafts(), activeId: draftId })
    },
    watchPhotos(draftId, cb) {
      const emit = () => cb(photoSort(readPhotos().filter((p) => (p.inviteId || 'main') === draftId)))
      photoListeners.add(emit)
      emit()
      return () => photoListeners.delete(emit)
    },
    async savePhoto(photo) {
      writePhotos([...readPhotos().filter((p) => p.id !== photo.id), photo])
    },
    async deletePhoto(id) {
      writePhotos(readPhotos().filter((p) => p.id !== id))
    },
  }
}

let repo: Promise<InvitationRepository> | undefined
export function invitationRepository(): Promise<InvitationRepository> {
  repo ??= firebaseConfigured ? firestoreRepository() : Promise.resolve(localRepository())
  return repo
}

/** 권한 오류일 때 어느 Firebase 프로젝트에 붙었는지 같이 보여 줘서 설정 실수를 바로 알 수 있게 합니다. */
export function describeError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e)
  const code = (e as { code?: string })?.code
  if (code === 'permission-denied' || /insufficient permissions/i.test(message)) {
    return `권한이 없어요. 이 사이트가 연결된 Firebase 프로젝트: ${firebaseOptions.projectId || '(없음)'} — 웨딩플래너는 wedding-log-ab8be 를 써요.`
  }
  return message
}

/**
 * 사진을 줄여서 data URL 로 만듭니다.
 * Firestore 문서 하나는 1MB 까지라 base64 결과가 예산을 넘지 않도록 품질을 낮춰 가며 맞춥니다.
 */
export async function compressImage(file: File, maxSide = 1440, budgetKb = 700): Promise<{ url: string; kb: number }> {
  const bitmap = await createImageBitmap(file)
  let scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  let quality = 0.86
  for (let attempt = 0; attempt < 8; attempt++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL('image/jpeg', quality)
    const kb = Math.round((url.length * 3) / 4 / 1024)
    if (kb <= budgetKb) return { url, kb }
    if (quality > 0.6) quality -= 0.1
    else scale *= 0.85
  }
  throw new Error('사진을 충분히 줄이지 못했어요. 더 작은 사진을 올려 주세요.')
}

export function newPhoto(draftId: string, role: InvitationPhoto['role'], order: number, image: string, kb: number): InvitationPhoto {
  return { id: newId(), inviteId: draftId, role, order, image, kb }
}
