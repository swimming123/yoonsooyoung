---
title: Vue Router meta로 로그인 여부에 따라 레이아웃 나누기
date: 2025-07-04
summary: 라우트의 meta 필드로 레이아웃과 인증 여부를 표시하고, App.vue 하나에서 레이아웃을 고르고 beforeEach로 막기
tags: [Vue, Vue Router]
---

로그인 화면에는 사이드바와 헤더가 없고, 로그인한 뒤의 화면에는 둘 다 있어야 했다. 레이아웃 파일을 화면마다 감싸지 않고 **파일 하나에서** 처리하고 싶어서 라우트의 `meta` 필드를 썼다.

## meta 필드

`meta`에는 라우트마다 원하는 정보를 자유롭게 담을 수 있다. 권한, 레이아웃 이름, 페이지 제목 같은 것들. ([공식 문서: Route Meta Fields](https://router.vuejs.org/guide/advanced/meta.html))

```ts
const routes = [
  { path: '/login', component: LoginPage, meta: { layout: 'blank' } },
  {
    path: '/',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/posts',
    meta: { requiresAuth: true },
    children: [
      { path: '', component: PostList },
      { path: ':id', component: PostDetail },
    ],
  },
]
```

## App.vue 하나에서 레이아웃 고르기

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'

const route = useRoute()
const layout = computed(() => (route.meta.layout === 'blank' ? BlankLayout : DefaultLayout))
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
```

이렇게 하면 화면 컴포넌트는 레이아웃을 몰라도 되고, 레이아웃을 바꾸고 싶으면 라우트의 `meta`만 고치면 된다.

## to.meta와 to.matched

- `to.matched`: 현재 URL에 매칭된 라우트 레코드를 부모부터 자식까지 배열로 준다. 레코드마다 따로 들여다볼 수 있다.
- `to.meta`: 매칭된 레코드들의 meta를 부모 → 자식 순서로 **합친** 객체다.

그래서 위 예처럼 부모(`/posts`)에만 `requiresAuth`를 달아도 자식(`/posts/3`)의 `to.meta.requiresAuth`가 `true`가 된다.

## beforeEach로 막기

([공식 문서: Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html))

```ts
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})
```

Vue Router 4에서는 `next()`를 부르는 대신 값을 반환하면 된다. 아무것도 반환하지 않으면 그대로 통과, 경로를 반환하면 그쪽으로 보낸다.

`to.matched.some(record => record.meta.requiresAuth)`로 검사해도 결과는 같다. 다만 로그인 페이지 자체에 `requiresAuth`가 걸리면 무한 리다이렉트가 생기니, 로그인 페이지에는 절대 붙이지 않는다.

## TypeScript에서 meta 타입 정하기

meta에 뭐가 들어가는지 타입으로 정해 두면 오타를 막을 수 있다.

```ts
// router.d.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    layout?: 'default' | 'blank'
  }
}
```

## 정리

| 항목 | 설명 |
| --- | --- |
| `meta` | 라우트별 권한, 레이아웃 같은 설정 |
| `to.meta` | 매칭된 모든 레코드의 meta를 합친 값 |
| `to.matched` | 레코드별로 따로 접근 |
| `beforeEach` | `to.meta.xxx`나 `to.matched.some(...)`으로 검사 |
