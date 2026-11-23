---
title: "폴링 개선: setInterval 대신 응답 후 대기, AbortController, 비활성 탭 멈추기"
date: 2026-04-06
summary: 1초마다 상태를 불러오는 모니터링 화면에서 요청이 쌓여 응답이 5초씩 밀리던 문제를 클라이언트만 고쳐서 해결한 기록
tags: [JavaScript, Vue, 비동기, 성능]
---

1초마다 서버 상태를 불러오는 모니터링 화면이 있었다. 평소에는 괜찮은데, 서버가 조금만 느려지면 응답이 5초씩 밀리기 시작했다. 같은 화면을 탭 4개에 띄워 두고 보는 경우도 많았다.

원인은 `setInterval`이었다.

## 문제: setInterval은 응답을 기다리지 않는다

```js
setInterval(fetchStatus, 1000)
```

```
t=0s  요청 1 시작
t=1s  요청 2 시작 (요청 1 응답이 아직 안 왔어도)
t=2s  요청 3 시작 ...
```

응답이 1초보다 늦어지면 요청이 계속 겹친다. 겹친 요청들이 서버 연결을 붙잡고 있으니 서버는 더 느려지고, 그러면 더 많이 겹친다. 탭 4개면 4배다.

## 클라이언트에서 할 수 있는 것

1. **응답 후 대기(trailing interval)**: 응답이 온 뒤에 다음 요청을 예약한다.
2. **오래된 요청 취소(AbortController)**: 새 요청을 보내기 전에 이전 요청이 살아 있으면 취소한다.
3. **비활성 탭에서 멈추기**: 보고 있지 않은 탭은 요청을 보내지 않는다.
4. **간격 늘리기**: 1초는 모니터링치고 빠른 편이다. 2~3초로 늘리면 요청 수가 절반에서 1/3로 준다.

1~3번만으로도 서버를 건드리지 않고 문제 대부분이 해결됐다.

## 1. 응답 후 대기

`setInterval` 대신 응답을 받은 뒤 `setTimeout`으로 다음 요청을 예약한다.

```
t=0.0s  요청 시작
t=0.8s  응답 도착 → 1초 대기
t=1.8s  요청 시작
t=2.6s  응답 도착 → 1초 대기
t=3.6s  요청 시작 ...
```

실제 주기는 "응답 시간 + 1초"가 되지만, 구조적으로 **요청이 겹칠 수가 없다.** 응답이 0.5초 안에 오면 체감은 거의 1초와 같다.

정확히 1초 간격이 꼭 필요하다면 `setInterval`을 두고 2번(취소)만 적용하는 방법도 있다.

## 2. AbortController로 이전 요청 취소

응답 후 대기만으로도 겹치지는 않지만, 화면을 떠나거나 조건이 바뀌었을 때 진행 중인 요청을 끊으려면 취소가 필요하다.

기존 코드에도 AbortController가 있었는데, 두 가지가 빠져 있었다.

- 요청이 끝난 뒤 `finally`에서 컨트롤러를 비우지 않음
- 취소로 생긴 에러(`CanceledError`)를 진짜 에러처럼 처리함

## 3. 보고 있지 않은 탭은 멈추기

`document.visibilityState`로 탭이 보이는지 알 수 있다. 숨겨지면 멈추고, 다시 보이면 바로 한 번 불러온 뒤 이어서 돈다.

## 합친 코드 (Vue composable)

```ts
import axios from 'axios'
import { onBeforeUnmount, onMounted } from 'vue'

export function usePolling(fetcher: (signal: AbortSignal) => Promise<void>, delay = 1000) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | null = null
  let stopped = false

  async function tick() {
    if (stopped || document.visibilityState === 'hidden') return
    controller?.abort()
    controller = new AbortController()
    try {
      await fetcher(controller.signal)
    } catch (e) {
      if (!axios.isCancel(e)) console.error(e) // 취소는 에러가 아니다
    } finally {
      controller = null
      if (!stopped && document.visibilityState === 'visible') {
        timer = setTimeout(tick, delay) // 응답이 온 뒤에 다음 예약
      }
    }
  }

  function onVisibility() {
    clearTimeout(timer)
    if (document.visibilityState === 'visible') tick()
    else controller?.abort()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibility)
    tick()
  })

  onBeforeUnmount(() => {
    stopped = true
    clearTimeout(timer)
    controller?.abort()
    document.removeEventListener('visibilitychange', onVisibility)
  })
}
```

```ts
usePolling(async (signal) => {
  const { data } = await api.get('/status', { signal })
  status.value = data
}, 2000)
```

## 더 나아간다면

| 순서 | 방법 | 서버 변경 |
| --- | --- | --- |
| 1 | 응답 후 대기 + AbortController + 비활성 탭 멈춤 | 없음 |
| 2 | SSE(Server-Sent Events) | 엔드포인트 하나 추가 |
| 3 | WebSocket | 연결 관리 필요 |

모니터링은 서버 → 클라이언트 한 방향이라 SSE로 충분하다. FastAPI에서는 `StreamingResponse`로 간단히 만들 수 있다. WebSocket은 양방향 통신이 필요할 때 고려하면 된다.

참고: [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController), [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
