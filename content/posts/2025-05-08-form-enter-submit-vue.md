---
title: form에서 Enter를 누르면 뒤로 가기처럼 될 때
date: 2025-05-08
summary: 입력창에서 Enter를 누르면 페이지가 새로고침되던 이유(폼 암묵적 제출)와 Vue에서 막는 방법, Enter로 다음 입력칸 이동하기
tags: [Vue, HTML, 오류]
---

## 증상

의견 입력창에서 Enter를 누르면 화면이 뒤로 간 것처럼 처음 상태로 돌아갔다.

## 원인

뒤로 가기가 아니라 **폼이 제출되면서 페이지가 새로고침**된 것이었다.

HTML `<form>` 안의 입력창에서 Enter를 누르면 브라우저가 폼을 제출한다(암묵적 제출). 폼 안에 submit 버튼이 있으면 그 버튼을 누른 것처럼 동작한다. 그리고 `<button>`은 `type`을 안 적으면 **기본값이 `submit`**이다. 폼 안에 "추가" 같은 일반 버튼을 `type` 없이 두면 그게 submit 버튼이 된다.

## 해결

### 1. 폼의 기본 제출 막기

```vue
<form @submit.prevent="submitForm">
```

이게 기본이다. 제출 이벤트가 나도 페이지를 새로고침하지 않고 `submitForm`만 실행한다.

### 2. 버튼 type 명시하기

```vue
<button type="button" @click="addOpinion">추가</button>
<button type="submit">저장</button>
```

제출용이 아닌 버튼에는 꼭 `type="button"`을 쓴다.

### 3. 특정 입력창에서 Enter 막기

입력창 하나에서만 Enter로 제출되지 않게 하려면 **keydown**에서 막아야 한다.

```vue
<input v-model="opinion.content" @keydown.enter.prevent />
```

처음에 `@keyup.enter.prevent`를 썼는데 안 막혔다. 폼 제출은 키를 **누를 때(keydown)** 일어나서, 키를 뗄 때(keyup) 막으면 이미 늦다.

폼 전체에서 Enter 제출을 막고 싶으면 폼에 걸 수도 있다. 다만 이러면 `textarea`의 줄바꿈까지 막히니 주의.

```vue
<form @submit.prevent="submitForm" @keydown.enter.prevent>
```

## 덤: Enter로 다음 입력칸으로 이동하기

여러 의견 입력칸을 Enter로 옮겨 다니게 하고 싶었다. `v-for` 안에서 템플릿 ref를 배열로 받으면 된다.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const opinions = ref([{ content: '' }, { content: '' }, { content: '' }])
const inputs = ref<HTMLInputElement[]>([])

function focusNext(index: number) {
  inputs.value[index + 1]?.focus()
}
</script>

<template>
  <form @submit.prevent="submitForm">
    <input
      v-for="(opinion, index) in opinions"
      :key="index"
      ref="inputs"
      v-model="opinion.content"
      @keydown.enter.prevent="focusNext(index)"
    />
    <button type="submit">저장</button>
  </form>
</template>
```

`<script setup>`에서는 `this.$refs`나 `refs` 같은 전역이 없다. 템플릿의 `ref="inputs"`와 같은 이름의 `ref`를 선언하면 Vue가 요소를 채워 준다. `v-for` 안이면 배열로 들어온다. (배열 순서가 항상 화면 순서와 같다는 보장은 없어서, 순서가 중요하면 `:ref="(el) => (inputs[index] = el)"`처럼 함수 ref를 쓰면 확실하다.)

## 정리

- Enter로 페이지가 새로고침되면 폼 제출부터 의심한다.
- `<button>`의 기본 type은 submit이다.
- Enter 제출을 막으려면 `keyup`이 아니라 `keydown`.
