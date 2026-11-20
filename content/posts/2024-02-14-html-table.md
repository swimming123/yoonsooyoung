---
title: HTML 테이블
date: 2024-02-14
summary: table·thead·tbody·tfoot 구조, colspan과 rowspan, 사진을 누르면 정보를 출력하는 테이블 실습
tags: [HTML]
---

## 테이블 태그

- `<table>`: 테이블
- `<thead>`: 제목 영역
- `<tbody>`: 본문 영역
- `<tfoot>`: 아래쪽 영역(페이징, 검색, 버튼 등)
- `<tr>`: 행(row), 가로 방향 한 줄
- `<td>`: 칸(열, column), 세로 방향. 제목 칸은 `<th>`

테이블은 행과 열의 수가 맞아야 한다. 맞지 않으면 칸을 합쳐서 맞춘다.

- `colspan="#"`: 가로 방향으로 # 칸 병합(열 합치기)
- `rowspan="#"`: 세로 방향으로 # 칸 병합(행 합치기)

## 실습: 사진을 누르면 아래에 정보 출력하기

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>exam7_table</title>
<style>
  .timg { width: 100px; }
  #wrap { width: 500px; margin: auto; }
</style>
</head>
<body>
<div id="wrap">
  <div><h1>테이블 태그 구조</h1></div>
  <div id="content">
    <table border="1">
      <thead>
        <tr>
          <th colspan="5">테이블 연습</th>
        </tr>
        <tr>
          <th>번호</th>
          <th>이미지</th>
          <th>제목</th>
          <th>작성자</th>
          <th>날짜</th>
        </tr>
      </thead>
      <tbody>
        <!-- 데이터 영역 시작 -->
        <tr>
          <td>1</td>
          <td><a href="javascript:useImage(1, '1', '사과농장입니다', '윤수영', '2024-02-07')"><img src="img/1.jpg" class="timg"></a></td>
          <td>사과</td>
          <td>수영이</td>
          <td>2024.02.07</td>
        </tr>
        <tr>
          <td>2</td>
          <td><a href="javascript:useImage(2, '2', '바나나농장입니다', '바나나짱', '2024-02-08')"><img src="img/2.jpg" class="timg"></a></td>
          <td>바나나</td>
          <td>수영이 언니</td>
          <td>2024.02.08</td>
        </tr>
        <tr>
          <td>3</td>
          <td><a href="javascript:useImage(3, '3', '오렌지농장입니다', '오렌지짱', '2024-02-09')"><img src="img/3.jpg" class="timg"></a></td>
          <td>오렌지</td>
          <td>수영이 오빠</td>
          <td>2024.02.09</td>
        </tr>
        <tr>
          <td>4</td>
          <td><a href="javascript:useImage(4, '7', '귤농장입니다', '귤귤귤귤', '2024-02-10')"><img src="img/7.jpg" class="timg"></a></td>
          <td>뀰...!</td>
          <td>귤농장 사장님</td>
          <td>2024.02.10</td>
        </tr>
        <!-- 데이터 영역 끝 -->
      </tbody>
      <tfoot>
        <tr>
          <th colspan="5">[1] [2] [3]</th>
        </tr>
        <tr>
          <td colspan="5"><input type="button" value="글작성"></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div id="target">
    <table border="1">
      <thead>
        <tr><th colspan="2">출력</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><img id="imgTarget" style="width:100px;"></td>
          <td id="tagsOutput"></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<script>
  function useImage(no, imgName, title, name, date) {
    var targetImg = document.getElementById("imgTarget");
    targetImg.src = "img/" + imgName + ".jpg";

    var tags = no + "/" + imgName + "/" + title + "/" + name + "/" + date;
    document.getElementById("tagsOutput").innerHTML = tags;
  }
</script>
</body>
</html>
```

![짠](/images/posts/html-table/01.png)
