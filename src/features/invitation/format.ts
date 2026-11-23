import type { InvitationCard, Parent, Person } from './types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function parseDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/** 오후 12시, 오전 11시 30분 */
export function formatTime(hour: number, minute: number): string {
  const ampm = hour < 12 ? '오전' : '오후'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${ampm} ${h}시${minute ? ` ${minute}분` : ''}`
}

/** 2026년 11월 23일 월요일 */
export function formatDateLong(value: string): string {
  const d = parseDate(value)
  if (!d) return ''
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`
}

export function weekdayLabel(value: string): string {
  const d = parseDate(value)
  return d ? `${WEEKDAYS[d.getDay()]}요일` : ''
}

/** 11 • 23 */
export function monthDay(value: string): { month: string; day: string } {
  const d = parseDate(value)
  if (!d) return { month: '', day: '' }
  return { month: String(d.getMonth() + 1).padStart(2, '0'), day: String(d.getDate()).padStart(2, '0') }
}

export interface CalendarCell {
  day: number
  inMonth: boolean
  isSunday: boolean
  isWeddingDay: boolean
}

/** 예식이 있는 달의 달력 칸(일요일 시작, 6주까지) */
export function calendarCells(value: string): CalendarCell[] {
  const d = parseDate(value)
  if (!d) return []
  const year = d.getFullYear()
  const month = d.getMonth()
  const first = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0).getDate()
  const cells: CalendarCell[] = []
  for (let i = 0; i < first.getDay(); i++) {
    cells.push({ day: 0, inMonth: false, isSunday: i === 0, isWeddingDay: false })
  }
  for (let day = 1; day <= lastDay; day++) {
    const dow = (first.getDay() + day - 1) % 7
    cells.push({ day, inMonth: true, isSunday: dow === 0, isWeddingDay: day === d.getDate() })
  }
  while (cells.length % 7 !== 0) cells.push({ day: 0, inMonth: false, isSunday: false, isWeddingDay: false })
  return cells
}

/** 오늘부터 예식일까지 남은 날 (지나면 음수, 당일 0) */
export function daysUntil(value: string, today = new Date()): number | null {
  const d = parseDate(value)
  if (!d) return null
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((d.getTime() - t.getTime()) / 86_400_000)
}

export function ddayText(value: string, today = new Date()): string {
  const n = daysUntil(value, today)
  if (n === null) return ''
  if (n > 0) return `결혼식이 ${n}일 남았어요`
  if (n === 0) return '오늘 결혼해요'
  return `결혼한 지 ${-n}일 지났어요`
}

function parentName(p: Parent): string {
  if (!p.name.trim()) return ''
  return (p.deceased ? '故 ' : '') + p.name.trim()
}

/** "김아버지 · 이어머니" 처럼 부모님 이름을 잇습니다. 둘 다 없으면 빈 문자열. */
export function parentsLine(person: Person): string {
  return [parentName(person.father), parentName(person.mother)].filter(Boolean).join(' · ')
}

export function venueLine(card: InvitationCard): string {
  return [card.wedding.venueName, card.wedding.venueHall].map((s) => s.trim()).filter(Boolean).join(' ')
}

function mapQuery(card: InvitationCard): string {
  return (card.wedding.mapQuery || card.wedding.venueAddress || card.wedding.venueName).trim()
}

export function naverMapUrl(card: InvitationCard): string {
  const q = mapQuery(card)
  return q ? `https://map.naver.com/p/search/${encodeURIComponent(q)}` : 'https://map.naver.com/'
}

export function kakaoMapUrl(card: InvitationCard): string {
  const q = mapQuery(card)
  return q ? `https://map.kakao.com/link/search/${encodeURIComponent(q)}` : 'https://map.kakao.com/'
}

export function tmapUrl(card: InvitationCard): string {
  const q = mapQuery(card)
  return `https://apis.openapi.sk.com/tmap/app/routes?goalname=${encodeURIComponent(q)}`
}

/** 저장 전에 공백만 있는 연락처 등을 정리하고, 전화번호에서 숫자 외 문자를 지웁니다. */
export function telHref(contact: string): string {
  const digits = contact.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}

export function smsHref(contact: string): string {
  const digits = contact.replace(/[^\d+]/g, '')
  return digits ? `sms:${digits}` : ''
}
