import { describe, expect, it } from 'vitest'
import { cardFromLegacy, legacyFieldsFromCard } from './legacy'
import { draftsOf } from './repository'

describe('기존 웨딩플래너 시안과 맞추기', () => {
  it('기존 시안 필드로 새 청첩장 값을 채운다', () => {
    const card = cardFromLegacy({
      groomName: '윤수영',
      brideName: '김하늘',
      weddingDateTime: '2026-11-23T14:30',
      venueName: '라온호텔',
      venueAddress: '서울 종로구 세종대로 175',
      blocks: [{ type: 'photos' }, { type: 'text', text: '저희 결혼합니다' }],
    })
    expect(card.main.textLeft).toBe('윤수영')
    expect(card.bride.name).toBe('김하늘')
    expect(card.wedding).toMatchObject({ date: '2026-11-23', hour: 14, minute: 30, venueName: '라온호텔' })
    expect(card.greeting.body).toBe('저희 결혼합니다')
  })

  it('저장할 때 기존 필드도 같이 만든다', () => {
    const card = cardFromLegacy({ groomName: 'A', brideName: 'B', weddingDateTime: '2026-11-23T09:05' })
    card.wedding.venueName = '라온호텔'
    card.wedding.venueHall = '3층 루체홀'
    expect(legacyFieldsFromCard(card)).toMatchObject({
      groomName: 'A',
      brideName: 'B',
      weddingDateTime: '2026-11-23T09:05',
      venueName: '라온호텔 3층 루체홀',
    })
  })

  it('시안 목록: 대표 시안, 구버전 평면 문서', () => {
    expect(draftsOf({ activeId: 'b', drafts: { a: { order: 0 }, b: { order: 1 } } }).activeId).toBe('b')
    expect(draftsOf({ activeId: 'x', drafts: { a: { order: 1 }, b: { order: 0 } } }).activeId).toBe('b')
    const flat = draftsOf({ groomName: '윤수영' })
    expect(flat.activeId).toBe('main')
    expect(flat.drafts.main!.groomName).toBe('윤수영')
  })
})
