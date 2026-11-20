import MarkdownIt from 'markdown-it'
import { parsePost, publishedPosts, slugFromPath, type Post } from './frontmatter'

// content/posts/*.md 를 빌드할 때 모두 묶어 넣습니다. 글을 추가하면 다시 빌드·배포됩니다.
const files = import.meta.glob('/content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const all: Post[] = Object.entries(files).map(([path, raw]) => parsePost(slugFromPath(path), raw))

export const posts: Post[] = publishedPosts(all)

export function findPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export const allTags: string[] = [...new Set(posts.flatMap((p) => p.tags))].sort()

// html: false → 글 안의 HTML 태그는 그대로 글자로 보입니다(안전).
const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

/**
 * 글에서는 사진을 `/images/posts/글이름/01.jpg` 처럼 사이트 루트 기준으로 씁니다.
 * GitHub Pages 프로젝트 사이트는 /yoonsooyoung/ 아래에 있으므로 BASE_URL 을 붙여 줍니다.
 * (커스텀 도메인으로 옮겨도 글은 고칠 필요 없음)
 */
export function withBase(src: string, base: string = import.meta.env.BASE_URL): string {
  if (!src.startsWith('/') || src.startsWith('//')) return src
  return base.replace(/\/$/, '') + src
}

const defaultImage = md.renderer.rules.image!
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const src = token.attrGet('src')
  if (src) token.attrSet('src', withBase(String(src)))
  token.attrSet('loading', 'lazy')
  return defaultImage(tokens, idx, options, env, self)
}

// 글 안의 `/blog/...` 같은 사이트 내부 링크에도 BASE_URL 을 붙인다.
const defaultLinkOpen =
  md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const href = token.attrGet('href')
  if (href) token.attrSet('href', withBase(String(href)))
  return defaultLinkOpen(tokens, idx, options, env, self)
}

export function renderMarkdown(body: string): string {
  return md.render(body)
}
