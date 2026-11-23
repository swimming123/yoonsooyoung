---
title: "JAVA: 자바의 동작 원리"
date: 2022-12-16
summary: 소스 코드가 컴파일되어 class 파일이 되고 JVM에서 실행되기까지
tags: [자바]
---

지난번에 만든 Hello World 프로그램으로 자바가 어떻게 동작하는지 살펴봅니다.

우리는 콘솔에 "Hello World!"를 출력하는 프로그램(애플리케이션)을 만들었고, 그 기능을 위해 아래 **소스**를 작성했습니다.

```java
public class HelloWorldApp {
    public static void main(String args[]) {
        System.out.println("Hello World!");
    }
}
```

이것을 소프트웨어가 만들어지는 근원이라는 뜻에서 **소스(Source)**, 기호·부호라는 뜻에서 **코드(Code)** 라고 부릅니다. 의미를 전달하는 약속이라는 점에서 **언어(Language)** 라고도 하고요.

자바 소스가 프로그램으로 동작하는 과정은 이렇습니다.

![](/images/posts/java-how-it-works/01.png)

1. `.java` 파일로 소스 코드를 작성합니다.
2. **컴파일**을 거쳐 **JVM(Java Virtual Machine, 자바 가상 머신)** 이 알아들을 수 있는 `.class` 파일로 바뀝니다. 이클립스는 자바 파일을 저장할 때 컴파일해서 class 파일로 저장합니다.
3. 이클립스에서 실행 버튼을 누르면 JVM이 class 파일을 읽어 들이고, 그대로 컴퓨터를 동작시킵니다.

출처: 네이버 부스트코스 쉽게 배우는 자바1
