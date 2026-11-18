# yoonsooyoung

블로그 · 가계부 · 웨딩플래너를 한곳에 모은 개인 사이트입니다.
Vue 3 + Firebase 로 만들고 GitHub Pages 로 배포합니다.

- 사이트: https://swimming123.github.io/yoonsooyoung/
- 블로그는 누구나, 가계부·웨딩플래너는 주인 계정으로 로그인해야 볼 수 있습니다.

## 구조

| 기능 | 데이터 | 위치 |
| --- | --- | --- |
| 블로그 | `content/posts/*.md` (빌드할 때 묶음) | `src/features/blog/` |
| 가계부 | Firestore `ledger_*` 컬렉션 | `src/features/ledger/` |
| 웨딩플래너 | Firestore (기존) | 1단계 `public/wedding/`, 2단계 `src/features/wedding/` |
| 로그인 | Firebase Auth (Google) | `src/stores/auth.ts` |

```
content/posts/        블로그 글(마크다운)
public/wedding/       기존 웨딩플래너 HTML (1단계)
scripts/postbuild.mjs 글별 메타 태그 페이지, 404.html 생성
src/
  lib/firebase.ts     Firebase 초기화
  router/             라우트와 로그인 가드
  stores/auth.ts      로그인 상태
  features/
    blog/             글 목록·상세, 마크다운 렌더링
    ledger/           가계부 화면, repository, 통계(순수 함수)
    wedding/          웨딩플래너 화면
firestore.rules       Firestore 보안 규칙 (데이터 보호의 핵심)
```

### 나중에 백엔드(Django/FastAPI)로 옮길 때

화면은 `LedgerRepository` 인터페이스만 사용합니다. API 버전 구현을 만들고
`useLedgerRepository()` 가 반환하는 구현만 바꾸면 됩니다. 통계 계산은 `stats.ts` 에
순수 함수로 모아 두었으니 그대로 Python 으로 옮기면 됩니다.

## 로컬 개발

```bash
npm install
cp .env.example .env.local   # Firebase 값 채우기 (없으면 블로그만 동작)
npm run dev
npm test                      # 가계부 통계 테스트
npm run build                 # 타입 체크 + 빌드
```

## Firebase 설정

1. Firebase 콘솔에서 웹 앱 설정값을 복사해 `.env.local` 에 넣습니다.
2. **Authentication → 로그인 방법**에서 Google 을 켭니다.
3. **Authentication → 설정 → 승인된 도메인**에 `swimming123.github.io` 를 추가합니다.
4. 한 번 로그인한 뒤 **Authentication → 사용자**에서 내 uid 를 복사해
   - `firestore.rules` 의 `REPLACE_WITH_YOUR_UID` 를 바꾸고
   - `.env.local` 과 GitHub 변수의 `VITE_OWNER_UIDS` 에 넣습니다.
5. 규칙 배포: `npx firebase-tools deploy --only firestore:rules`

> 공개 레포라서 Firebase 설정값은 누구나 볼 수 있습니다(원래 공개되는 값이라 괜찮습니다).
> 그래서 **`firestore.rules` 가 유일한 방어선**입니다. 규칙을 테스트 모드(모두 허용)로 두지 마세요.
> 서비스 계정 키(JSON)나 `.env.local` 은 절대 커밋하지 마세요.

## 배포 (GitHub Pages)

1. 레포 **Settings → Pages → Source** 를 **GitHub Actions** 로 바꿉니다.
2. **Settings → Secrets and variables → Actions → Variables** 에 `.env.example` 의 `VITE_*` 값을 등록합니다.
3. main 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 테스트·빌드·배포합니다.

커스텀 도메인을 연결하면 워크플로의 빌드 단계에 `BASE_PATH: /` 를 추가하세요.

## 블로그 글 쓰기

`content/posts/YYYY-MM-DD-제목.md` 파일을 만들고 push 하면 됩니다.

```md
---
title: 글 제목
date: 2026-11-18
summary: 목록에 보일 한 줄 요약
tags: [개발, 일상]
draft: false
---

본문
```

## 라이선스

- 코드: [MIT](./LICENSE)
- 블로그 글(`content/` 폴더): © 2026 swimming. All rights reserved. 무단 전재와 재배포를 금지합니다.
