---
title: Vue 컴포넌트 생명주기 정리
date: 2025-09-18
summary: Three.js 3D 뷰어를 Vue 컴포넌트로 만들면서 정리한 생명주기 훅, 어디서 무엇을 초기화하고 무엇을 정리해야 하는지
tags: [Vue, Three.js]
---

Three.js로 3D 모델 뷰어를 Vue 컴포넌트로 만들다가, 화면을 옮겼다 돌아오면 캔버스가 두 개가 되거나 브라우저가 점점 무거워지는 문제가 생겼다. 원인은 생명주기를 제대로 몰라서 정리를 안 했던 것. 그래서 한 번 정리했다.

## 생명주기란?

Vue 컴포넌트는 만들어져서 화면에 붙고, 데이터가 바뀌면 다시 그려지고, 마지막에 사라진다. 각 단계마다 불리는 함수를 **생명주기 훅(lifecycle hook)**이라고 한다.

| 단계 | Options API | Composition API | 이때 할 수 있는 것 |
| --- | --- | --- | --- |
| 생성 전 | `beforeCreate` | (`setup()` 자체) | data, methods가 아직 없다 |
| 생성 | `created` | (`setup()` 자체) | data, computed, methods 사용 가능. DOM은 아직 없다 |
| 마운트 전 | `beforeMount` | `onBeforeMount` | 템플릿은 준비됐지만 DOM에 붙기 직전 |
| 마운트 | `mounted` | `onMounted` | DOM, `$refs` 접근 가능 |
| 업데이트 전 | `beforeUpdate` | `onBeforeUpdate` | 데이터가 바뀌어 다시 그리기 직전 |
| 업데이트 | `updated` | `onUpdated` | 다시 그린 뒤 |
| 해제 전 | `beforeUnmount` (Vue 2: `beforeDestroy`) | `onBeforeUnmount` | 아직 모든 게 동작한다. 정리하기 가장 좋은 때 |
| 해제 | `unmounted` (Vue 2: `destroyed`) | `onUnmounted` | 컴포넌트가 사라진 뒤 |

## 어디서 무엇을 할까

### created (또는 setup): 데이터 준비

- API 호출, 초기 데이터 설정
- DOM이 없으니 `$refs`나 캔버스는 아직 못 쓴다.

```js
created() {
  this.status = '모델 로딩 준비 중...'
  this.fetchModelInfo()
}
```

### mounted: DOM이 필요한 초기화

가장 많이 쓰는 훅이다. Three.js, Chart.js 같은 DOM을 쓰는 라이브러리는 여기서 초기화한다.

```js
mounted() {
  this.initThree()            // 씬, 카메라, 렌더러 생성
  this.loadModel()            // 3D 모델 로드
  window.addEventListener('resize', this.onResize)
  this.animate()              // requestAnimationFrame 루프 시작
}
```

### updated: 조심해서

데이터가 바뀌어 DOM이 다시 그려진 뒤에 불린다. 여기서 또 데이터를 바꾸면 다시 `updated`가 불려서 무한 루프가 될 수 있다. 데이터 변화에 반응하고 싶으면 대부분 `watch`가 더 맞다.

### beforeUnmount: 반드시 정리

이번 문제의 원인이 여기였다. 컴포넌트가 사라져도 직접 등록한 것들은 저절로 사라지지 않는다.

```js
beforeUnmount() {
  cancelAnimationFrame(this.animationId)          // 애니메이션 루프 중단
  window.removeEventListener('resize', this.onResize)
  clearInterval(this.intervalId)                  // 타이머 정리
  this.controls?.dispose()
  this.renderer?.dispose()                        // WebGL 자원 해제
  this.chart?.destroy()                           // 다른 라이브러리도 마찬가지
}
```

`removeEventListener`는 등록할 때와 **같은 함수**를 넘겨야 지워진다. 화살표 함수를 즉석에서 만들어 등록하면 지울 수가 없으니 메서드로 만들어 둔다.

## 하지 말아야 할 것

```js
created() {
  this.$refs.canvas.getContext('2d') // ❌ 아직 DOM이 없어서 에러
},
updated() {
  this.count++                        // ❌ 다시 updated → 무한 루프
},
```

## 그냥 HTML/JS와 비교하면

```js
// 그냥 스크립트: 바로 실행되고, 정리하는 시점이 따로 없다
init()
```

페이지 전체가 바뀌는 사이트에서는 페이지를 떠날 때 브라우저가 다 지워 주니 괜찮다. 하지만 SPA에서는 페이지가 그대로 남아 있고 컴포넌트만 바뀌니까, 정리를 안 하면 계속 쌓인다. 생명주기 훅이 바로 그 "언제 만들고 언제 치울지"를 정하는 자리다.

## 디버깅 팁

순서가 헷갈리면 훅마다 로그를 찍어 보면 바로 보인다.

```js
created()       { console.log('🟢 created: 데이터 준비됨') },
mounted()       { console.log('🔵 mounted: DOM 준비됨', this.$el) },
beforeUnmount() { console.log('🟡 beforeUnmount: 정리 시작') },
unmounted()     { console.log('🔴 unmounted: 완전히 사라짐') },
```
