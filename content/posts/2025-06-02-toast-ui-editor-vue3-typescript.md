---
title: Toast UI Editor를 Vue 3 + TypeScript에 붙이기
date: 2025-06-02
summary: 어드민에 마크다운 에디터를 넣으면서 겪은 인스턴스 관리, HTML 변환, 이미지 업로드 훅, TypeScript 전환
tags: [Vue, TypeScript, 에디터]
---

어드민 페이지에 글 작성 에디터가 필요해서 서베이를 하다가 [Toast UI Editor](https://ui.toast.com/tui-editor)를 붙여 봤다.

블로그를 찾아보면 에디터를 띄우고 끝나는 글이 많아서 생각보다 도움이 안 됐다. 처음 쓰다 보니 어떤 함수가 있는지도 몰랐다. 그래서 직접 부딪히면서 알게 된 것들을 정리한다.

## 1. 에디터 인스턴스 만들기

Vue 3 + Vite 환경에서는 에디터를 직접 렌더링해야 했다.

- DOM이 준비된 뒤에 만들어야 하니 `onMounted()` 안에서 인스턴스를 생성한다.
- 개발 중 HMR(핫 리로드)로 컴포넌트가 다시 마운트되면 인스턴스가 중복으로 생길 수 있다. 기존 인스턴스가 있으면 `destroy()`하고 새로 만든다.
- 컴포넌트가 사라질 때도 `destroy()`해 준다.

```ts
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'

const el = ref<HTMLDivElement>()
const editor = shallowRef<Editor>()

onMounted(() => {
  editor.value?.destroy()
  editor.value = new Editor({
    el: el.value!,
    height: '600px',
    initialEditType: 'markdown',
    previewStyle: 'vertical',
  })
})

onBeforeUnmount(() => editor.value?.destroy())
```

`document.querySelector('#editor')` 대신 템플릿 ref를 쓰면 같은 컴포넌트를 두 번 띄워도 안전하다. 에디터 인스턴스는 Vue가 깊게 반응형으로 감쌀 필요가 없어서 `shallowRef`에 담았다.

## 2. 내용 꺼내기: 마크다운과 HTML

에디터에서는 두 가지 형태로 내용을 꺼낼 수 있다.

```ts
const markdown = editor.value!.getMarkdown()
const html = editor.value!.getHTML()
```

처음에는 마크다운을 HTML로 바꾸는 함수가 없는 줄 알고 `getMarkdown()` 결과를 [marked](https://marked.js.org/)로 변환했다. 알고 보니 에디터에 `getHTML()`이 있었다. 다만 DB에 마크다운만 저장해 두고 다른 화면(에디터가 없는 곳)에서 보여 줄 때는 marked 같은 파서가 여전히 쓸모 있다.

```ts
import { marked } from 'marked'

const html = marked.parse(markdownFromDb)
```

사용자가 쓴 내용을 HTML로 화면에 넣을 때는 XSS를 막기 위해 DOMPurify 같은 걸로 한 번 걸러 주는 게 좋다.

## 3. 자주 만난 에러

```
Uncaught RangeError: Applying a mismatched transaction
```

- **원인**: 에디터 인스턴스가 아직 초기화되지 않았거나, 중복으로 초기화됐을 때 난다. HMR 때 `destroy()` 없이 새로 만들면 자주 봤다.
- **해결**
    - 메서드를 부르기 전에 인스턴스가 있는지 확인
    - `onMounted()` 안에서 중복 초기화 막기
    - HMR, 언마운트 때 기존 인스턴스 `destroy()`

## 4. 이미지 업로드: addImageBlobHook

기본 설정에서는 에디터에 이미지를 넣으면 base64 문자열이 본문에 그대로 들어간다. 그러면 DB에 저장되는 글이 엄청 커진다.

`hooks.addImageBlobHook`을 쓰면 업로드한 파일을 Blob/File 객체로 받을 수 있다. 이걸 서버에 먼저 올리고, 돌려받은 URL만 본문에 넣으면 된다. ([API 문서](https://nhn.github.io/tui.editor/latest/ToastUIEditorCore), [관련 이슈](https://github.com/nhn/tui.editor/issues/2199#issuecomment-1098771891))

```ts
editor.value = new Editor({
  el: el.value!,
  hooks: {
    addImageBlobHook: async (blob, callback) => {
      const form = new FormData()
      form.append('image', blob)
      const { data } = await api.post('/uploads/', form)
      callback(data.url, 'image')
    },
  },
})
```

## 5. TypeScript로 바꾸기

에디터를 TypeScript로 옮기는데 처음부터 되는 게 없었다. import부터 변수 선언까지 다 막혔다. [TypeScript 핸드북의 기본 타입](https://www.typescriptlang.org/ko/docs/handbook/2/basic-types.html)부터 다시 봤다.

- `@toast-ui/editor`는 타입 정의를 같이 제공해서, `import Editor from '@toast-ui/editor'`로 가져오면 옵션과 메서드 자동 완성이 된다.
- 템플릿 ref는 `ref<HTMLDivElement>()`처럼 요소 타입을 적어 줘야 `el.value`를 넘길 수 있다.
- 클래스 컴포넌트(`vue-facing-decorator`)를 쓰는 프로젝트에서도 `onMounted`를 import해서 같이 쓸 수 있었다.

라이브러리를 Vue와 함께 쓸 때는 "구현할 기능 + vue 3 + typescript"로 검색하면 쓸 만한 예제가 꽤 나온다.

## 정리

- 외부 JS 라이브러리 인스턴스는 `onMounted`에서 만들고 `onBeforeUnmount`에서 정리한다.
- 에디터에는 `getMarkdown()`과 `getHTML()`이 둘 다 있다.
- 이미지는 `addImageBlobHook`으로 서버에 올리고 URL만 본문에 넣는다.

다음에는 DB를 만들어서 어드민 페이지에 저장까지 붙여 볼 생각이다.
