// 블로그 글 앞머리(frontmatter) 파서.
// 브라우저(Vite)와 빌드 후 스크립트(Node) 양쪽에서 쓰므로 외부 의존성 없이 작성합니다.

export interface PostMeta {
  slug: string
  title: string
  date: string // YYYY-MM-DD
  summary: string
  tags: string[]
  draft: boolean
}

export interface Post extends PostMeta {
  body: string
}

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

function unquote(value: string): string {
  const v = value.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1)
  }
  return v
}

/**
 * `---` 로 감싼 `key: value` 형식만 지원합니다.
 * tags 는 `[a, b]` 형식, draft 는 true/false.
 */
export function parsePost(slug: string, raw: string): Post {
  const match = FENCE.exec(raw)
  const fields: Record<string, string> = {}
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const idx = line.indexOf(':')
      if (idx > 0) fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
    }
  }
  const body = match ? raw.slice(match[0].length) : raw
  const tagsRaw = fields.tags ?? ''
  const tags = tagsRaw
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(unquote)
    .filter(Boolean)

  return {
    slug,
    title: unquote(fields.title ?? slug),
    date: unquote(fields.date ?? ''),
    summary: unquote(fields.summary ?? ''),
    tags,
    draft: unquote(fields.draft ?? 'false') === 'true',
    body,
  }
}

/** 파일 경로 `.../content/posts/2026-11-18-hello.md` → `2026-11-18-hello` */
export function slugFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.md$/, '')
}

/** 발행된 글만, 최신순 */
export function publishedPosts(posts: Post[]): Post[] {
  return posts.filter((p) => !p.draft).sort((a, b) => b.date.localeCompare(a.date))
}
