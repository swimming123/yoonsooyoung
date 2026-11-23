---
title: "JAVA: Hello World!"
date: 2022-12-16
summary: 이클립스에서 자바 프로젝트를 만들고 Hello World를 출력하기까지
tags: [자바]
---

이클립스까지 설치했으면 이클립스를 실행해 봅니다.

![](/images/posts/java-hello-world/01.png)

**Window → Show View** 메뉴에서 **Navigator**를 눌러 켭니다.

![](/images/posts/java-hello-world/02.png)

## 자바 프로젝트 만들기

**Create a Java Project**를 눌러 자바 프로젝트를 만듭니다.

![](/images/posts/java-hello-world/03.png)

- 프로젝트 이름: **HelloWorld**
- **Location**: 앞으로 실습할 작업 공간 아래에 같은 이름의 폴더
- **Project layout**: 첫 번째 옵션(소스와 클래스 파일을 같은 프로젝트 폴더에 두기)

![](/images/posts/java-hello-world/04.png)

**Finish**를 눌러 프로젝트를 만듭니다.

## 자바 파일 만들기

Navigator 뷰에서 HelloWorld 프로젝트를 마우스 오른쪽 버튼으로 클릭하고 **New → File**을 누릅니다.

![](/images/posts/java-hello-world/05.png)

![](/images/posts/java-hello-world/06.png)

파일 이름에 **HelloWorldApp.java**를 입력하고 **Finish**를 누른 다음, 아래처럼 입력하고 저장합니다.

```java
public class HelloWorldApp {
    public static void main(String args[]) {
        System.out.println("Hello World!!");
    }
}
```

수업 소스 코드는 [GitHub](https://github.com/egoing/java1)와 [GitLab](https://gitlab.com/egoing/java1)에서 받을 수 있습니다.

![](/images/posts/java-hello-world/07.png)

저장해도 Project Explorer에는 변화가 없지만, Navigator 뷰를 보면 같은 이름의 클래스 파일이 생긴 걸 볼 수 있습니다.

![](/images/posts/java-hello-world/08.png)

## 실행하기

편집기 안에서 마우스 오른쪽 버튼을 누르고 **Run As → 1 Java Application**을 눌러 실행합니다. 이클립스 위쪽 툴바의 실행 버튼을 눌러도 됩니다.

![](/images/posts/java-hello-world/09.png)

실행하면 아래쪽 콘솔 뷰에 이렇게 출력됩니다.

출처: 네이버 부스트코스 쉽게 배우는 자바1
