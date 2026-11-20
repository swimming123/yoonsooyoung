---
title: 삭제 확인 버튼 공통 모듈 만들기 (Vue 플러그인 → composable)
date: 2025-11-06
summary: 화면마다 복사해 쓰던 SweetAlert2 삭제 확인 코드를 전역 플러그인으로 묶고, 다시 composable과 버튼 컴포넌트로 정리한 과정
tags: [Vue, TypeScript, Vuetify]
---

관리자 화면마다 "정말 삭제하시겠습니까?" 확인 창을 띄우는 코드가 복사돼 있었다. 문구도 조금씩 다르고 버튼 색도 제각각이라 공통 모듈로 묶었다.

## 처음: 화면마다 있던 코드

```ts
async deleteData() {
  const result = await Swal.fire({
    title: '확인',
    html: '정말 삭제하시겠습니까?<br/>저장된 모든 데이터가 삭제됩니다.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '삭제',
    cancelButtonText: '취소',
    confirmButtonColor: '#d33',
  })
  if (!result.isConfirmed) return

  const res = await service.deleteItem(this.item)
  if (res?.success) {
    await Swal.fire({ title: '확인', text: '삭제됐습니다.', icon: 'success' })
    this.$router.replace('/admin/items')
  } else {
    Swal.fire({ title: '확인', text: res?.message, icon: 'error' })
  }
}
```

## 1단계: 전역 플러그인

클래스 컴포넌트(`vue-facing-decorator`)를 쓰는 프로젝트라서 `this.$buttons`로 부를 수 있게 전역 프로퍼티로 만들었다.

```ts
// plugins/buttons.ts
import type { App } from 'vue'
import Swal from 'sweetalert2'

export interface ButtonsModule {
  confirmDelete: (message?: string) => Promise<boolean>
}

const DEFAULT_MESSAGE = '정말 삭제하시겠습니까?\n저장된 모든 데이터가 삭제됩니다.'

export default {
  install(app: App) {
    const buttons: ButtonsModule = {
      async confirmDelete(message = DEFAULT_MESSAGE) {
        const result = await Swal.fire({
          icon: 'warning',
          title: '확인',
          text: message,
          showCancelButton: true,
          confirmButtonText: '삭제하기',
          cancelButtonText: '취소',
          confirmButtonColor: '#d33',
        })
        return result.isConfirmed
      },
    }
    app.config.globalProperties.$buttons = buttons
  },
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $buttons: ButtonsModule
  }
}
```

```ts
// main.ts
app.use(buttons)
```

```ts
// 화면
if (!(await this.$buttons.confirmDelete())) return
```

고친 점이 몇 가지 있다.

- 처음엔 `await Swal.fire().then(...)` 안에서 플래그 변수를 바꾸고 그걸 반환했는데, `result.isConfirmed`를 바로 반환하면 된다.
- 메시지를 `html` 옵션으로 넣고 있었다. 호출하는 쪽에서 서버 데이터(항목 이름 등)를 섞어 넣으면 XSS가 될 수 있어서, 기본은 `text`로 바꾸고 줄바꿈은 `\n`으로 넣었다. (SweetAlert2의 `text`는 줄바꿈을 그대로 보여 준다.)
- TypeScript 타입 확장은 `declare module '@vue/runtime-core'`로 돼 있었는데, 지금 Vue 공식 문서는 `declare module 'vue'`를 권장한다.
- 화면 쪽에 "플러그인이 없으면 SweetAlert2를 직접 호출"하는 대체 코드가 있었는데, 플러그인은 `main.ts`에서 항상 등록되니 필요 없어서 지웠다.

## 2단계: composable

새로 만드는 화면은 Composition API라서 `this`가 없다. 같은 기능을 composable로도 만들었다. 오히려 이쪽이 더 단순하다.

```ts
// composables/useConfirm.ts
import Swal from 'sweetalert2'

export function useConfirm() {
  async function confirmDelete(message = DEFAULT_MESSAGE) {
    const { isConfirmed } = await Swal.fire({ /* 위와 같은 옵션 */ })
    return isConfirmed
  }
  return { confirmDelete }
}
```

## 3단계: 삭제 버튼 컴포넌트

확인 → API 호출 → 성공/실패 알림까지 매번 똑같으니 버튼 컴포넌트로 묶었다. 화면은 "무엇을 지울지"만 넘기면 된다.

```vue
<!-- components/common/DeleteButton.vue -->
<script setup lang="ts">
import Swal from 'sweetalert2'
import { ref } from 'vue'
import { useConfirm } from '@/composables/useConfirm'

const props = defineProps<{
  onDelete: () => Promise<{ success: boolean; message?: string }>
  message?: string
}>()
const emit = defineEmits<{ deleted: [] }>()

const { confirmDelete } = useConfirm()
const loading = ref(false)

async function handleClick() {
  if (!(await confirmDelete(props.message))) return
  loading.value = true
  try {
    const res = await props.onDelete()
    if (res.success) {
      await Swal.fire({ title: '확인', text: '삭제됐습니다.', icon: 'success' })
      emit('deleted')
    } else {
      Swal.fire({ title: '확인', text: res.message, icon: 'error' })
    }
  } catch {
    Swal.fire({ title: '오류', text: '삭제 중 오류가 발생했습니다.', icon: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-btn color="error" variant="outlined" :loading="loading" @click="handleClick">삭제하기</v-btn>
</template>
```

```vue
<DeleteButton
  :on-delete="() => service.deleteItem(item)"
  @deleted="router.replace('/admin/items')"
/>
```

`loading`으로 버튼을 잠가 두면 두 번 눌러서 삭제 요청이 두 번 가는 것도 막을 수 있다.

## 정리

- 여러 화면에 복사된 코드는 문구와 동작이 조금씩 어긋나기 시작할 때가 공통화할 때다.
- 클래스 컴포넌트에서는 전역 프로퍼티 플러그인, Composition API에서는 composable이 자연스럽다.
- 확인 창 메시지는 `html` 대신 `text`로. 서버 데이터가 섞이면 XSS가 될 수 있다.
