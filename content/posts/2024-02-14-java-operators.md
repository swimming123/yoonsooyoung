---
title: 자바 연산자와 진법
date: 2024-02-14
summary: 자료형 실습 예제, 자바 연산자 정리, 수업 시간에 틀린 단락 평가 문제, 2·8·10·16진수 변환
tags: [자바]
---

학원에서 정리했던 연산자 글 두 개와 진법 글을 하나로 합쳤다.

## 자료형 실습

![](/images/posts/java-operators/01.png)

![](/images/posts/java-operators/02.png)

여러 자료형으로 `main`, `myTest` 메서드를 정의하고, 각 메서드에서 변수를 선언하고 출력하는 실습이었다.

```java
package exam;

import java.text.SimpleDateFormat;
import java.util.Date;

public class Exam1 {

    public static void main(String[] args) {
        myTest();
        myTest2();
    }

    public static void myTest() {
        // 회원 정보
        String name = "윤수영";
        String phone1 = "010";
        int phone2 = 2222;
        int phone3 = 5678;
        String phoneNumber = phone1 + "-" + phone2 + "-" + phone3;
        char gender = 'W';  // W = W, M = M / 아스키 W = 87, M = 77
        short memberNo = (short) (phone3 - phone2);

        System.out.println("-회원정보-");
        System.out.println("이름 : " + name);
        System.out.println("휴대폰번호 : " + phoneNumber);
        System.out.println("성별 : " + gender);
        System.out.println("회원번호 : " + memberNo);
    }

    public static void myTest2() {
        // 게시글 정보
        byte no = 1;
        String title = "제목입니다.";
        String page = "내용입니다.";
        long time1 = System.currentTimeMillis();
        // MM은 월, mm은 분, SSS는 밀리초
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
        Date date = new Date(time1);
        String timeInFormat = sdf.format(date);

        System.out.println("-게시글 리스트-");
        System.out.println("번호 : " + no);
        System.out.println("제목 : " + title);
        System.out.println("내용 : " + page);
        System.out.println("작성날짜 : " + timeInFormat);
    }
}
```

## 연산자

### 항의 개수에 따라

| 연산자 | 설명 | 예 |
| --- | --- | --- |
| 단항 연산자 | 항이 한 개 | `++sum` |
| 이항 연산자 | 항이 두 개 | `a + b` |
| 삼항 연산자 | 항이 세 개 | `(5 > 3) ? true : false` |

### 대입 연산자

`=`를 기준으로 오른쪽 값을 왼쪽 변수에 대입한다. 예: `int sum = 100;`

### 부호 연산자

- `+`: 값을 양수로 (`+1`)
- `-`: 값을 음수로 (`-1`)

### 산술 연산자

| 연산자 | 기능 | 예 |
| --- | --- | --- |
| `+` | 두 항을 더함 | `5 + 3` |
| `-` | 앞 항에서 뒤 항을 뺌 | `5 - 3` |
| `*` | 두 항을 곱함 | `5 * 3` |
| `/` | 앞 항을 뒤 항으로 나눈 몫 | `5 / 3` → 1 |
| `%` | 앞 항을 뒤 항으로 나눈 나머지 | `5 % 3` → 2 |

### 증가·감소 연산자

| 예 | 동작 |
| --- | --- |
| `a = ++num;` | num에 1을 더한 뒤 a에 대입 |
| `a = num++;` | num을 a에 대입한 뒤 num에 1을 더함 |
| `a = --num;` | num에서 1을 뺀 뒤 a에 대입 |
| `a = num--;` | num을 a에 대입한 뒤 num에서 1을 뺌 |

### 관계(비교) 연산자

`a = 10`일 때

| 연산자 | 기능 | 예 |
| --- | --- | --- |
| `>` | 왼쪽이 크면 true | `a > 3` → true |
| `<` | 왼쪽이 작으면 true | `a < 3` → false |
| `>=` | 왼쪽이 크거나 같으면 true | `a >= 3` → true |
| `<=` | 왼쪽이 작거나 같으면 true | `a <= 3` → false |
| `==` | 두 값이 같으면 true | `a == 10` → true |
| `!=` | 두 값이 다르면 true | `a != 10` → false |

