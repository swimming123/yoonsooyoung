---
title: "Django + Vue + Docker: CSRF, API 경로, 프록시 정리"
date: 2025-06-26
summary: 클래스 뷰에 csrf_exempt를 붙였다가 난 as_view 에러, api/api로 겹친 경로, 프록시 rewrite, nginx 뒤에서 HTML 400이 날 때 확인할 것
tags: [Django, Vue, Docker, Nginx, 오류]
---

Django 백엔드와 Vue 프론트를 Docker로 띄우면서 API 연동 문제를 여러 번 만났다. 한 번에 정리해 둔다.

## 1. 클래스 뷰에 @csrf_exempt를 붙였더니

### 오류 메시지

```
AttributeError: 'function' object has no attribute 'as_view'
```

### 원인

`@csrf_exempt`는 **함수용** 데코레이터다. 클래스 위에 붙이면 클래스가 함수로 바뀌어 버려서, urls.py의 `.as_view()`를 부를 수 없게 된다.

### 해결

클래스 뷰에는 `method_decorator`로 `dispatch`에 붙이거나, urls.py에서 감싼다.

```python
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(View):
    ...

# 또는 urls.py에서
path('join/register/', csrf_exempt(RegisterView.as_view())),
```

DRF의 `APIView`라면 `as_view()`가 이미 `csrf_exempt`로 감싸져 있다. DRF에서 CSRF 검사는 `SessionAuthentication`을 쓸 때만 한다. JWT만 쓴다면 CSRF 데코레이터를 붙일 필요가 없다.

## 2. 경로가 /api/api/로 겹침

Django urls.py에 이미 `api/` 접두사가 있는데, 프론트의 `VITE_BACKEND_URL`에도 `/api`가 들어 있고, 호출하는 코드에도 `/api/...`를 붙여서 최종 경로가 `/api/api/join/register/`가 됐다. 없는 경로라 에러가 났다.

**`/api`를 붙이는 곳을 한 군데로 정한다.**

| baseURL | 호출 경로 |
| --- | --- |
| `https://도메인:포트/api` | `/join/register/` |
| `https://도메인:포트` 또는 `''` | `/api/join/register/` |

나는 환경 변수에는 도메인과 포트까지만 넣고, `/api`는 코드에서 붙이기로 정했다.

## 3. Vite 프록시의 rewrite

개발 서버에서 `/api`로 시작하는 요청을 백엔드 컨테이너로 넘기도록 프록시를 걸었다.

```js
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://backend:8000',   // compose 서비스 이름
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),  // ← 주의
    },
  },
},
```

처음에 예제를 그대로 가져오면서 `rewrite`로 `/api`를 떼어 버렸는데, 정작 Django urls.py는 `api/`로 시작하고 있어서 404가 났다. **백엔드 경로에 `/api`가 있으면 rewrite를 빼야 한다.** rewrite는 백엔드 경로에 `/api`가 없을 때만 쓴다.

```js
// .env
VITE_BACKEND_URL=""

// axios
const api = axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL || '' })
api.get('/api/join/info/')   // → 프록시 → http://backend:8000/api/join/info/
```

같은 compose 네트워크 안에서는 백엔드를 서비스 이름(`backend`)과 포트로 부를 수 있다. 다만 브라우저는 컨테이너 네트워크 안에 있지 않으니, **브라우저가 직접 부르는 주소**에는 서비스 이름을 쓸 수 없다. 그래서 프록시가 필요하다.

## 4. nginx 뒤에서 HTML로 된 400이 올 때

운영처럼 nginx(HTTPS)가 프론트 정적 파일을 서빙하고 `/api`를 Django로 넘기는 구조에서, POST를 보내면 400이 왔다. 응답은 JSON이 아니라 `text/html`이었고 Django 로그에는 아무것도 안 찍혔다.

```
브라우저 → nginx(443) → Django(8000)
```

이럴 때 확인한 순서다.

```bash
# 1. nginx 컨테이너에서 백엔드가 보이나
docker exec frontend-nginx curl -v http://backend:8000/api/health/

# 2. nginx 에러 로그
docker exec frontend-nginx cat /var/log/nginx/error.log

# 3. Django 로그 (django.security 로거까지)
docker logs -f backend
```

HTML로 된 400이 나오는 흔한 원인은

- **Django `ALLOWED_HOSTS`**: nginx가 넘긴 `Host` 헤더가 목록에 없으면 Django가 `Bad Request (400)` HTML을 돌려준다. 이 경고는 `django.security.DisallowedHost` 로거로 가서, 로그 설정에 따라 안 보일 수 있다.
- **nginx에서 HTTP/HTTPS가 섞임**: HTTPS 포트로 평문 HTTP를 보내면 nginx가 자체 400 페이지를 돌려준다.
- **CSRF**: 세션 인증을 쓰는데 `CSRF_TRUSTED_ORIGINS`에 `https://도메인:포트`가 없으면 403이 난다(400이 아니라 403이니 구분하자).

nginx에서는 Django가 원래 주소를 알 수 있게 헤더를 넘겨 둔다.

```nginx
location /api/ {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 정리

- 클래스 뷰의 CSRF 예외는 `method_decorator(csrf_exempt, name='dispatch')`로. DRF + JWT면 필요 없다.
- `/api`는 한 곳에서만 붙인다.
- 프록시 `rewrite`는 백엔드 경로와 맞춘다.
- HTML로 된 400이면 `ALLOWED_HOSTS`와 nginx 로그부터 본다.
