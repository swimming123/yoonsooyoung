import { firebaseConfigured } from '@/lib/firebaseConfig'
import { CARD_INVITE_ID, type InvitationCard, type InvitationPhoto, newId, normalizeCard } from './types'

export interface InvitationRepository {
  loadCard(): Promise<InvitationCard>
  saveCard(card: InvitationCard): Promise<void>
  /** 사진 목록을 지켜봅니다. 반환값을 부르면 그만 봅니다. */
  watchPhotos(cb: (photos: InvitationPhoto[]) => void): () => void
  savePhoto(photo: InvitationPhoto): Promise<void>
  deletePhoto(id: string): Promise<void>
}

// ───── Firestore ─────
// 문서 위치는 기존 웨딩플래너와 같습니다. app/invitation 은 누구나 읽을 수 있고 주인만 쓸 수 있어요.
async function firestoreRepository(): Promise<InvitationRepository> {
  const [{ db }, fs] = await Promise.all([import('@/lib/firebase'), import('firebase/firestore')])
  const invitationRef = fs.doc(db(), 'app', 'invitation')
  const photos = fs.collection(db(), 'invitationPhotos')

  return {
    async loadCard() {
      const snap = await fs.getDoc(invitationRef)
      return normalizeCard(snap.exists() ? snap.get('card') : undefined)
    },
    async saveCard(card) {
      // merge 라서 기존 웨딩플래너의 drafts·activeId 는 그대로 남습니다.
      await fs.setDoc(invitationRef, { card, cardUpdatedAt: fs.serverTimestamp() }, { merge: true })
    },
    watchPhotos(cb) {
      const q = fs.query(photos, fs.where('inviteId', '==', CARD_INVITE_ID))
      return fs.onSnapshot(q, (snap) => {
        cb(snap.docs.map((d) => d.data() as InvitationPhoto).sort((a, b) => a.order - b.order))
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
const LOCAL_KEY = 'yoonsooyoung:invitation-card'
const LOCAL_PHOTOS = 'yoonsooyoung:invitation-photos'

function localRepository(): InvitationRepository {
  const listeners = new Set<(p: InvitationPhoto[]) => void>()
  let memoryPhotos: InvitationPhoto[] = []
  const read = (): InvitationPhoto[] => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_PHOTOS) || '[]') as InvitationPhoto[]
    } catch {
      return memoryPhotos
    }
  }
  const write = (list: InvitationPhoto[]) => {
    memoryPhotos = list
    try {
      localStorage.setItem(LOCAL_PHOTOS, JSON.stringify(list))
    } catch {
      // 용량이 넘치면 이번 세션에만 보관
    }
    const sorted = [...list].sort((a, b) => a.order - b.order)
    listeners.forEach((l) => l(sorted))
  }
  return {
    async loadCard() {
      try {
        return normalizeCard(JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'))
      } catch {
        return normalizeCard(undefined)
      }
    },
    async saveCard(card) {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(card))
      } catch {
        // 저장소를 못 쓰는 환경
      }
    },
    watchPhotos(cb) {
      listeners.add(cb)
      cb([...read()].sort((a, b) => a.order - b.order))
      return () => listeners.delete(cb)
    },
    async savePhoto(photo) {
      write([...read().filter((p) => p.id !== photo.id), photo])
    },
    async deletePhoto(id) {
      write(read().filter((p) => p.id !== id))
    },
  }
}

let repo: Promise<InvitationRepository> | undefined
export function invitationRepository(): Promise<InvitationRepository> {
  repo ??= firebaseConfigured ? firestoreRepository() : Promise.resolve(localRepository())
  return repo
}

/**
 * 사진을 줄여서 data URL 로 만듭니다.
 * Firestore 문서 하나는 1MB 까지라 base64 결과가 ~700KB 를 넘지 않도록 품질을 낮춰 가며 맞춥니다.
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

export function newPhoto(role: InvitationPhoto['role'], order: number, image: string, kb: number): InvitationPhoto {
  return { id: newId(), inviteId: CARD_INVITE_ID, role, order, image, kb }
}
