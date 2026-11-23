---
title: 다크모드로 바꿔도 이미지가 안 바뀌던 문제 (Pinia + @Watch)
date: 2025-08-06
summary: 클래스 컴포넌트에서 없는 객체를 @Watch로 감시하고 있어서 테마 변경을 감지하지 못한 문제와 Pinia 스토어로 고친 방법
tags: [Vue, Pinia, 다크모드]
---

카테고리 목록에 테마별 아이콘 이미지가 있는데, 다크모드로 바꿔도 이미지가 라이트 모드 그대로였다.

## 원인

- `@Watch('customizer.actTheme')`로 감시하고 있었는데, 정작 그 컴포넌트에는 `customizer`라는 멤버가 없었다. 없는 걸 감시하니 아무 일도 일어나지 않았다.
- 실제 테마 상태는 Pinia 스토어의 `currentTheme`에 있었는데, 이건 감시하지 않고 있었다.

결과적으로 테마가 바뀌어도 화면이 갱신되지 않았다.

## 테마 스토어

```ts
// stores/theme.ts
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentTheme: localStorage.getItem('theme') || 'light',
  }),
  actions: {
    setTheme(theme: string) {
      this.currentTheme = theme
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    },
  },
})
```

- 처음 만들 때 localStorage에서 테마를 읽는다.
- `setTheme` 액션 하나에서 상태, localStorage, DOM 속성을 모두 바꾼다. 여기저기서 localStorage를 직접 건드리지 않게 한 곳에 모았다.

## 컴포넌트에서 감시하기 (클래스 컴포넌트)

```ts
import { useThemeStore } from '@/stores/theme'

@Component
export default class CategoryList extends Vue {
  themeStore = useThemeStore() // 컴포넌트 멤버로 둬야 @Watch가 볼 수 있다
  categories = getCategoryList()

  @Watch('themeStore.currentTheme')
  onThemeChange() {
    this.categories = getCategoryList() // 테마에 맞는 아이콘으로 다시 만든다
  }
}
```

## 핵심

- `@Watch`는 **컴포넌트에 실제로 있는 멤버**를 감시해야 한다. 경로 문자열이 틀려도 에러가 안 나서 찾기 어렵다.
- 스토어를 컴포넌트 멤버로 선언해 두면 반응성이 보장된다.
- `getCategoryList()` 안에서 `useThemeStore()`를 또 불러도 괜찮다. Pinia는 같은 스토어 인스턴스를 돌려준다.

## Composition API라면

훨씬 간단하다. 아예 `computed`로 두면 감시할 필요도 없다.

```ts
const themeStore = useThemeStore()
const categories = computed(() => getCategoryList(themeStore.currentTheme))
```
