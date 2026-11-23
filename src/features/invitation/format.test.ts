import { describe, expect, it } from 'vitest'
import { calendarCells, ddayText, formatDateLong, formatTime, parentsLine } from './format'
import { defaultCard, normalizeCard } from './types'

describe('청첩장 날짜·문구', () => {
  it('날짜와 시간을 한국어로 쓴다', () => {
    expect(formatDateLong('2026-11-23')).toBe('2026년 11월 23일 월요일')
    expect(formatTime(12, 0)).toBe('오후 12시')
    expect(formatTime(0, 30)).toBe('오전 12시 30분')
    expect(formatTime(14, 30)).toBe('오후 2시 30분')
  })

  it('달력은 일요일부터 시작하고 예식일을 표시한다', () => {
    const cells = calendarCells('2026-11-23')
    // 2026년 11월 1일은 일요일
    expect(cells[0]).toMatchObject({ day: 1, isSunday: true })
    expect(cells.find((c) => c.isWeddingDay)?.day).toBe(23)
    expect(cells.length % 7).toBe(0)
  })

  it('D-day 문구', () => {
    const today = new Date(2026, 10, 20)
    expect(ddayText('2026-11-23', today)).toBe('결혼식이 3일 남았어요')
    expect(ddayText('2026-11-20', today)).toBe('오늘 결혼해요')
    expect(ddayText('2026-11-18', today)).toBe('결혼한 지 2일 지났어요')
  })

  it('부모님 이름 줄은 고인 표시를 붙이고 빈 칸은 뺀다', () => {
    const p = defaultCard().groom
    expect(parentsLine(p)).toBe('')
    p.father = { name: '김아버지', deceased: true, contact: '' }
    p.mother = { name: '이어머니', deceased: false, contact: '' }
    expect(parentsLine(p)).toBe('故 김아버지 · 이어머니')
  })

  it('저장된 값이 일부만 있어도 기본값으로 채운다', () => {
    const card = normalizeCard({ template: { color: 'green' }, groom: { name: '윤수영' }, unknown: 1 })
    expect(card.template.color).toBe('green')
    expect(card.template.font).toBe('pretendard')
    expect(card.groom.name).toBe('윤수영')
    expect(card.groom.father.name).toBe('')
    expect('unknown' in card).toBe(false)
  })

  it('저장된 값이 없거나 null 이어도 기본값을 돌려준다', () => {
    expect(normalizeCard(null).main.layout).toBe('basic')
    expect(normalizeCard({ main: null }).main.textMiddle).toBe('♡')
    expect(normalizeCard({ template: { fontSize: 3 } }).template.fontSize).toBe('S')
  })
})
