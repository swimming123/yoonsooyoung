---
title: "모두를 위한 파이썬: 컴퓨터가 고른 숫자 맞추기"
date: 2022-09-16
summary: 딕셔너리로 빈도수 세기, 업다운 숫자 맞추기 미션의 조건문 비교, if __name__ == "__main__" 정리
tags: [파이썬, 부스트코스]
---

> 네이버 부스트코스 코칭스터디 리드 부스터로 선정되어 [모두를 위한 파이썬 PY4E 2022](https://www.boostcourse.org/cs122)로 공부했습니다.

## 컬렉션

**컬렉션(Collection)** 은 리스트나 딕셔너리처럼 여러 값을 담는 변수다. 정보 하나가 아니라 여러 개를 저장할 때 쓴다.

- **리스트(list)**: 순서대로 정리된 컬렉션. 데이터를 추가하면 항상 리스트의 '끝'에 붙는다. 0번부터 n-1번 위치까지 n개의 원소가 순서대로 저장된다.
- **딕셔너리(dictionary)**: 순서가 없고, 대신 키(key)가 있다.

### 딕셔너리 만들기

```python
# dict() 또는 purse = {} 로 딕셔너리 생성
purse = dict()

purse['money'] = 12    # 'money' 키에 12 연결
purse['candy'] = 3     # 'candy' 키에 3 연결
purse['tissues'] = 75  # 'tissues' 키에 75 연결

print(purse)           # {'money': 12, 'candy': 3, 'tissues': 75}
print(purse['candy'])  # 3

purse['candy'] = purse['candy'] + 2
print(purse)           # {'money': 12, 'candy': 5, 'tissues': 75}
```

### 연관 배열

키와 값이 연결되는 구조를 **연관 배열(associative array)** 이라고 한다. 접근 방식은 리스트와 비슷하지만, 위치가 아니라 키로 접근한다는 점이 다르다. 여기서 '연관'은 키와 값 사이의 연결 관계를 뜻한다. 자바의 HashMap과 비슷하다.

### 딕셔너리로 빈도수 세기

사람이 이름 빈도를 세는 방식을 떠올려 보자.

1. 새로운 이름을 보면 목록에 추가한다.
2. 추가한 이름 옆에 한 번 나왔다고 표시한다.
3. 이미 목록에 있는 이름이면 기존 숫자에 1을 더한다.
4. 다 보고 나서 표시가 가장 많은 이름을 찾는다.

```python
ccc = dict()
ccc['csev'] = 1
ccc['cwen'] = 1
print(ccc)  # {'csev': 1, 'cwen': 1}

ccc['cwen'] = ccc['cwen'] + 1
print(ccc)  # {'csev': 1, 'cwen': 2}
```

이걸 코드로 일반화하면 이렇다.

1. 이미 저장된 이름인지 확인한다.
2. 저장된 이름이면 1을 더하고, 아니면 이름을 저장하고 1을 넣는다.
3. 최종 결과에서 빈도가 가장 높은 이름을 찾는다.

**in 연산자로 확인하기**

```python
counts = dict()
names = ['csev', 'cwen', 'csev', 'zqian', 'cwen']

for name in names:
    if name not in counts:
        counts[name] = 1
    else:
        counts[name] = counts[name] + 1

print(counts)  # {'csev': 2, 'cwen': 2, 'zqian': 1}
```

**get() 메서드로 줄이기**

`get(키, 기본값)`은 키가 있으면 그 값을, 없으면 기본값을 돌려준다.

```python
counts = dict()
names = ['csev', 'cwen', 'csev', 'zqian', 'cwen']
for name in names:
    counts[name] = counts.get(name, 0) + 1
print(counts)  # {'csev': 2, 'cwen': 2, 'zqian': 1}
```

### split() 메서드

`split()`은 문장을 공백 기준으로 나눠 단어 리스트로 만든다. 인자를 주면 그 문자(예: `,`)를 기준으로 나눈다. 짧은 글이든 긴 글이든 똑같이 동작한다.

```python
line = 'The general pattern to count the words'
print(line.split())
# ['The', 'general', 'pattern', 'to', 'count', 'the', 'words']

line = 'The general pattern to count the words in a line of text is to split the line into words, then loop through the words and use a dictionary to track the count of each word independently.'
words = line.split()
print('Words:', words)
# Words: ['The', 'general', 'pattern', 'to', 'count', 'the', 'words', 'in', 'a', 'line', ...]
```

### items()로 키-값 쌍 꺼내기

```python
jjj = {'chuck': 1, 'fred': 42, 'jan': 100}
print(jjj.items())
# dict_items([('chuck', 1), ('fred', 42), ('jan', 100)])  ← 튜플로 나온다
```

딕셔너리 값은 `딕셔너리[키]`로 가져온다. 예: `print(key, counts[key])`

## 숫자 맞추기 미션

컴퓨터가 랜덤으로 고른 숫자를 사용자가 맞히는 프로그램을 짜는 미션이 있었다. 컴퓨터랑 업다운 술게임을 한다고 생각하면 된다. 사용자가 숫자를 고르면 "최솟값보다 작다/크다" 같은 힌트를 보여 주고, 다시 입력받는 식이다.

각자 코드를 짜고, 제출 전에 서로 피드백하면서 대표 코드를 골랐다. 그런데 같은 조건을 서로 다르게 구현한 부분이 있었다.

> 컴퓨터가 고른 값이 [3, 6, 90]이고 9를 입력했다면, **최솟값도 중간값도 9보다 작은데 모든 경우를 조건문으로 다 달아야 할까요?** 값이 랜덤인데 문제처럼 최솟값·최댓값 힌트와 중간값 힌트를 같이 줄 수 있을까요?
>
> - 입력한 수와 최솟값·중간값·최댓값 사이의 모든 경우를 조건문으로 나누기
> - 맞힌 값을 빼고, 나머지 값보다 입력값이 큰지 작은지만 비교하기

```python
# 팀원 코드: 숫자를 [최소, 중간, 최대] 리스트로 두고 비교해서 힌트 출력
if answer < correct[0]:
    print('Wrong! your answer is under MIN value.\n')
elif answer > correct[2]:
    print('Wrong! your answer is over MAX value.\n')
else:
    print('Wrong! your answer is in range.\n')
```

```python
# 내 코드: 중간값을 기준으로 모든 구간에 조건문 작성
# 개선하고 싶은 점: 더 간단하게 비교하는 방법이 있을지
if guess < min(numbers):
    print('hint!')
    print('***최솟값은 {}보다 큽니다.***'.format(guess))
elif min(numbers) < guess < numbers[1]:
    print('hint!')
    print('***{}은 최솟값보다 크고 중간값보다 작습니다.***'.format(guess))
elif numbers[1] < guess < max(numbers):
    print('hint!')
    print('***{}은 중간값보다 크고 최댓값보다 작습니다.***'.format(guess))
elif max(numbers) < guess:
    print('hint!')
    print('***{}는 최댓값보다 큽니다.***'.format(guess))
else:
    continue
```

생각해 보니 구현하는 사람 스타일에 따라 구간을 잘게 나눠 힌트를 자세히 주느냐, 러프하게 나눠 기본 정보만 주느냐의 차이인 것 같다. 뭔가 결론이 찜찜하게 끝났다.

## if \_\_name\_\_ == "\_\_main\_\_"

조건문을 중첩해서 쓰다 보니 너무 복잡하게 구현한 것 같아서 깔끔하게 쓰고 싶었다. 코딩 코치님이 main 함수를 써 보면 좋겠다고 하셨다.

```python
if __name__ == "__main__":
    # 코드
    # 코드
```

이 코드는 해당 모듈을 import한 경우가 아니라, 인터프리터에서 직접 실행한 경우에만 `if` 아래 코드를 돌리라는 뜻이다. 모듈은 **직접 실행하거나, import해서** 쓸 수 있다.

```python
# executeThisModule.py
def func():
    print("function working")

if __name__ == "__main__":
    print("직접 실행")
    print(__name__)
else:
    print("import되어 사용됨")
    print(__name__)
```

인터프리터에서 직접 실행하면 이렇게 나온다.

```text
$ python3 executeThisModule.py
직접 실행
__main__
```

다른 파일(예: `executor.py`)에서 import해서 쓰면 이렇게 나온다.

```python
import executeThisModule
executeThisModule.func()

# import되어 사용됨
# executeThisModule
# function working
```

`__name__`은 인터프리터가 실행 전에 만들어 두는 전역 변수다. 직접 실행하면 `"__main__"`, import되면 모듈 이름이 들어간다.

참고: [if \_\_name\_\_ == "\_\_main\_\_"은 왜 필요할까?](https://medium.com/@chullino/if-name-main-%EC%9D%80-%EC%99%9C-%ED%95%84%EC%9A%94%ED%95%A0%EA%B9%8C-bc48cba7f720)
