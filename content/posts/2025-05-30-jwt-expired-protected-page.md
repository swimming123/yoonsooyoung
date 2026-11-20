---
title: JWT가 만료됐는데 회원 전용 화면이 보이던 문제
date: 2025-05-30
summary: 토큰이 없거나 만료된 사용자에게 회원 전용 화면이 보이던 문제를 세 번 고치면서 정리한 JWT 생명주기, 저장소, 검사 위치
tags: [JWT, 인증, Vue, Django]
---

## 문제

토큰이 만료됐거나 아예 없는 사용자가 회원만 볼 수 있는 페이지를 조회할 수 있는 문제가 있었다. 비슷한 이슈가 세 번이나 일어났다.

- 컴퓨터를 끄지 않고 웹을 계속 켜 두고 있거나
- 자동 로그인 상태로 계속 쓰고 있을 때

`access_token`이 없는데도 인증이 필요한 화면이 그대로 보였다.

## 그동안 시도한 방법

| 이슈 | 해결 방법 |
| --- | --- |
| 로그인 세션이 끊겼는데 이름만 빠진 채로 계속 접속됨 | 조회 페이지의 `onMounted()`에서 유저 아이디를 가져오고, 에러가 나면 로그아웃 처리. 로컬 스토리지의 토큰을 지우고 로그인 페이지로 이동 |
| 토큰이 유효하지 않은데 로그인된 상태로 접속됨 | 인터벌로 토큰을 주기적으로 확인하고, 없거나 만료됐으면 로그인 페이지로 이동. `main.js`나 부모 페이지에 두면 될 것 같았다 |
| 같은 문제 2 | 예전 토큰이 쿠키에 남아 있는 것 같은데, 화면에서는 만료된 토큰인지 구분이 안 됐다. → axios 인터셉터에서 요청을 보내기 전에 토큰을 먼저 검사하고, 백엔드 핸들러에서도 토큰의 수명과 서명을 확인하도록 바꿈 |

결국 마지막 방법이 맞았다. 인터벌은 좀 아니다. 콩쥐네 장독대에 두꺼비 같은 임시방편이었다. 요청이 있을 때마다 확인하는 게 맞다.

## JWT 생명주기

[JWT 소개(공식 문서)](https://jwt.io/introduction)

토큰 생성 → 저장 → 사용 → 검증 → 만료 → 재발급

- **장점**: 서버가 상태를 들고 있을 필요가 없다. 간단하다.
- **단점**: 토큰이 유출될 수 있고, 만료 시간을 관리해야 하고, 시크릿 키를 안전하게 지켜야 한다.

만료된 토큰은 로그아웃할 때 블랙리스트에 넣어서 다시 못 쓰게 했다. 그런데 정상적으로 로그아웃하지 않아서 토큰을 회수하지 못한 경우에 대한 대비가 없었다. 이번 문제가 딱 그 경우였다.

JWT는 `header.payload.signature` 구조이고, payload의 `exp`(만료 시각, 초 단위 Unix time)가 지나면 그 토큰은 받아 주면 안 된다.

## 쿠키와 웹 스토리지

- **쿠키**: 만료 기간이 있는, 클라이언트에 저장되는 작은 텍스트. 서버와 주고받은 내용을 기억할 수 있다.
- **웹 스토리지**: HTML5부터 생긴, 클라이언트에 key-value로 데이터를 저장하는 방식
    - 로컬 스토리지: 지우기 전까지 남아 있다.
    - 세션 스토리지: 탭이나 창을 닫으면 사라진다.

| 저장소 | 이럴 때 | 예 |
| --- | --- | --- |
| 쿠키 | 잠깐 필요한 가벼운 데이터 | "다시 보지 않기" 팝업, 아이디 기억 |
| 로컬 스토리지 | 계속 필요한 데이터 | 자동 로그인 |
| 세션 스토리지 | 이번 탭에서만 필요한 데이터 | 일회성 로그인, 입력 폼 임시 저장, 비회원 장바구니 |

토큰을 로컬 스토리지에 두면 XSS로 읽힐 수 있고, HttpOnly 쿠키에 두면 자바스크립트에서는 못 읽는 대신 CSRF를 신경 써야 한다. 어디에 둘지는 이 차이를 보고 정하면 된다.

## 유효성 검사는 언제, 어떻게?

필요한 곳에서 하면 된다.

- **회원만 쓰는 서비스**라면 요청할 때마다 확인해야 한다. 그래서 axios 인터셉터에 넣었다.
- **비회원과 회원의 권한이 다른 서비스**라면, 비회원도 접속할 때 토큰을 받게 한다. 둘 다 토큰이 있으니 조회에는 문제가 없고, 회원만 봐야 하는 곳은 토큰 안의 권한을 비교해서 막는다.

## 프론트에서 만료 확인하기

payload는 base64url로 인코딩돼 있어서 디코딩만 하면 `exp`를 볼 수 있다. (서명 검증은 서버에서 해야 한다. 프론트의 확인은 "이미 만료된 토큰으로 요청하지 않기" 정도의 용도다.)

```ts
function isExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const { exp } = JSON.parse(json) as { exp?: number }
    return !exp || exp * 1000 <= Date.now()
  } catch {
    return true
  }
}
```

[jwt-decode](https://www.npmjs.com/package/jwt-decode) 라이브러리를 써도 된다.

axios 인터셉터에서는 이렇게 쓴다.

```ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (!token || isExpired(token)) {
    // 리프레시 토큰으로 재발급을 시도하거나 로그인 화면으로 보낸다
    return Promise.reject(new Error('토큰 만료'))
  }
  config.headers.Authorization = `Bearer ${token}`
  return config
})
```

## 백엔드 (Django REST Framework + SimpleJWT)

토큰 수명은 SimpleJWT 설정에서 정한다. ([설정 문서](https://django-rest-framework-simplejwt.readthedocs.io/en/latest/settings.html))

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}
```

액세스 토큰이 만료되면 리프레시 토큰으로 새로 받고, 리프레시 토큰까지 만료되면 로그인 화면으로 보낸다.

## 할 일

- 같은 이슈가 다시 생기는지 지켜보기
- 요청 헤더에 토큰을 넣는 부분을 공통 함수로 정리하기
