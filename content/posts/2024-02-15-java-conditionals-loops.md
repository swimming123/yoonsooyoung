---
title: 자바 조건문과 반복문
date: 2024-02-15
summary: if-else, else if, switch, while, do-while, for, break 라벨과 continue, 최댓값 찾기와 try-catch
tags: [자바]
---

학원에서 나눠 정리했던 조건문·반복문 글 다섯 개(if-else, 조건문, 반복문, while·do-while, 최댓값 찾기)를 하나로 합쳤다.

## 조건문이란?

주어진 조건에 따라 다른 문장을 실행하게 하는 문장이다.

예를 들어 "만약 20세 이상이면 주류 구매가 가능합니다"에서는 20세라는 나이가 조건이 된다.

```text
만약 (20세 이상이면) {
    주류 구매가 가능합니다.
}
```

## if-else

- `if`: 주어진 조건이 참일 때 실행되는 코드 블록
- `else`: `if`의 조건이 거짓일 때 실행되는 코드 블록

```java
if (조건식) {
    실행문;  // 조건식이 true일 때
} else {
    실행문;  // 조건식이 false일 때
}
```

조건이 여러 개면 `else if`를 쓴다.

```java
if (조건식1) {
    실행문;  // 조건식1이 true일 때
} else if (조건식2) {
    실행문;  // 조건식2가 true일 때
} else if (조건식3) {
    실행문;  // 조건식3이 true일 때
} else {
    실행문;  // 모든 조건이 false일 때
}

실행문;  // if-else if-else 다음에 실행됨
```

조건식은 비교 연산자와 논리 연산자로 만든다.

| 비교 연산자 | 뜻 |
| --- | --- |
| `x < y` | x가 y보다 작다 |
| `x > y` | x가 y보다 크다 |
| `x == y` | x와 y가 같다 |
| `x != y` | x와 y가 같지 않다 |
| `x >= y` | x가 y보다 크거나 같다 |
| `x <= y` | x가 y보다 작거나 같다 |

| 논리 연산자 | 뜻 |
| --- | --- |
| `x && y` | x와 y 모두 참이어야 참 |
| `x \|\| y` | 둘 중 하나라도 참이면 참 |
| `!x` | x가 거짓이면 참 |

### 예제: 두 숫자 비교하기

```java
package ex2;

import java.util.Scanner;

public class Exam {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("숫자1 : ");
        int numA = Integer.parseInt(sc.nextLine());
        System.out.print("숫자2 : ");
        int numB = Integer.parseInt(sc.nextLine());

        String res;
        if (numA == numB) {
            res = "두 숫자는 같습니다.";
        } else {
            res = "두 숫자는 다릅니다.";
        }

        String res1;
        if (numA > numB) {
            res1 = numA + "가 큽니다.";
        } else {
            res1 = numB + "가 큽니다.";
        }

        System.out.println("입력한 값은 " + numA + "값과 " + numB + "값 입니다.");
        System.out.println(res);
        System.out.println(res1);
    }
}
```

`numA`가 100, `numB`가 100이면 `numA == numB`가 true라서 `if` 블록이 실행되고, "두 숫자는 같습니다."가 출력된다. 반대로 `numA`가 100, `numB`가 0이면 false라서 `else` 블록이 실행되고, "두 숫자는 다릅니다."가 출력된다.

## switch-case

```java
switch (조건) {
    case 값1:
        수행문1;
        break;   // break를 만나면 switch를 빠져나간다.
    case 값2:
        수행문2;
        // break가 없으면 다음 break가 나올 때까지 아래 case도 계속 수행된다.
    case 값3:
        수행문3;
        break;
    default:
        수행문;
}
```

`switch`에 값으로 쓸 수 없는 자료형: `boolean`, 실수형, `long`

### 실습 과제

- **가위바위보**: `Math.random()`으로 컴퓨터 값을 정하고, 0·1·2를 입력받아 게임 진행. 누가 무엇을 냈고 누가 이겼는지 출력
- **학점 계산기**: 이름과 점수를 입력하면 이름, 점수, 학점을 출력
- **버스 요금 계산기**: 나이와 현금/카드를 입력하면 요금을 출력

| 나이 | 카드 | 현금 |
| --- | --- | --- |
| 8세 미만 | 무료 | 무료 |
| 8세 ~ 14세 미만 | 500원 | 500원 |
| 14세 ~ 20세 미만 | 900원 | 1,000원 |
| 20세 이상 | 1,500원 | 1,800원 |
| 75세 이상 | 무료 | 무료 |

## 반복문

### while

```java
while (조건식) {
    실행문1;  // 조건식이 true인 동안 계속 실행
}
실행문2;     // 조건식이 false가 되면 while을 빠져나와 실행
```

### do-while

```java
do {
    실행문1;          // 일단 한 번 실행하고
} while (조건식);     // 그다음 조건식이 참인지 판별
실행문2;
```

