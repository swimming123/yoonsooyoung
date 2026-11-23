---
title: 자바 자료형과 형 변환
date: 2024-02-14
summary: 기본 자료형 크기, 프로모션과 디모션, 문자열을 숫자로 바꾸기, 참조 자료형과 Wrapper 클래스, JVM 메모리 영역
tags: [자바]
---

학원에서 며칠에 걸쳐 나눠 정리했던 자료형 글 세 개(자료형·형 변환, 자료형 222, 자바의 데이터 타입)를 하나로 합쳤다.

## 기본 자료형

| 크기 | 정수형 | 문자형 | 실수형 | 논리형 |
| --- | --- | --- | --- | --- |
| 1바이트 | byte | | | boolean |
| 2바이트 | short | char | | |
| 4바이트 | int | | float | |
| 8바이트 | long | | double | |

- 논리형: `boolean` (true/false 하나만 담지만, 보통 1바이트를 차지한다)
- 문자형: `char` (2바이트)
- 정수형: `byte`(1), `short`(2), `int`(4), `long`(8)
- 실수형: `float`(4), `double`(8)

`String`(문자열)은 기본 자료형이 아니다.

![](/images/posts/java-data-types/01.png)

**아스키 코드** 세 개는 외워 두자: `0`은 48, `A`는 65, `a`는 97.

**상수와 리터럴**

- 상수: 변하지 않는 값
- 리터럴: 프로그램에서 쓰는 모든 숫자, 문자, 논리값

## 형 변환

자바에는 크기와 범위가 다른 자료형이 여러 개 있어서, 데이터를 다루다 보면 자료형을 바꿔야 할 때가 생긴다.

### 프로모션: 묵시적(자동) 형 변환

바이트 크기가 작은 자료형에서 큰 자료형으로 바뀌는 것. 큰 쪽이 더 넓은 범위를 표현할 수 있어서 정보 손실이 없으니, 따로 적지 않아도 자동으로 바뀐다. 예를 들어 `int`에서 `double`로 바꾸는 경우다.

```java
int a = 4;
double d = a;          // int → double

byte bNum = 10;
int iNum = bNum;       // byte → int

int iNum2 = 20;
float fNum = iNum2;    // 정수 → 실수 (덜 정밀 → 더 정밀)

// 연산 중 자동 변환
int iNum3 = 20;
float fNum2 = iNum3;
double dNum;
dNum = fNum2 + iNum3;  // float 결과가 double로 바뀌어 대입됨
```

### 디모션: 명시적(강제) 형 변환

바이트 크기가 큰 자료형에서 작은 자료형으로 바꾸는 것. 정보가 손실될 수 있어서, 괄호 안에 바꿀 자료형을 직접 적어야 한다.

```java
(바꿀 자료형) 값;

double c = 5.4;
int d = (int) c;           // 5

int iNum = 10;
byte bNum = (byte) iNum;   // 큰 자료형 → 작은 자료형

double dNum = 3.14;
int iNum2 = (int) dNum;    // 더 정밀 → 덜 정밀, 3
```

연산 중에도 괄호로 자료형을 적어 형 변환할 수 있다.

- `boolean`은 형 변환이 안 된다.
- `String`은 기본형이 아니라서 형 변환 대상이 아니다.

### 문자열을 기본 자료형으로

문자열은 형 변환 대신 Wrapper 클래스의 메서드로 바꾼다.

| 클래스 | 메서드 | 결과 |
| --- | --- | --- |
| Integer | `Integer.parseInt("123")` | int |
| Double | `Double.parseDouble("1.5")` | double |
| Float | `Float.parseFloat("1.5")` | float |
| Long | `Long.parseLong("123")` | long |
| Short | `Short.parseShort("12")` | short |
| Byte | `Byte.parseByte("1")` | byte |

`parseInt()`는 문자열만 받는다. `double` 값을 `int`로 바꿀 때는 `(int)`로 강제 형 변환해야 한다.

![](/images/posts/java-data-types/02.png)

## 참조 자료형

| 기본 타입(primitive type) | 참조 타입(reference type) |
| --- | --- |
| byte, char, short, int, long, float, double, boolean | 클래스(String, 배열, Map, Set, Object 등), 인터페이스, 열거형(Enum) |
| 실제 값을 변수에 저장 | 메모리 주소를 값으로 가짐. 주소로 객체를 참조 |

```java
int num = 100;              // 값 100을 저장
boolean type = true;

String str = "안녕하세요.";  // str에는 객체의 주소가 들어 있다
```

### Wrapper 클래스

기본 자료형을 감싼 클래스다. `Byte`, `Short`, `Integer`, `Long`, `Float`, `Double`, `Character`, `Boolean`이 있다.

기본 자료형을 클래스로 감싸면 `parseInt()` 같은 유용한 메서드를 쓸 수 있다. 더 중요한 이유는 제네릭(Generic)이다. 제네릭의 타입 매개변수 `T`에는 객체만 들어갈 수 있어서 `int` 같은 기본 자료형은 쓸 수 없다. 이럴 때 `Integer` 같은 Wrapper 클래스를 쓰면, 기본 자료형에도 제네릭을 쓸 수 있다.

참고: [vanslog - 기본 자료형과 참조 자료형](https://vanslog.io/posts/language/java/primitive-type-and-reference-type/)

## JVM 메모리 영역

JVM은 운영체제에서 메모리를 할당받아 Runtime Data Area로 나눠 쓴다.

1. **메서드 영역**: 바이트 코드 파일(`.class`)을 읽은 내용이 저장되는 영역
2. **힙 영역**: 객체가 생성되는 영역. `new`를 쓴 만큼 객체가 생긴다. 객체의 주소는 메서드 영역과 스택 영역의 상수·변수가 참조한다. 가비지 컬렉션 대상
3. **스택 영역**: 후입선출(LIFO). 메서드를 호출할 때마다 생기는 프레임이 저장된다. 메서드 안의 지역 변수가 여기 저장되고, 변수가 선언된 블록 안에서만 push·pop되다가 블록을 벗어나면 사라진다.
4. **PC 레지스터**: 스레드마다 생기며, 현재 실행 중인 명령의 주소를 저장
5. **네이티브 메서드 스택**: 네이티브 코드를 위한 영역

## String

`String` 변수에 같은 리터럴을 넣으면 String 객체를 공유한다.

```java
String name;
name = "수영이";
String name2 = "수영이";
```

"수영이" 객체는 1개만 생기고, `name`과 `name2`는 같은 주소를 가리킨다.

**자주 쓰는 문자열 메서드**

- `charAt()`: 특정 위치의 문자
- `length()`: 길이
- `replace()`: 문자열 바꾸기. 기존 문자열은 그대로 두고 바꾼 새 문자열을 리턴한다.
- `substring()`: 일부 잘라 내기
- `indexOf()`: 위치 찾기
- `split()`: 나누기. 예: `String[] arr = board.split(",");`
