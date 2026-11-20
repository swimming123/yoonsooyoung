---
title: 자바 클래스 기초
date: 2024-02-14
summary: 이름 짓는 규칙, 기본 패키지와 Wrapper 클래스, final 상수, 생성자, 오버로딩과 this, 가변 길이 매개변수, static, 접근 제한자
tags: [자바]
---

학원에서 하나씩 나눠 정리했던 클래스 관련 글 일곱 개(이름 규칙, 기본 패키지·Wrapper 클래스, 상수와 final, 생성자, 오버로딩·this·가변 길이 매개변수, static, 접근 제한자)를 하나로 합쳤다.

## 이름 짓는 규칙

### 클래스 이름

- 명사로 짓는다.
- 대문자로 시작한다.
- 여러 단어를 이어 쓸 때는 각 단어의 첫 글자를 대문자로 쓴다. 이걸 파스칼 케이스(Pascal case)라고 한다.

```java
class Cookie {}
class ChocoCookie {}
```

```text
클래스 영역 {
    <멤버> 멤버 변수, 상수;

    <멤버> 메서드() {
        <지역> 지역 변수: 특정 메서드나 생성자 안에서 선언된 변수
    }
}
```

클래스 영역을 뺀 나머지 영역에서 선언한 변수는 모두 지역 변수다. 지역 변수는 반드시 초기화해야 쓸 수 있다. 초기화하지 않고 쓰면 컴파일 에러가 난다.

### 메서드 이름

- 동사로 짓는다.
- 소문자로 시작한다.
- 여러 단어를 이어 쓸 때는 첫 단어를 뺀 나머지 단어의 첫 글자를 대문자로 쓴다. 이걸 카멜 케이스(camel case)라고 한다.

```java
run();
runFast();
getBackground();
```

### 변수 이름

- 짧지만 의미가 있어야 한다. 이름만 봐도 왜 쓰는 변수인지 알 수 있게 짓는다.
- 순서를 뜻하는 임시 정수 변수는 `i`, `j`, `k`, `m`, `n`을, 문자는 `c`, `d`, `e` 등을 쓴다.
- `_`, `$`를 쓸 수 있지만 첫 글자로 쓰는 건 피하자.

```java
String userName;
float lineWidth;
int i;   // 주로 반복문에서 사용
char c;  // 주로 반복문에서 사용

// 변수 선언
// [자료형] [변수 이름];
// [변수 이름] = 값;        ← 초기화
// [자료형] [변수 이름] = 값;
// 예: 나이를 저장하려면 자료형(int)을 고르고 이름을 정한다.
```

