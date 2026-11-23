import { defaultCard, normalizeCard, type InvitationCard } from './types'

/** 기존 웨딩플래너 시안 한 개의 모양 (필요한 필드만) */
export interface LegacyDraft {
  id?: string
  name?: string
  order?: number
  groomName?: string
  brideName?: string
  /** datetime-local 값: 2026-11-23T12:00 */
  weddingDateTime?: string
  venueName?: string
  venueAddress?: string
  mapQuery?: string
  phrase?: string
  blocks?: { type: string; text?: string }[]
  card?: unknown
}

/** 새 편집 화면으로 아직 꾸미지 않은 시안을 기본값 + 기존 필드로 채워서 엽니다. */
export function cardFromLegacy(d: LegacyDraft, today = new Date()): InvitationCard {
  const card = normalizeCard(undefined, today)
  if (d.groomName) {
    card.groom.name = d.groomName
    card.main.textLeft = d.groomName
  }
  if (d.brideName) {
    card.bride.name = d.brideName
    card.main.textRight = d.brideName
  }
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/.exec(d.weddingDateTime ?? '')
  if (m) {
    card.wedding.date = m[1]!
    if (m[2]) {
      card.wedding.hour = Number(m[2])
      card.wedding.minute = Number(m[3])
    }
  }
  card.wedding.venueName = d.venueName ?? ''
  card.wedding.venueAddress = d.venueAddress ?? ''
  card.wedding.mapQuery = d.mapQuery ?? ''
  const text = d.blocks?.find((b) => b.type === 'text' && b.text?.trim())?.text ?? d.phrase
  if (text?.trim()) card.greeting.body = text.trim()
  return card
}

/** 저장할 때 기존 화면(웨딩플래너 청첩장 관리, invite.html)이 쓰는 기본 필드도 같이 맞춥니다. */
export function legacyFieldsFromCard(card: InvitationCard) {
  const hh = String(card.wedding.hour).padStart(2, '0')
  const mm = String(card.wedding.minute).padStart(2, '0')
  return {
    groomName: card.groom.name,
    brideName: card.bride.name,
    weddingDateTime: card.wedding.date ? `${card.wedding.date}T${hh}:${mm}` : '',
    venueName: [card.wedding.venueName, card.wedding.venueHall].filter((s) => s.trim()).join(' '),
    venueAddress: card.wedding.venueAddress,
    mapQuery: card.wedding.mapQuery,
  }
}

export { defaultCard }
