---
title: 배열이 원하는 순서로 안 나올 때 (for in, for of, map, forEach)
date: 2025-05-28
summary: 의견 목록이 거꾸로 보이던 문제를 고치면서 정리한 배열 정렬과 순회 문법의 차이
tags: [JavaScript, Vue]
---

## 증상

의견 목록이 0, 1, 2, 3 순서로 나와야 하는데 3, 2, 1, 0으로 나왔다. 정확히는, 최신 의견이 위로 와야 하는데 API는 오래된 순으로 보내 주고 있었다.

## 해결

API에서 받은 배열을 그대로 쓰지 않고, 뒤집어서 최신 의견이 위로 오게 했다.

```js
opinions.value = [...res.data.opinions].reverse()
```

`reverse()`는 **원본 배열을 바꾼다.** 원본을 다른 곳에서도 쓴다면 위처럼 복사한 뒤 뒤집거나, 최신 브라우저에서는 원본을 안 바꾸는 `toReversed()`를 쓴다.

더 확실한 방법은 순서를 우연에 맡기지 않고 **기준으로 정렬**하는 것이다. 서버가 순서를 바꾸더라도 화면은 그대로다.

```js
opinions.value = [...res.data.opinions].sort((a, b) => b.created_at.localeCompare(a.created_at))
```

가능하면 API에서 정렬해서 내려 주는 게 가장 좋다(`ORDER BY created_at DESC`).

## 덤: 배열 순회 문법 정리

고치면서 순회 문법이 헷갈려서 같이 정리했다.

| 문법 | 대상 | 꺼내는 것 | 특징 |
| --- | --- | --- | --- |
| `for...in` | 객체 (배열에도 되긴 함) | 키 | 배열이면 `"0"`, `"1"`처럼 **문자열** 인덱스 |
| `for...of` | 배열, 문자열 등 iterable | 값 | `break`, `continue`, `await` 사용 가능 |
| `map()` | 배열 | 값 | 함수를 적용한 **새 배열**을 돌려줌 |
| `forEach()` | 배열 | 값 | 반환값 없음, 중간에 멈출 수 없음 |

```js
const arr = ['apple', 'banana', 'cherry']

for (const i in arr) console.log(i)        // "0", "1", "2"
for (const item of arr) console.log(item)  // apple, banana, cherry

const upper = arr.map((item) => item.toUpperCase()) // ['APPLE', 'BANANA', 'CHERRY']
arr.forEach((item) => console.log(item))
```

배열에 `for...in`을 쓰면 인덱스가 문자열이라 `i + 1`이 `"01"`이 되는 식의 실수가 생기고, 배열에 붙은 다른 속성까지 돌 수 있다. **배열은 `for...of`나 배열 메서드로** 돌자.

객체 배열에서 특정 값만 뽑을 때는 `map`이 편하다.

```js
const contents = opinions.map((op) => op.content)
```

콘솔에서 객체나 배열을 보기 좋게 찍고 싶으면

```js
console.log(JSON.stringify(opinions, null, 2)) // 들여쓰기 2칸
```

| 하고 싶은 것 | 쓰는 것 |
| --- | --- |
| 배열의 값을 순서대로 처리 | `for...of` |
| 인덱스도 같이 필요 | `arr.forEach((v, i) => …)` 또는 `for (const [i, v] of arr.entries())` |
| 값을 바꿔서 새 배열 만들기 | `map` |
| 객체의 키 돌기 | `Object.keys(obj)` / `Object.entries(obj)` |
