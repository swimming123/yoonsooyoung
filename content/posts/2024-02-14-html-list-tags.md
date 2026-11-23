---
title: HTML 목록 태그, 함수, 하이퍼링크
date: 2024-02-14
summary: 목록·정의 목록 태그, script 위치에 따른 함수 동작, 사용자 정의 함수, 앵커 링크와 블록·인라인 요소
tags: [HTML]
---

학원에서 나눠 썼던 "목록 태그, 함수"와 "정의 목록" 글을 합쳤다.

## 1. 목록 태그

### 정의 목록

사전 같은 역할을 한다.

```text
Liebe        ← 용어
  1. 사랑, 애정, 자애   ← 설명
  2. 연애, 애정
```

- `dl`: 정의 목록(definition list)
- `dt`: 정의할 용어(definition term)
- `dd`: 용어 설명(definition description)

```html
<dl>
  <dt>Liebe</dt>
  <dd>사랑, 애정, 자애</dd>
  <dd>연애, 애정</dd>
</dl>
```

## 2. 내장 함수

`<script>` 태그 안에서 동작한다.

**script를 head에 두면 body의 id를 쓰는 함수가 동작하지 않는 이유**

- head에 있으면: 함수 생성 → 함수 호출 → HTML 생성 → id 정의. 함수를 호출하는 시점에는 아직 id가 없다.
- body 끝에 있으면: HTML 생성 → id 정의 → 함수 생성 → id 찾음 → 함수 호출 성공

**alert()**: 경고 창을 띄운다.

**블로킹 함수**: 그 함수 실행이 끝나야 다음 코드를 실행한다. 예를 들어 `alert()`를 실행하면, 경고 창을 닫기 전까지 body 내용이 보이지 않는다.

![](/images/posts/html-list-tags/01.png)

## 3. 사용자 정의 함수

```javascript
function fn(args1, args2) {  // ← input
    return value;            // ← output
}

// 함수는 만들고 나서 호출해야 동작한다.
myFunc();  // 함수 호출
```

## 4. 하이퍼링크와 레이아웃

링크를 타고 이동하는 페이지를 서브 페이지라고 한다.

**상대 경로**: `../`는 상위 경로

**블록 요소**: header, wrap, nav, content, footer처럼 한 줄을 통째로 차지하는 레이아웃 영역

**인라인 요소**: 줄 안에서 내용만큼만 차지하는 요소

![](/images/posts/html-list-tags/02.png)

![](/images/posts/html-list-tags/03.png)

**CSS 선택자**

- id 값: `#id`
- class 값(집합): `.className`

### 앵커 태그 예제

같은 페이지 안에서 `#id`로 이동하는 링크를 만들어 봤다. (원래는 실제 뉴스 기사와 사진을 붙여 넣어 연습했는데, 여기서는 자리 표시 문구로 바꿨다.)

```html
<html>
<head>
  <title>ex3_hrefDemo</title>
  <meta charset="UTF-8">
  <style>
    #wrap { width: 500px; margin: auto; }
    img { width: 400px; }
    .news { width: 500px; text-align: center; }
  </style>
</head>
<body>
<div id="wrap">
  <h1 id="top">앵커 태그 데모</h1>
  <a href="#news1">News1</a>
  | <a href="#news2">News2</a>
  | <a href="#news3">News3</a>
  <hr>

  <div class="news">
    <h2 id="news1">뉴스 1</h2>
    <img src="news1.jpg" alt="뉴스 1 사진">
    <p>뉴스 1 본문...</p>
    <hr>
  </div>

  <div class="news">
    <h2 id="news2">뉴스 2</h2>
    <img src="news2.jpg" alt="뉴스 2 사진">
    <p>뉴스 2 본문...</p>
    <hr>
  </div>

  <div class="news">
    <h2 id="news3">뉴스 3</h2>
    <img src="news3.jpg" alt="뉴스 3 사진">
    <p>뉴스 3 본문...</p>
  </div>

  <div class="news">
    <a href="#top"><h1>TOP</h1></a>
  </div>
</div>
</body>
</html>
```

같은 `id`는 한 페이지에 하나만 쓸 수 있어서, 여러 번 쓰는 뉴스 영역은 `class`로 바꿨다.
