# 웨딩플래너 (1단계)

기존 `swimming123/wedding-log` 의 페이지를 그대로 옮겨 온 폴더입니다.
같은 Firebase 프로젝트(`wedding-log-ab8be`)를 쓰므로 데이터는 옮길 필요 없이 그대로 보입니다.

| 파일 | 주소 | 누가 보나 |
| --- | --- | --- |
| `index.html` | `/yoonsooyoung/wedding/index.html` | 로그인한 주인 (편집용) |
| `timeline.html` | `/yoonsooyoung/wedding/timeline.html` | 누구나 (보기 전용) |
| `invite.html` | `/yoonsooyoung/wedding/invite.html` | 누구나 (모바일 청첩장) |
| `og-*.jpg` | 같은 폴더 | 청첩장 링크 미리보기 이미지 |

옮기면서 바꾼 것
- `invite.html` 의 og:url, og:image 주소를 새 사이트 주소로 변경
- `index.html` 의 「링크 미리보기」 GitHub 연결 기본값을 `swimming123/yoonsooyoung`, `public/wedding/invite.html` 로 변경
  (저장하면 main 브랜치에 커밋되고 GitHub Actions 가 다시 배포합니다)

2단계에서 이 파일들을 `src/features/wedding/` 의 Vue 컴포넌트로 옮깁니다.
