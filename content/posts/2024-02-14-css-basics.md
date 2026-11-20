---
title: CSS 기초
date: 2024-02-14
summary: 스타일 적용 방법과 우선순위, 선택자, 단위, 박스 모델
tags: [CSS]
---

## 스타일 적용 방법

우선순위는 외부 스타일이 가장 낮고, 인라인 스타일이 가장 높다.

- **외부 스타일**: CSS 파일을 따로 만들어 연결

    ```html
    <link rel="stylesheet" href="css파일경로.css">
    ```

- **내부 스타일**: 그 페이지 안에 `<style>`로 작성

    ```html
    <style> /* 코드 작성 */ </style>
    ```

- **인라인 스타일**: 태그의 `style` 속성에 직접 작성

    ```html
    <img src="img/default.jpg" id="imgTarget" style="width:100px;">
    ```

## 선택자

스타일 시트는 CSS로 작성한 코드다.

1. 전체 선택자: `*`
2. id 선택자: `#id`
3. class 선택자: `.className`
4. 후손 선택자: `조상 후손` (띄어쓰기)
5. 자식 선택자: `부모 > 자식`
6. 구조 선택자: `li:first-child { … }`, `li:nth-child(2n) { … }`

## 단위

- 크기: 백분율(%), em, 픽셀(px)

    ![](/images/posts/css-basics/01.png)

- 색상: `rgba(RED, GREEN, BLUE, ALPHA)`. RGB는 0~255, ALPHA(투명도)는 0~1
- URL: `url('경로')`

## 박스 속성

- `margin`, `border`, `padding`, `width`, `height`
- 전체 너비 = width + 2 × (margin + border + padding)
- 전체 높이 = height + 2 × (margin + border + padding)

아래 그림을 보고 어디가 어떤 범위인지 꼭 알아 둬야 한다. 인라인 요소에는 padding 같은 속성이 생각대로 먹지 않기 때문이다.

![](/images/posts/css-basics/02.png)

```css
/* tfoot 안에 있는 th, td 요소를 모두 가운데 정렬하고 패딩 10px 적용
   tfoot의 자식이면 tfoot th, tfoot td 로 쓴다. 얼렁뚱땅 돼서 잊어버릴 것 같으니 적어 둠 */
tfoot th, tfoot td {
    text-align: center;
    padding: 10px;
}
```