### 논리 연산자

| 연산자 | 기능 | 예 |
| --- | --- | --- |
| `&&` (AND) | 두 항이 모두 참이면 true | `(3 > 2) && (3 > 1)` → true |
| `\|\|` (OR) | 두 항 중 하나라도 참이면 true | `(3 > 2) \|\| (3 > 5)` → true |
| `^` (XOR) | 두 항이 서로 다르면 true | `(3 > 2) ^ (3 > 5)` → true |

### 비트 연산자

![](/images/posts/java-operators/03.png)

## 수업 시간에 틀린 문제

아~ 수업 시간에 문제를 냈는데 틀려 버렸다. 정처기 반납해야 됨.

```java
int a = 10;
int b = 20;
boolean c = ((a += 12) > b) || (a == (b += 2));

System.out.println(a);
System.out.println(b);
System.out.println(c);
```

처음에 생각한 답은 a = 22, b = 22, c = true였는데 틀렸다.

왜? `||`(OR)는 하나만 true여도 true니까!

앞의 `((a += 12) > b)`가 true이고, OR 연산은 하나만 true면 결과가 true로 정해지므로 뒤의 `(a == (b += 2))`는 아예 계산하지 않는다. 그래서 `b += 2`도 실행되지 않는다.

정답: **a = 22, b = 20, c = true**

아래 코드는 정처기 실기 기출문제다. 저걸 풀면서 이 문제가 생각나서 그냥 넣어 봤다.

```java
public class Test {
    public static void main(String[] args) {
        int a = 3, b = 4, c = 3, d = 5;
        if ((a == 2 | a == c) & !(c > d) & (1 == b ^ c != d)) {
            a = b + c;
            if (7 == b ^ c != a) { System.out.println(a); }
            else { System.out.println(b); }
        } else {
            a = c + d;
            if (7 == c ^ d != a) { System.out.println(a); }
            else { System.out.println(d); }
        }
    }
}
```

## 2진수, 8진수, 10진수, 16진수

| 진법 | 쓰는 숫자 | 올림 | 세는 순서 |
| --- | --- | --- | --- |
| 2진수 | 0~1 | 2에서 올림 | 0, 1, 10, 11, 100, 101, 110, ... |
| 8진수 | 0~7 | 8에서 올림 | 0, 1, ..., 7, 10, 11, ..., 17, ... |
| 10진수 | 0~9 | 10에서 올림 | 0, 1, ..., 9, 10, 11, ... |
| 16진수 | 0~9, A~F | 16에서 올림 | 0, 1, ..., 9, A, B, C, D, E, F, 10, 11, ..., 19, 1A, 1B, ... |

### 2진수 → 10진수

2진수 1010을 10진수로 바꾸면

| 1 | 0 | 1 | 0 |
| --- | --- | --- | --- |
| 2³ × 1 | 2² × 0 | 2¹ × 1 | 2⁰ × 0 |

= 8 + 0 + 2 + 0 = **10**

### 8진수 → 10진수

8진수 101을 10진수로 바꾸면

| 1 | 0 | 1 |
| --- | --- | --- |
| 8² × 1 | 8¹ × 0 | 8⁰ × 1 |

= 64 + 0 + 1 = **65**

### 16진수 → 10진수

16진수 20D를 10진수로 바꾸면 (D = 13)

| 2 | 0 | D |
| --- | --- | --- |
| 16² × 2 | 16¹ × 0 | 16⁰ × 13 |

= 512 + 0 + 13 = **525**

### 10진수 → 2진수(8진수, 16진수)

10진수 13을 2진수로 바꾸려면, 몫이 0이 될 때까지 2로 나누고 나머지를 아래에서부터 위로 읽으면 된다.

```text
2 ) 13
2 )  6 ... 1
2 )  3 ... 0
2 )  1 ... 1
      0 ... 1
```

아래부터 읽으면 **1101**. 8진수, 16진수도 8이나 16으로 나누면 똑같다!
