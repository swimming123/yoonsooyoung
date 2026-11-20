---
title: 순차 삭제를 Promise.all 병렬 처리로 바꾸기
date: 2025-07-31
summary: for 문에서 하나씩 기다리던 삭제를 Promise.all로 동시에 돌려서 35분을 7분으로 줄이고, 실패 처리와 동시 실행 개수 제한까지
tags: [JavaScript, 비동기]
---

여러 프로젝트를 한 번에 삭제하는 기능이 있었는데, 하나씩 순서대로 지우고 있었다. 순차 처리를 병렬 처리로 바꿔서 시간을 크게 줄였다.

## 문제

```js
// 기존: 하나씩 기다림
for (const id of deleteTargets) {
  await deleteProject(id)
}
```

삭제 하나에 길게는 7분 정도 걸리는데, 5개를 지우면 최대 35분이 걸렸다. 앞의 삭제가 끝날 때까지 다음 삭제는 시작도 안 하니 기다리는 시간이 고스란히 쌓였다.

## 해결: Promise.all

```js
// 개선: 동시에 시작하고 전부 끝날 때까지 기다림
const results = await Promise.all(deleteTargets.map((id) => deleteProject(id)))
```

모든 삭제가 동시에 시작되니, 전체 시간은 **가장 오래 걸리는 삭제 하나**만큼(최대 7분)으로 줄었다.

| 방식 | 프로젝트 5개 | 걸리는 시간 |
| --- | --- | --- |
| 순차 처리 | 7분 × 5 | 최대 35분 |
| 병렬 처리 | 동시에 실행 | 최대 7분 |

## Promise.all의 특징

- 넘긴 Promise들이 모두 동시에 진행된다.
- 결과 배열의 순서는 입력 순서와 같다(먼저 끝난 순서가 아니다).
- **하나라도 실패하면 바로 reject**된다. 나머지 요청이 취소되는 건 아니고, 결과를 못 받을 뿐이다.

### 쓰면 좋은 경우

- 서로 의존하지 않는 비동기 작업들
- 모든 결과가 필요할 때

### 피해야 하는 경우

- 앞 작업의 결과가 다음 작업에 필요할 때
- 하나가 실패해도 나머지 결과는 받아야 할 때 → `Promise.allSettled`
- 한꺼번에 너무 많이 보내면 서버에 부담이 될 때 → 동시 실행 개수 제한

## 실전 팁

### 1. 하나가 실패해도 나머지 결과 받기

삭제는 일부가 실패해도 나머지는 지워져야 하고, 무엇이 실패했는지 알아야 한다. 이럴 땐 `Promise.allSettled`가 딱 맞다.

```js
const results = await Promise.allSettled(deleteTargets.map((id) => deleteProject(id)))

const failed = deleteTargets.filter((_, i) => results[i].status === 'rejected')
if (failed.length) {
  console.warn('삭제 실패:', failed)
}
```

`deleteProject` 안에서 try/catch로 에러를 잡아서 `{ success: false }`를 돌려줘도 같은 효과지만, `allSettled`를 쓰면 함수를 고치지 않아도 된다.

### 2. 동시 실행 개수 제한하기

서버 부하가 걱정되면 몇 개씩 끊어서 보낸다.

```js
const BATCH_SIZE = 3
const results = []

for (let i = 0; i < deleteTargets.length; i += BATCH_SIZE) {
  const batch = deleteTargets.slice(i, i + BATCH_SIZE)
  results.push(...(await Promise.allSettled(batch.map((id) => deleteProject(id)))))
}
```

### 3. 다른 Promise 메서드

| 메서드 | 언제 끝나나 |
| --- | --- |
| `Promise.all` | 모두 성공하면 / 하나라도 실패하면 바로 |
| `Promise.allSettled` | 모두 끝나면 (성공·실패 상관없이) |
| `Promise.any` | 하나라도 성공하면 |
| `Promise.race` | 가장 먼저 끝난 것 하나 (성공이든 실패든) |

## 오늘의 교훈

- 서로 독립적인 작업은 병렬로 처리하자.
- `Promise.all`은 하나만 실패해도 전체가 실패하니, 부분 실패를 허용해야 하면 `allSettled`를 쓰자.
- 무작정 동시에 보내기보다 적당한 묶음 크기를 정하자.
- 이런 기술적인 개선이 그대로 사용자 경험 개선으로 이어진다.

참고: [MDN Promise.all()](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise/all), [javascript.info Promise API](https://javascript.info/promise-api)
