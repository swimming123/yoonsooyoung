---
title: JavaScript 바이트 단위로 말줄임 하기
date: 2025-06-23
summary: 한글과 영어가 섞인 제목을 글자 수가 아니라 바이트 기준으로 자르고 ...을 붙이기, 그리고 CSS로 할 수 있는 방법
tags: [JavaScript, Vue]
---

카드 목록의 제목이 길면 잘라서 `...`을 붙여야 했다. 그런데 글자 수로 자르면 한글 제목은 너무 길고 영어 제목은 너무 짧았다. 한글은 영문보다 화면에서 폭을 더 차지하니까, **바이트 수**로 자르면 비슷한 길이가 된다.

## 처음 코드

```ts
truncateText(text: string, maxBytes: number): string {
  let result = ''
  let byteCount = 0
  for (const char of text) {
    byteCount += new Blob([char]).size
    if (byteCount > maxBytes) {
      result += '...'
      break
    }
    result += char
  }
  return result
}
```

```vue
<RouterLink :to="{ name: 'detail', params: { id: item.id } }">
  {{ truncateText(item.name, 45) }}
</RouterLink>
```

- `for...of`는 문자 단위(코드 포인트)로 돌아서 이모지도 반으로 잘리지 않는다.
- `new Blob([char]).size`는 그 문자를 UTF-8로 만들었을 때의 바이트 수다. 영문·숫자는 1바이트, 한글은 3바이트, 이모지는 4바이트.

## 다듬은 코드

동작은 맞지만 글자마다 `Blob`을 만드는 건 무겁다. 목록이 길면 렌더링할 때마다 수백 번 만든다. `TextEncoder`를 쓰거나, 코드 포인트 값으로 바이트 수를 바로 계산할 수 있다.

```ts
function utf8Bytes(char: string): number {
  const code = char.codePointAt(0)!
  if (code <= 0x7f) return 1
  if (code <= 0x7ff) return 2
  if (code <= 0xffff) return 3
  return 4
}

export function truncateByBytes(text: string | undefined, maxBytes: number, ellipsis = '...'): string {
  if (!text) return ''
  let bytes = 0
  let result = ''
  for (const char of text) {
    bytes += utf8Bytes(char)
    if (bytes > maxBytes) return result + ellipsis
    result += char
  }
  return text // 다 들어가면 ... 없이 그대로
}
```

- `undefined`가 들어와도 깨지지 않게 했다. (처음 코드는 `item?.name`으로 넘기면서 함수에서는 처리하지 않았다.)
- 템플릿에서 매번 부르지 말고 `computed`로 목록을 한 번 가공해 두면 더 좋다.

## CSS로 충분할 때도 많다

"카드 폭에 맞춰서 넘치면 ..."이 목적이라면 CSS가 더 정확하다. 실제 글자 폭을 기준으로 자르기 때문이다.

```css
/* 한 줄 */
.title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 여러 줄 */
.title-2lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

바이트 자르기는 DB 컬럼 길이(바이트 기준)에 맞추거나, 정해진 바이트 안에 문자열을 넣어야 할 때 쓰고, 화면 표시용은 CSS를 먼저 생각하자.
