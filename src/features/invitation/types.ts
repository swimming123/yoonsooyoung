// 모바일 청첩장 디자인 데이터.
// 기존 웨딩플래너의 시안(app/invitation 문서의 drafts.{id}) 안 `card` 필드에 저장합니다.

export type ThemeColor = 'pink' | 'beige' | 'green' | 'gray' | 'purple'
export type FontKey = 'pretendard' | 'gowunBatang' | 'gowunDodum' | 'nanumMyeongjo' | 'notoSerif' | 'hahmlet'
export type FontSize = 'S' | 'M' | 'L'
export type MainLayout = 'basic' | 'arch' | 'poster' | 'frame'
export type BackgroundEffect = 'none' | 'fog' | 'wave'
export type FallingEffect = 'none' | 'petal' | 'leaf' | 'snow' | 'heart' | 'star'
export type IntroEffect = 'none' | 'fade' | 'typing'

export interface Parent {
  name: string
  deceased: boolean
  contact: string
}

export interface Person {
  name: string
  /** 부모님과의 관계: 아들, 장남, 딸, 장녀 … */
  relation: string
  contact: string
  father: Parent
  mother: Parent
}

export interface Account {
  id: string
  /** 신랑, 신랑 아버님 … */
  owner: string
  bank: string
  number: string
  holder: string
}

export interface InvitationCard {
  version: 1
  template: {
    color: ThemeColor
    font: FontKey
    fontSize: FontSize
  }
  main: {
    layout: MainLayout
    textLeft: string
    textMiddle: string
    textRight: string
    background: BackgroundEffect
    falling: FallingEffect
    /** invitationPhotos 문서 id (role=main) */
    photoId: string
    intro: IntroEffect
    introText: string
  }
  groom: Person
  bride: Person
  wedding: {
    /** YYYY-MM-DD */
    date: string
    hour: number
    minute: number
    showVenue: boolean
    venueName: string
    venueHall: string
    venueAddress: string
    /** 지도 검색어(비우면 주소로 검색) */
    mapQuery: string
  }
  greeting: {
    title: string
    body: string
    showParents: boolean
  }
  calendar: {
    show: boolean
    showDday: boolean
  }
  gallery: {
    show: boolean
    title: string
    layout: 'grid' | 'slide'
  }
  location: {
    subway: string
    bus: string
    car: string
  }
  accounts: {
    show: boolean
    title: string
    message: string
    groom: Account[]
    bride: Account[]
  }
  closing: {
    show: boolean
    text: string
  }
  share: {
    title: string
    description: string
    showLinkCopy: boolean
  }
}

export interface InvitationPhoto {
  id: string
  /** 시안 id. 기존 웨딩플래너 사진은 비어 있으면 'main' 시안 것 */
  inviteId?: string
  /** 새 편집 화면에서 올린 사진만 있음. 없으면 갤러리 사진으로 봄 */
  role?: 'main' | 'gallery'
  order: number
  /** data URL (Firestore 문서 하나 1MB 제한 때문에 압축해서 저장) */
  image: string
  kb?: number
}

export const THEME_COLORS: { key: ThemeColor; label: string; base: string; point: string; isNew?: boolean }[] = [
  { key: 'pink', label: '핑크', base: '#fbf1f1', point: '#c8737f' },
  { key: 'beige', label: '베이지', base: '#f6f0e6', point: '#a7845a' },
  { key: 'green', label: '그린', base: '#eef3ec', point: '#5e8061' },
  { key: 'gray', label: '그레이', base: '#f2f2f2', point: '#5f6368' },
  { key: 'purple', label: '퍼플', base: '#f3effa', point: '#8569b3' },
]

