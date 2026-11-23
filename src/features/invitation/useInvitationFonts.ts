import { watchEffect } from 'vue'
import { FONTS, type FontKey } from './types'

// 청첩장 화면에서만 웹폰트를 불러옵니다. 같은 주소는 한 번만 넣어요.
const PRETENDARD = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'
const ALWAYS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap'

function addStylesheet(href: string) {
  if (typeof document === 'undefined') return
  if (document.querySelector(`link[data-inv-font="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.invFont = href
  document.head.appendChild(link)
}

export function fontHref(key: FontKey): string {
  const f = FONTS.find((x) => x.key === key)
  if (!f?.google) return PRETENDARD
  return `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`
}

/** 선택한 글꼴(또는 편집 화면이면 전체 글꼴)을 불러옵니다. */
export function useInvitationFonts(selected: () => FontKey | FontKey[]) {
  addStylesheet(ALWAYS)
  watchEffect(() => {
    const keys = selected()
    for (const key of Array.isArray(keys) ? keys : [keys]) addStylesheet(fontHref(key))
  })
}
