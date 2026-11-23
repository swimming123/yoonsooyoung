---
title: "JAVA: 자바 프로그래밍이란?"
date: 2022-12-16
summary: 자바의 특징, 온라인 편집기, 맥에서 JDK 설치 확인과 이클립스 설치
tags: [자바]
---

## 프로그래밍 언어, 자바

자바(Java)는 1991년 제임스 고슬링(James Gosling)이 만든 프로그래밍 언어입니다. **"한 번 작성하면 어디서든 실행된다"** 는 목표로 만들어져서, 자바로 작성한 소프트웨어는 자바가 설치된 컴퓨터라면 어디서든 실행할 수 있습니다.

프로그래밍 언어 인기 순위인 [TIOBE Index](https://www.tiobe.com/tiobe-index/)에서도 늘 상위권에 있는 언어예요.

## 온라인 편집기

자바를 실행하려면 여러 프로그램을 설치해야 하지만, 웹에서 간편하게 실행해 볼 수 있는 온라인 편집기도 있습니다. 종류가 여러 가지인데, 이 수업에서는 [JDoodle](https://www.jdoodle.com/)을 썼습니다.

## 맥에 자바 설치하기

### JDK란

JDK(Java Development Kit)는 자바 소프트웨어 개발에 필요한 여러 도구를 묶은 것입니다. 자바는 JDK 형태로 설치합니다.

설치 방법은 계속 바뀌는 것 같으니, 그때그때 검색해서 내 환경에 맞는 방법을 찾아 설치하면 된다!

### 설치 확인

Spotlight(Command + Space)에서 **Terminal**을 입력해 터미널을 열고, 자바 버전을 확인합니다.

```bash
java -version
```

![](/images/posts/java-what-is-java/01.png)

이렇게 버전이 나오면 설치에 성공한 것입니다. 이어서 자바 컴파일러 버전도 확인합니다.

```bash
javac -version
```

![](/images/posts/java-what-is-java/02.png)

컴파일러 버전까지 잘 나오면 설치 완료입니다.

## 이클립스 설치하기

자바를 설치했으면 이제 IDE를 설치합니다. 이클립스 말고도 비주얼 스튜디오 코드, 인텔리제이 등 다양한 IDE가 있어요.

이클립스는 자바로 프로그램을 쉽게 만들 수 있게 도와주는 도구로, 많은 자바 개발자가 써 왔습니다. 이런 도구를 IDE(Integrated Development Environment, 통합 개발 환경)라고 합니다.

[이클립스 홈페이지](https://www.eclipse.org/)에서 **Download** 버튼을 눌러 받고, 설치 화면대로 슈슉 넘기면 설치 끝.

출처: 네이버 부스트코스 쉽게 배우는 자바1