참고: [점프 투 자바](https://wikidocs.net/1936)

## 자바 기본 패키지와 Wrapper 클래스

자바의 기본 패키지는 **`java.lang`** 이다. 이 패키지 안에 있는 것들은 import하지 않아도 쓸 수 있다.

반면 사용자에게 값을 입력받는 `Scanner`는 import해야 쓸 수 있다.

```java
import java.util.Scanner;
```

이렇게 import해야만 쓸 수 있는 패키지는 기본 패키지가 아니다!

### Wrapper 클래스

- 기본 타입 데이터를 객체로 다뤄야 할 때, 기본 타입 데이터를 객체로 바꿔서 작업한다.
- 연산을 위해 만든 클래스가 아니다.
- 인스턴스에 저장된 값을 바꿀 수 없다. 값을 바꾸려면 새 인스턴스를 만들어야 한다.
- `Integer`, `Character`는 기본 타입과 이름이 다르니 주의!

| 기본 타입 | Wrapper 클래스 |
| --- | --- |
| byte | Byte |
| short | Short |
| int | **Integer** |
| long | Long |
| float | Float |
| double | Double |
| char | **Character** |
| boolean | Boolean |

JDK 1.5부터는 박싱과 언박싱이 필요한 곳에서 컴파일러가 자동으로 처리해 준다. 이걸 오토박싱(AutoBoxing), 오토언박싱(AutoUnboxing)이라고 한다.

- **박싱**: 기본 타입 데이터를 Wrapper 클래스의 인스턴스로 바꾸는 과정
- **언박싱**: Wrapper 클래스 인스턴스에 저장된 값을 다시 기본 타입으로 꺼내는 과정

```java
int num = 200;
Integer num1 = 100;  // 오토박싱: 자동으로 객체가 됨
num1 = num;          // 오토박싱
int num3 = num1;     // 오토언박싱
```

## 상수와 final

**상수(constant)** 는 항상 변하지 않는 값이다. 프로그래밍에서는 바뀌면 안 되는 데이터를 담아 두는 수단으로, 초기화한 뒤에는 다시 대입할 수 없다.

**final**은 상수를 만드는 키워드다. 상수 이름은 대문자 스네이크 표기법(`CONSTANT_IMG_PNG`)으로 쓴다.

```java
public class Constant {
    // 클래스 영역에 선언한 변수는 멤버 필드(변수, 상수)
    static final int CONSTANT_NUM = 132;
    static int num = 10;  // 멤버 변수

    public static void otherMethod() {
        // System.out.println("지역(상수) : " + CONSTANT_NUM2);  // 다른 메서드의 지역 상수는 못 씀
        System.out.println("멤버 필드(상수) : " + CONSTANT_NUM);
    }

    public static void main(String[] args) {
        final int CONSTANT_NUM2 = 13222;  // 지역 상수
        // CONSTANT_NUM2 = 2000;  // 에러
        // CONSTANT_NUM = 1000;   // 에러
        num = 2000;               // 일반 변수는 OK
        System.out.println("멤버 필드(상수) : " + CONSTANT_NUM);
        System.out.println("지역(상수) : " + CONSTANT_NUM2);
    }
}
```

**final 변수를 쓰는 이유**

- 실행 중에 값이 바뀌면 안 되는 경우: 실수로 바꾸려 하면 에러가 나서 막아 준다.
- 가독성: 숫자 대신 의미 있는 상수 이름으로 쓸 수 있다.
- 유지보수: 선언한 값 한 곳만 바꾸면 된다.

## 생성자

### 기본 생성자

클래스에는 생성자가 반드시 하나는 있어야 한다. 생성자가 없으면 컴파일할 때 기본 생성자를 자동으로 만들어 준다.

```java
class A {
    public A() {  // ← 컴파일할 때 자동 생성됨
    }
}
```

매개변수가 있는 생성자를 직접 만들었다면, 기본 생성자는 자동으로 만들어지지 않는다. 필요하면 직접 만들어야 한다. 기본 생성자는 셀프입니다.

```java
class A {
    public A(String type) {
        // 매개변수를 받는 생성자가 있으면
    }

    public A() {
        // 기본 생성자는 직접 만들어야 한다.
    }
}
```

- 생성자는 객체를 만들 때 초기화하려고 쓴다.
- 한 번 만든 객체를 생성자로 다시 초기화할 수는 없다. 생성자를 또 부르면 새 객체가 만들어진다.
- 만든 뒤에 값을 바꾸는 건 보통 메서드로 한다.
- 생성자는 처음에 값을 세팅하는 용도로 쓰면 된다.

```java
A ref1 = new A("A타입 호출");  // 생성자 호출 1 → 객체 1
A ref2 = new A("B타입 호출");  // 생성자 호출 2 → 객체 2 (새 객체)
```

## 오버로딩

한 클래스 안에 같은 이름의 메서드가 이미 있어도, 매개변수의 개수나 타입이 다르면 같은 이름으로 메서드를 또 정의할 수 있다.

**조건**

- 메서드 이름이 같아야 한다.
- 매개변수의 개수나 타입이 달라야 한다.
- 리턴 타입만 다른 것은 오버로딩이 아니다.

**왜 할까?** 같은 기능을 하는 메서드를 하나의 이름으로 쓸 수 있다. 메서드 이름이 절약된다!

```java
public Ex3_Member() {}
public Ex3_Member(String name) {}
public Ex3_Member(String name, int age) {}
```

## this 키워드

`this`는 인스턴스 자기 자신이다. 인스턴스가 만들어졌을 때 자기 자신의 메모리 주소를 담고 있다.

- 자기 자신의 메모리를 가리킨다.
- 생성자에서 다른 생성자를 호출할 때 쓴다(`this(...)`).
- 인스턴스 자신의 주소를 반환할 때 쓴다.

```java
public class Ex3_Member {
    // 필드: 인스턴스 변수
    String name;
    int age;

    // 매개변수 이름과 인스턴스 변수 이름이 같을 때
    // this로 인스턴스 변수를 가리켜 매개변수 값을 대입한다.
    public Ex3_Member(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
```

### 생성자에서 this()로 다른 생성자 호출하기

실행 순서는 참고로 알아만 두자.

```java
package ex1;

public class Bicycle {
    String model;
    String color;
    int maxSpeed;

    Bicycle(String model) {                // ← 2
        // this()는 항상 맨 처음에 와야 한다. 앞에 다른 문장이 있으면 오류
        this(model, "은색", 250);            // ← 6 (아래 생성자가 먼저 실행되고 돌아옴)
        System.out.println("test1");        // ← 7
    }

    Bicycle(String model, String color) {
        this(model, color, 250);
    }

    Bicycle(String model, String color, int maxSpeed) {  // ← 3
        System.out.println("test2");        // ← 4
        this.model = model;
        this.color = color;
        this.maxSpeed = maxSpeed;
    }                                       // ← 5

    public String info() {
        return "모델 : " + model + ", 색상 : " + color + ", 최고속도 : " + maxSpeed + "km/h 입니다.";
    }

    public static void main(String[] args) {
        Bicycle ref1 = new Bicycle("부릉이");          // ← 1
        Bicycle ref2 = new Bicycle("따릉이", "초록");
        Bicycle ref3 = new Bicycle("피프틴", "노랑", 15);

        System.out.println(ref1.info());
        System.out.println(ref2.info());
        System.out.println(ref3.info());
    }
}
```

```text
test2
test1
test2
test2
모델 : 부릉이, 색상 : 은색, 최고속도 : 250km/h 입니다.
모델 : 따릉이, 색상 : 초록, 최고속도 : 250km/h 입니다.
모델 : 피프틴, 색상 : 노랑, 최고속도 : 15km/h 입니다.
```

## 가변 길이 매개변수

- 메서드가 가변 길이 매개변수를 가지면, 매개변수 개수와 상관없이 값을 넘길 수 있다.
- 호출할 때 값을 쉼표로 구분해서 원하는 만큼 넘기면 된다.
- 넘긴 값들은 자동으로 배열이 되어 메서드 안에서 쓴다.

```java
접근제한자 리턴타입 메서드이름(자료형... 변수이름) { }

public void stringPrint(String... str) { }
public void intPrint(int... num) { }
```

## static

정적 멤버(static)는 인스턴스(객체)에 속하지 않는다.

- 객체를 만들지 않고 `클래스이름.멤버`로 바로 접근해서 쓸 수 있다.
- 객체들끼리 공유하려는 목적으로 쓴다.
- 정적 멤버는 메서드 영역의 클래스에 고정적으로 위치한다. static이 없는 멤버는 힙 영역에 객체를 만들어서 쓴다.
- `static` 키워드를 붙여 정적 필드와 정적 메서드를 선언한다.
- 정적 블록(static 블록)은 main 메서드보다 먼저 실행된다.

(원래 글에 "추가해야 됨"이라고 적어 둔 부분이다. 메모리 그림과 static 변수·인스턴스 변수를 비교하는 코드는 나중에 덧붙일 예정.)

## 접근 제한자와 기타 제어자

### 패키지와 import

- **package**: 클래스를 만들 때
    - 폴더 개념이다. 다른 패키지에 같은 이름의 클래스가 있어도 괜찮다.
    - 파일 맨 위에 선언한다.
    - 보통 같은 기능을 하는 클래스끼리 묶는다.
- **import**: 다른 패키지의 클래스를 가져다 쓸 때
    - `패키지이름.클래스이름`으로 쓴다. 패키지가 여러 단계면 점으로 이어 쓴다.

### 접근 제한자

| | public | protected | default | private |
| --- | --- | --- | --- | --- |
| 클래스 내부 | ✓ | ✓ | ✓ | ✓ |
| 같은 패키지 | ✓ | ✓ | ✓ | |
| 다른 패키지의 자손 클래스 | ✓ | ✓ | | |
| 전체 | ✓ | | | |

### 기타 제어자

- **abstract**: 반드시 재정의해야 한다. 메서드에 붙인다.
- **final**: 재정의할 수 없다. 변수에 붙이면 다시 대입할 수 없고, 메서드에 붙이면 오버라이딩할 수 없다.
- **생성자 + final 필드**: final 필드는 생성자에서 한 번만 초기화해야 한다.