- `do`: 일단 한 번 실행한다.
- `while` 조건이 true면 반복, false면 종료한다.

### for

```java
for (초기화식; 조건식; 증감식) {
    수행문;
}

int sum = 0;
for (int i = 0; i < 3; i++) {  // i가 0부터 3이 되기 전까지 1씩 증가하며 실행
    sum += i;
}                               // i가 3이 되는 순간 for를 빠져나옴
```

## 반복문 + 조건문: 메뉴 입력받기

```java
MemberDaoV2 ref = new MemberDaoV2();  // 여러 명의 데이터를 저장하는 객체

Scanner sc = new Scanner(System.in);
ext: while (true) {  // ext: break 라벨. break ext가 실행되면 이 while이 종료된다.
    System.out.print("메뉴:1,2,3");
    int menu = Integer.parseInt(sc.nextLine());
    switch (menu) {
        case 1:
            System.out.print("num:");
            int num = Integer.parseInt(sc.nextLine());
            System.out.print("name:");
            String name = sc.nextLine();
            System.out.print("age:");
            int age = Integer.parseInt(sc.nextLine());
            ref.addMember(num, name, age);
            break;
        case 2:
            System.out.println(ref.listMember());
            break;
        case 3:
            System.out.println("종료");
            break ext;
        default:
    }
}
```

### break, continue, break 라벨 비교

```java
Scanner sc = new Scanner(System.in);
ext: while (true) {
    System.out.print("메뉴:1,2,3,4");
    int menu = Integer.parseInt(sc.nextLine());
    switch (menu) {
        case 1:
            System.out.println("case 1번");
        case 2:
            System.out.println("case 2번");
            continue;
        case 3:
            System.out.println("case 3번");
            break;
        case 4:
            System.out.println("case 4번");
            break ext;
        default:
            System.out.println("1, 2, 3, 4번 말고 다른 거 눌렀네요");
    }
}
```

| 입력 | 출력 | 다음 동작 |
| --- | --- | --- |
| 1 | case 1번, case 2번 | case 1에 break가 없어서 case 2까지 실행되고, continue로 while 처음으로 |
| 2 | case 2번 | continue로 while 처음으로 |
| 3 | case 3번 | break로 switch를 빠져나와 다시 while 반복 |
| 4 | case 4번 | `ext` 라벨이 붙은 while 종료 |

![](/images/posts/java-conditionals-loops/01.png)

## 가장 큰 수 찾기와 try-catch

### max 알고리즘

```java
private static void max() {
    Scanner sc = new Scanner(System.in);
    while (true) {
        try {
            System.out.println("정수 3개의 최댓값 구하기.");
            System.out.print("a : ");
            int a = Integer.parseInt(sc.nextLine());
            System.out.print("b : ");
            int b = Integer.parseInt(sc.nextLine());
            System.out.print("c : ");
            int c = Integer.parseInt(sc.nextLine());
            System.out.println("입력한 a, b, c 중에서 가장 큰 수 출력");

            int max = a;                   // 1. max에 a 저장
            if (b > max) { max = b; }      // 2. b가 max보다 크면 max에 b 저장
            if (c > max) { max = c; }      // 3. c가 max보다 크면 max에 c 저장
            System.out.println("최댓값 : " + max);
        } catch (Exception e) {
            System.out.println("종료");
            break;
        }
    }
}
```

- 입력받은 수: `a`, `b`, `c`
- 큰 수를 담아 둘 임시 변수: `max`
- `max`에 일단 `a`를 넣고, 나머지를 하나씩 비교하며 더 크면 바꿔 넣는다. 가장 작은 수 찾기도 부등호만 바꾸면 된다.

### Math.max() 사용하기

```java
Scanner sc = new Scanner(System.in);
while (true) {
    try {
        System.out.println("정수 3개의 최댓값 구하기.");
        System.out.println("종료 조건은 숫자가 아닌 값 입력");
        System.out.print("a : ");
        int a = Integer.parseInt(sc.nextLine());
        System.out.print("b : ");
        int b = Integer.parseInt(sc.nextLine());
        System.out.print("c : ");
        int c = Integer.parseInt(sc.nextLine());
        int res = Math.max(Math.max(a, b), c);
        System.out.println("최댓값 : " + res);
    } catch (Exception e) {
        System.out.println("종료");
        break;
    }
}
```

- `Math.max(a, b)`: a와 b 중 큰 수를 반환
- `Math.max(Math.max(a, b), c)`: a와 b 중 큰 수를 구하고, 그걸 c와 다시 비교

### try-catch

예외 처리 문법이다. `try` 안의 문장을 실행하다가 예외가 생기면 `catch`가 실행된다. 위 예제에서는 숫자가 아닌 값을 입력하면 `parseInt()`에서 예외가 나서 "종료"를 출력하고 반복을 끝낸다.
