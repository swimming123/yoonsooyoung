---
title: HTML 개발 환경 준비하기
date: 2024-02-13
summary: 자바 17, 이클립스 J2EE, Tomcat 10 설치와 연동, 프로젝트 import, tern 자동 완성 플러그인 설치
tags: [HTML, 개발환경]
---

학원에서 나눠 썼던 "개발 환경 설치"와 "tern repository 설치" 글을 합쳤다.

## 개발 환경 설치

- 개발 환경: 이클립스, Tomcat, 자바 개발 도구
- 자바 개발 도구(JDK) 다운로드와 설치: Java 17
- 이클립스: J2EE(Enterprise Java) 버전. 함께 설치한 플러그인
    - AnyEdit Tools
    - DevStyle
    - EditBox
    - Quick Search for Eclipse
- Tomcat 10 다운로드·설치 후 이클립스에 연동

첫 HTML 페이지.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="EUC-KR">
<title>ex1_hello.html</title>
</head>
<body>
<h1>나의 첫번째 HTML5 페이지 입니다.</h1>
</body>
</html>
```

### File System으로 export한 프로젝트를 import하기

![](/images/posts/html-dev-environment/01.png)

![](/images/posts/html-dev-environment/02.png)

![](/images/posts/html-dev-environment/03.png)

## tern 설치하기

tern은 자바스크립트 명령어 자동 완성 플러그인이다. [GitHub(angelozerr/tern.java)](https://github.com/angelozerr/tern.java)에서 받는다.

1. Help → Install New Software

    ![](/images/posts/html-dev-environment/04.png)

2. Add… → Name은 아무거나 → Archive…에서 받은 zip 파일 선택. **압축을 풀지 않는다!**

    ![](/images/posts/html-dev-environment/05.png)

    ![](/images/posts/html-dev-environment/06.png)

3. 보안 경고가 뜰 수 있지만 계속 설치한다.
4. Trust Selected

    ![](/images/posts/html-dev-environment/07.png)

내 프로젝트에서 써 보려는데...

![](/images/posts/html-dev-environment/08.png)

tern 오류가 났다. 찾아본 글들:

- [[Eclipse] 이클립스 더 스마트하게 활용하기](https://jaymunsh.tistory.com/30)
- [[Eclipse] content assist(자동완성기능)이 사용이 안될 때... (총정리)](https://goodlife-coding.tistory.com/entry/Eclipsecontent-assist%EC%9E%90%EB%8F%99%EC%99%84%EC%84%B1%EA%B8%B0%EB%8A%A5%EC%9D%B4-%EC%82%AC%EC%9A%A9%EC%9D%B4-%EC%95%88%EB%90%A0-%EB%95%8C-%EC%B4%9D%EC%A0%95%EB%A6%AC)

헐, 엄청 쉽게 해결. **Ctrl + Space 2연타.**
