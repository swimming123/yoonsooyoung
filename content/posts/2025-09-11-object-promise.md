---
title: 값이 [object Promise]로 나올 때
date: 2025-09-11
summary: async 함수를 await 없이 불러서 암호화된 비밀번호 자리에 Promise가 들어갔던 문제
tags: [JavaScript, 비동기, 오류]
---

## 증상

로그인할 때 비밀번호를 암호화해서 보내도록 바꿨는데, 콘솔에 이렇게 찍혔다.

```
crypto.ts / encodeAES ===> [object Promise]
Login.vue:123 {userId: 'test', userPwd: Promise}
```

`userPwd`에 암호문 대신 `Promise`가 들어가 있다.

## 원인

암호화 함수는 서버에서 키를 받아 와야 해서 `async`였다.

```ts
const crypto = {
  async getKey() {
    const res = await api.getSecretKey()
    return res.key
  },
  async encodeAES(raw: string): Promise<string> {
    const key = await this.getKey()
    // ... 암호화
    return encrypted
  },
}
```

그런데 부르는 쪽에서 `await`를 빼먹었다.

```ts
const encPwd = this.$crypto.encodeAES(this.userPwd) // ❌ Promise가 들어간다
const loginObj = { userId: this.userId, userPwd: encPwd }
```

`async` 함수는 **항상 Promise를 돌려준다.** 안에서 `await`를 썼든 안 썼든, 결과를 쓰려면 부르는 쪽에서도 `await`(또는 `.then`)로 기다려야 한다. Promise를 문자열로 바꾸면 `[object Promise]`가 된다.

## 해결

```ts
const encPwd = await this.$crypto.encodeAES(this.userPwd) // ✅
```

그러면 그 함수도 `async`여야 한다. 비동기는 한 번 쓰면 호출하는 쪽으로 계속 퍼진다.

## 같이 나온 에러

```
TypeError: Cannot read properties of undefined (reading 'data')
    at Object.getKey (crypto.ts:6)
```

키를 받아 오는 API가 실패해서 응답이 `undefined`였다. 서버에서 `hashlib.sha256(...).digest()`로 만든 **바이트**를 그대로 JSON에 넣으려다 직렬화가 안 됐던 것. 바이트를 보내려면 `.hexdigest()`나 base64로 문자열을 만들어야 한다.

## 덧붙임

이 디버깅을 하면서 깨달은 건데, 암호화 키를 API로 프론트에 내려 주면 누구나 그 API를 불러서 키를 가져갈 수 있다. 프론트에서 대칭키로 암호화하는 건 보안상 의미가 거의 없어서, 결국 RSA 방식으로 바꿨다.

## 정리

- `async` 함수의 반환값은 Promise다. 쓰는 쪽에서 `await`.
- 콘솔에 `[object Promise]`나 `Promise {<pending>}`이 보이면 `await` 빠진 곳부터 찾는다.
