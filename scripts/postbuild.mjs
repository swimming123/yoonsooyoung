// vite build 이후 GitHub Pages 용 정리 작업.
// 1) 블로그 글마다 dist/blog/<slug>/index.html 을 만들어 제목·요약 메타 태그를 넣습니다.
//    (검색엔진과 카카오톡·슬랙 링크 미리보기가 글 제목을 읽을 수 있게)
// 2) 나머지 경로(가계부 등)는 404.html 로 SPA 를 띄워 새로고침해도 화면이 나오게 합니다.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { parsePost, publishedPosts, slugFromPath } from '../src/features/blog/frontmatter.ts'

const dist = new URL('../dist/', import.meta.url).pathname
const postsDir = new URL('../content/posts/', import.meta.url).pathname
const siteName = 'yoonsooyoung'

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function withMeta(html, { title, description }) {
  const t = escapeHtml(title)
  const d = escapeHtml(description)
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1article$2`)
}

async function writePage(path, html) {
  await mkdir(join(dist, path), { recursive: true })
  await writeFile(join(dist, path, 'index.html'), html)
}

const shell = await readFile(join(dist, 'index.html'), 'utf8')

const files = (await readdir(postsDir)).filter((f) => f.endsWith('.md'))
const posts = publishedPosts(
  await Promise.all(
    files.map(async (f) => parsePost(slugFromPath(f), await readFile(join(postsDir, f), 'utf8'))),
  ),
)

await writePage('blog', withMeta(shell, { title: `블로그 · ${siteName}`, description: '글 목록' }))
for (const p of posts) {
  await writePage(
    join('blog', p.slug),
    withMeta(shell, { title: `${p.title} · ${siteName}`, description: p.summary || p.title }),
  )
}

await writeFile(join(dist, '404.html'), shell)
// GitHub Pages 의 Jekyll 처리를 끕니다(밑줄로 시작하는 파일도 그대로 배포).
await writeFile(join(dist, '.nojekyll'), '')

console.log(`postbuild: 글 ${posts.length}개 페이지, 404.html, .nojekyll 생성`)

// 3) 웨딩플래너 정적 페이지(dist/wedding/*.html)도 사이트와 같은 Firebase 프로젝트를 쓰게 합니다.
//    파일 안의 firebaseConfig 는 로컬 개발용 기본값이고, 배포할 때 VITE_FIREBASE_* 값으로 바꿔 넣어요.
const clean = (v) => (v ?? '').trim().replace(/,$/, '').trim().replace(/^["'`]|["'`]$/g, '').trim()
const siteConfig = {
  apiKey: clean(process.env.VITE_FIREBASE_API_KEY),
  authDomain: clean(process.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: clean(process.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(process.env.VITE_FIREBASE_APP_ID),
}
if (siteConfig.apiKey && siteConfig.projectId) {
  const weddingDir = join(dist, 'wedding')
  for (const f of (await readdir(weddingDir)).filter((n) => n.endsWith('.html'))) {
    const path = join(weddingDir, f)
    const html = await readFile(path, 'utf8')
    const next = html.replace(
      /const firebaseConfig = \{[\s\S]*?\};/,
      `const firebaseConfig = ${JSON.stringify(siteConfig, null, 2)};`,
    )
    if (next === html) throw new Error(`${f}: firebaseConfig 를 찾지 못했어요`)
    await writeFile(path, next)
  }
  console.log(`postbuild: 웨딩플래너 페이지를 Firebase 프로젝트 ${siteConfig.projectId} 에 연결`)
}