export const FONTS: { key: FontKey; label: string; family: string; google?: string }[] = [
  { key: 'pretendard', label: '기본 고딕', family: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif" },
  { key: 'gowunBatang', label: '고운바탕', family: "'Gowun Batang', serif", google: 'Gowun+Batang:wght@400;700' },
  { key: 'gowunDodum', label: '고운돋움', family: "'Gowun Dodum', sans-serif", google: 'Gowun+Dodum' },
  { key: 'nanumMyeongjo', label: '나눔명조', family: "'Nanum Myeongjo', serif", google: 'Nanum+Myeongjo:wght@400;700' },
  { key: 'notoSerif', label: '본명조', family: "'Noto Serif KR', serif", google: 'Noto+Serif+KR:wght@400;600' },
  { key: 'hahmlet', label: '함렛', family: "'Hahmlet', serif", google: 'Hahmlet:wght@400;600' },
]

export const MAIN_LAYOUTS: { key: MainLayout; label: string; description: string }[] = [
  { key: 'basic', label: '베이직', description: '날짜 · 사진 · 이름' },
  { key: 'arch', label: '아치', description: '아치형 사진 프레임' },
  { key: 'poster', label: '포스터', description: '사진 위에 큰 글씨' },
  { key: 'frame', label: '프레임', description: '여백 있는 액자 사진' },
]

export const FALLING_EFFECTS: { key: FallingEffect; label: string; char: string }[] = [
  { key: 'none', label: '없음', char: '' },
  { key: 'petal', label: '🌸 꽃잎', char: '🌸' },
  { key: 'leaf', label: '🍃 나뭇잎', char: '🍃' },
  { key: 'snow', label: '❄️ 눈', char: '❄' },
  { key: 'heart', label: '💕 하트', char: '♥' },
  { key: 'star', label: '✨ 별', char: '✦' },
]

export const RELATIONS = ['아들', '장남', '차남', '삼남', '막내', '딸', '장녀', '차녀', '삼녀', '막내딸']

let seq = 0
export function newId(): string {
  seq += 1
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + seq
}

function emptyParent(): Parent {
  return { name: '', deceased: false, contact: '' }
}

function emptyPerson(name: string, relation: string): Person {
  return { name, relation, contact: '', father: emptyParent(), mother: emptyParent() }
}

export function defaultCard(today = new Date()): InvitationCard {
  const d = new Date(today)
  d.setMonth(d.getMonth() + 6)
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    version: 1,
    template: { color: 'pink', font: 'pretendard', fontSize: 'S' },
    main: {
      layout: 'basic',
      textLeft: '신랑',
      textMiddle: '♡',
      textRight: '신부',
      background: 'none',
      falling: 'none',
      photoId: '',
      intro: 'none',
      introText: '',
    },
    groom: emptyPerson('신랑', '아들'),
    bride: emptyPerson('신부', '딸'),
    wedding: {
      date,
      hour: 12,
      minute: 0,
      showVenue: true,
      venueName: '',
      venueHall: '',
      venueAddress: '',
      mapQuery: '',
    },
    greeting: {
      title: '모시는 말씀',
      body:
        '서로를 아끼고 사랑하며 함께\n걸어갈 사람을 만났습니다.\n\n새로운 시작의 자리에\n소중한 분들을 모시고자 합니다.\n\n귀한 걸음 하시어 축복해 주시면\n더없는 기쁨으로 간직하겠습니다.',
      showParents: true,
    },
    calendar: { show: true, showDday: true },
    gallery: { show: true, title: '갤러리', layout: 'grid' },
    location: { subway: '', bus: '', car: '' },
    accounts: {
      show: true,
      title: '마음 전하실 곳',
      message: '참석이 어려우신 분들을 위해 계좌번호를 남겨요.\n너그러운 마음으로 양해 부탁드려요.',
      groom: [],
      bride: [],
    },
    closing: { show: false, text: '' },
    share: { title: '', description: '', showLinkCopy: true },
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 기본값 위에 저장된 값을 덮어씁니다. 나중에 필드가 늘어도 옛 데이터를 그대로 읽을 수 있게. */
function mergeDeep<T>(base: T, saved: unknown): T {
  if (saved === null || saved === undefined) return base
  if (!isObject(base) || !isObject(saved)) {
    if (Array.isArray(base)) return (Array.isArray(saved) ? saved : base) as T
    return (typeof saved === typeof base && !isObject(base) ? saved : base) as T
  }
  const out: Record<string, unknown> = { ...base }
  for (const key of Object.keys(base)) {
    out[key] = mergeDeep((base as Record<string, unknown>)[key], saved[key])
  }
  return out as T
}

export function normalizeCard(saved: unknown, today = new Date()): InvitationCard {
  return mergeDeep(defaultCard(today), saved)
}
