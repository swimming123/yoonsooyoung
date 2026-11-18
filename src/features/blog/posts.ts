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

export function renderMarkdown(body: string): string {
  return md.render(body)
}
