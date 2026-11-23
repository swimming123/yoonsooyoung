---
title: Vuetify v-chip variant 차이
date: 2025-08-19
summary: v-chip에 bg 클래스를 줬는데 배경이 안 칠해졌던 이유와 flat, text, outlined, tonal, elevated 차이
tags: [Vue, Vuetify]
---

`v-chip`에 `bg-black` 클래스를 줬는데 배경은 안 칠해지고 글자색만 남았다. 알고 보니 `variant`를 `text`로 쓰고 있었다. `text`는 배경을 없애는 스타일이라 배경 클래스가 먹히지 않는다.

## variant 종류

| variant | 배경 | 테두리 | 그림자 | 느낌 |
| --- | --- | --- | --- | --- |
| `flat` | 있음 | 없음 | 없음 | 보통 생각하는 "배경색 칠해진 칩" |
| `text` | 없음 | 없음 | 없음 | 글자색만 강조 |
| `outlined` | 없음 | 있음 | 없음 | 테두리만 |
| `tonal` | 연하게 | 없음 | 없음 | 색을 살짝 깔아 주는 톤 (v-chip 기본값) |
| `elevated` | 있음 | 없음 | 있음 | 배경 + 그림자 |

배경을 칠하고 싶으면 `flat`이나 `elevated`를 쓰고, 색은 `color` 속성으로 주는 게 깔끔하다.

## 실제로 쓴 코드

서비스 상태를 색으로 보여 주고, 클릭하면 상태를 새로 불러오는 칩이다.

```vue
<v-chip
  v-if="!route.meta.auth"
  class="ml-3 text-body-2"
  variant="tonal"
  :color="overallStatus.color"
  title="상태 새로고침"
  label
  @click="refreshStatus"
>
  애플리케이션 서비스
  <RefreshIcon stroke-width="1.5" size="18" />
</v-chip>
```

`tonal`로 두니 상태 색(초록, 노랑, 빨강)이 연하게 깔려서 너무 튀지 않으면서도 상태가 잘 보였다.
