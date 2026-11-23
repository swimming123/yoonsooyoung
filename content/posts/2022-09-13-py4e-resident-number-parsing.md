---
title: "모두를 위한 파이썬: 주민번호로 정보 추출하기"
date: 2022-09-13
summary: 문자열 인덱싱·슬라이싱 정리와, 재귀 함수 때문에 출력이 쌓이던 주민번호 미션 디버깅
tags: [파이썬, 부스트코스]
---

> 네이버 부스트코스 코칭스터디 리드 부스터로 선정되어 [모두를 위한 파이썬 PY4E 2022](https://www.boostcourse.org/cs122)로 공부했습니다.

## 문자열

문자열 타입과 관련된 개념으로 타입 변환, 인덱싱, `len()` 함수, `for` 루프 활용을 배웠다.

### 1. 문자열 읽기

문자열을 입력받고, 입력받은 값과 타입을 출력할 수 있다.

```python
name = input('아무거나 입력하세요 : ')
print(type(name))
print(name)

# 아무거나 입력하세요 : 안녕하세요   ← 입력
# <class 'str'>
# 안녕하세요                         ← 출력
```

### 2. 문자열 인덱싱

인덱스는 0부터 시작하고, 문자 하나하나에 인덱스가 붙는다. 문자열이 가진 인덱스 범위를 넘는 값을 부르면 오류가 난다.

```python
name = 'boostcourse'

print(name[0])    # b
print(name[0:4])  # boos   [시작 인덱스 : 끝 인덱스 + 1 : 간격]
print(name[-6:])  # course 음수를 넣으면 끝에서부터 센다
```

### 3. len()과 반복문

`len()`은 문자열의 길이를 계산하는 함수다.

```python
name = 'boostcourse'
print(len(name))  # 11

# while을 사용한 반복
index = 0
while index < len(name):
    letter = name[index]
    print(index, letter)
    index = index + 1
# 0 b
# 1 o
# ...
# 10 e

# for를 사용한 반복
for letter in name:
    print(letter)
# b
# o
# ...
# e
```

### 4. 슬라이싱, 합치기, in, 문자열 메서드

```python
# 슬라이싱
myString = 'Monty Python'

print(myString[0:4])   # Mont   끝 인덱스 바로 앞까지 출력
print(myString[6:7])   # P
print(myString[6:20])  # Python 범위를 넘어가도 오류 없이 끝까지
print(myString[:2])    # Mo     처음부터 인덱스 2 앞까지
print(myString[8:])    # thon   인덱스 8부터 끝까지
print(myString[:])     # 전체

# 문자열 합치기: + 로 연결
one = 'hello'
two = '안녕하세요'
print(one + two)  # hello안녕하세요

# in 을 논리 연산자로 쓰기
fruit = 'banana'
print('n' in fruit)    # True
print('m' in fruit)    # False
print('nan' in fruit)  # True
if 'a' in fruit:
    print('Found it!')  # Found it!

# 문자열 라이브러리
greet = 'Hello Bob'
zap = greet.lower()
print(zap)                # hello bob
print(greet)              # Hello Bob (원본은 그대로)
print('Hi There'.lower()) # hi there
print(greet.upper())      # HELLO BOB

# 공백 제거
# lstrip(): 왼쪽 공백 제거
# rstrip(): 오른쪽 공백 제거
# strip():  양쪽 공백 제거

# startswith(): 특정 문자열로 시작하는지 확인
line = 'Please have a nice day'
print(line.startswith('Please'))  # True
print(line.startswith('p'))       # False (대소문자 구분)
```

## 주민번호 미션

이런 문자열 메서드를 가지고, 4주차에는 주민번호를 입력받아 출생 연도, 출생 월, 성별을 출력하는 코드를 짜는 미션이 있었다.

주민번호를 `000000-0000000` 형식으로 입력하면 하이픈 앞 6자리는 생년월일이고, 하이픈 뒤 첫 자리는 성별이다. 1999년생까지는 성별을 1(남), 2(여)로 구분하지만, 2000년생부터는 3(남), 4(여)로 구분한다. 주요 조건은 이 두 가지였고, 나머지는 성별 구분에 대한 오류·예외 처리였다.

생년월일, 성별, 2000년생 이후 구분 같은 조건은 금방 구현했다. 그런데 잘못된 정보를 입력했을 때 다시 입력받는 로직이 단단히 잘못되어 있었다. 테스트할 때 맞는 값 몇 개, 틀린 값 한두 개만 넣어 보고 문제가 없어 보여서 그대로 제출했다.

제출하고 다시 보니 `if-elif-else`가 너무 많고 중첩된 것 같아서, 출력 부분을 함수로 빼 봤다. 그런데 바꾼 코드를 돌려 보니 틀린 값을 입력할수록 출력문(`00년 08월 여자`)이 반복해서 찍혀서 질문방에 올렸다.

처음 작성한 코드는 제대로 돌아갔다. 함수 안에 `if`를 중첩해서 성별 구분과 출력문이 같이 있었다.

```python
while len(num) == 14:
    b = num
    yy = b[:2]
    mm = b[2:4]

    if int(b[:2]) <= 21:
        # 21세기 출생자
        if int(b[7]) == 3:
            print('{}년 {}월 남자'.format(yy, mm))
            break
        elif int(b[7]) == 4:
            print('{}년 {}월 여자'.format(yy, mm))
            break
        else:
            print('잘못 입력하셨습니다. 다시 입력해 주세요')
            break
```

출력문을 따로 빼고 싶어서 고친 코드가 단단히 잘못된 코드였다.

```python
# 마지막에 주민번호를 입력하면 년/월/성별이 두 번 출력되는데, 어느 부분 때문인지 못 찾겠습니다 ㅜ

def check_id(num):
    # 주민번호가 -로 구분되고 길이가 14자리이면 실행
    while True:
        # 2000년생 이전/이후 확인
        if int(num[:2]) <= 21 and (int(num[7]) == 3 or int(num[7]) == 4):
            return printing(num)
        elif int(num[:2]) > 21 and (int(num[7]) == 1 or int(num[7]) == 2):
            return printing(num)
        else:
            print('check id 잘못 입력하셨습니다.')
            num = input('주민등록번호를 - 를 포함하여 다시 입력해 주세요 : ')
            check_id(num)

def printing(num):
    yy = num[:2]
    mm = num[2:4]

    if int(num[7]) == 1 or int(num[7]) == 3:
        print('{}년 {}월 남자'.format(yy, mm))
    elif int(num[7]) == 2 or int(num[7]) == 4:
        print('{}년 {}월 여자'.format(yy, mm))
    else:
        print('ERROR : 출력되지 않음')

reps = int(input("입력하실 사람 수를 입력해 주세요 : "))
for i in range(0, reps):
    num = input('주민등록번호를 - 를 포함하여 입력해 주세요 : ')
    if num[6] == '-' and len(num) == 14:
        check_id(num)
    else:
        print("잘못 입력하셨습니다.")
```

잘못 입력했을 때의 예외 처리를 재귀 함수로 구현했는데, 이게 문제였다.

### 코딩 코치 피드백

1. `while True`를 넣은 이유는?
    - 입력이 틀리면 다시 받아야 하니까, 위로 돌아가서 빙글빙글 돌겠지 하는 생각으로 썼다.
2. 재귀 함수는 `return`으로 불러야 꼬이지 않는다.
    - `else`에서 재귀 함수를 그냥 호출해서 출력문이 중복으로 나오는 것으로 보인다.

```python
# check_id() 에서 return 으로 재귀 호출
def check_id(num):
    # 2000년생 이전/이후 확인
    if int(num[:2]) <= 21 and (int(num[7]) == 3 or int(num[7]) == 4):
        return printing(num)
    elif int(num[:2]) > 21 and (int(num[7]) == 1 or int(num[7]) == 2):
        return printing(num)
    else:
        print('check id 잘못 입력하셨습니다.')
        num = input('주민등록번호를 - 를 포함하여 다시 입력해 주세요 : ')
        return check_id(num)  # 수정된 부분
```

이렇게 이해하려던 참에, 같은 스터디의 엄청난 분이 어마어마한 디버깅과 함께 설명해 주셨다.

> 1. 처음 잘못된 값을 입력합니다. 이걸 a1이라고 하겠습니다.
> 2. 그러면 check_id에서 새로운 num을 입력받습니다. 이 값을 a2라고 하겠습니다.
> 3. 새 값도 틀렸다면 check_id에서 다음 값 a3을 받습니다.
> 4. 이게 n번 반복되다가 올바른 값 an이 입력됐다고 합시다.
> 5. 이때 **값이 두 군데에 저장되는데**, 쉽게 생각하면 지역/전역에 num이 각각 저장된다고 보면 됩니다. (자세히 설명하려면 콜 스택 얘기를 해야 하니, 그런 게 있구나 하면 됩니다.)
> 6. 그러면 올바른 값 an은 check_id에서 출력됩니다. **문제는 an을 입력받은 곳이 check_id(an-1)이라서 그쪽이 가진 num도 an이 된다는 겁니다.** 그래서 check_id(an-1)에서도 출력됩니다.
> 7. 이 때문에 올바른 값을 입력하면 두 번 출력됩니다. 그런데 an-2에는 올바르지 않은 값이 들어 있어서 여기서 다시 else가 동작합니다.
> 8. 또 새 값을 입력받으면 그 값이 맞는지 아닌지에 따라 위 과정이 끝없이 반복됩니다.
> 9. 결국 처음 코드는 잘못된 값을 받을수록 오류 값이 계속 쌓이기 때문에, 메모리를 많이 쓰고 처리하는 데도 시간이 오래 걸리게 됩니다.

4주차의 교훈: 재귀 함수를 잘 쓰자.
