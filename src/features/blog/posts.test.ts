import { describe, expect, it } from 'vitest'
import { renderMarkdown, withBase } from './posts'

describe('blog images', () => {
  it('사이트 루트 기준 경로에 BASE_URL 을 붙인다', () => {
    expect(withBase('/images/posts/a/01.jpg', '/yoonsooyoung/')).toBe('/yoonsooyoung/images/posts/a/01.jpg')
    expect(withBase('/images/x.png', '/')).toBe('/images/x.png')
  })

  it('외부 주소와 상대 경로는 그대로 둔다', () => {
    expect(withBase('https://example.com/a.png', '/yoonsooyoung/')).toBe('https://example.com/a.png')
    expect(withBase('//cdn.example.com/a.png', '/yoonsooyoung/')).toBe('//cdn.example.com/a.png')
    expect(withBase('a.png', '/yoonsooyoung/')).toBe('a.png')
  })

  it('렌더링한 사진에 지연 로딩을 붙인다', () => {
    const html = renderMarkdown('![고양이](/images/posts/a/01.jpg)')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('images/posts/a/01.jpg')
  })

  it('사이트 내부 링크에도 BASE_URL 을 붙인다', () => {
    const html = renderMarkdown('[이전 글](/blog/a/) [외부](https://example.com/)')
    expect(html).toContain(`href="${import.meta.env.BASE_URL.replace(/\/$/, '')}/blog/a/"`)
    expect(html).toContain('href="https://example.com/"')
  })
})
