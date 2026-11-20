---
title: "Oracle: 연결 연산자, DISTINCT, ORDER BY, WHERE, 날짜"
date: 2024-04-02
summary: SELECT 기본 문법과 YY·RR 날짜 형식, TO_DATE·TO_CHAR·MONTHS_BETWEEN·ADD_MONTHS·NEXT_DAY·LAST_DAY·EXTRACT 날짜 함수
tags: [Oracle, SQL]
---

## SELECT 기본

- 연결 연산자: `||`
- 중복 값 제거: `DISTINCT`, `UNIQUE`
- 조건절: `WHERE`
- 정렬: `ORDER BY`

## 날짜 형식

| 형식 | 뜻 |
| --- | --- |
| `YY`, `RR` | 연도 2자리 |
| `MM` | 월 2자리 |
| `MON` | 월의 영문 약어 |
| `DD` | 숫자로 된 일 |
| `DAY` | 요일 |

`YY`와 `RR`은 둘 다 연도 2자리지만, 세기를 다르게 해석한다.

- `'YY/MM/DD'`: 현재 세기로 인식한다. 지금이 2000년대라서 99는 **2099**년이 된다.
- `'RR/MM/DD'`: 현재 연도를 기준으로 가까운 세기로 인식한다. 99는 이전 세기인 **1999**년으로 검색된다.

기본 출력은 `DD-MON-RR` 형식(일-월-연도, 미국·영국식)이다.

## 날짜 관련 함수

- `TO_DATE(날짜 형식의 문자열, '형식')`: 문자열을 지정한 형식의 날짜로 변환
- `TO_CHAR(날짜|숫자, '형식')`: 날짜나 숫자를 지정한 형식의 문자열로 변환
- `MONTHS_BETWEEN(최근 날짜, 예전 날짜)`: 두 날짜 사이의 개월 수

**날짜 형식 바꾸기**

```sql
-- 현재 형식 확인
SELECT * FROM NLS_SESSION_PARAMETERS WHERE parameter = 'NLS_DATE_FORMAT';
-- YY/MM/DD로 변경
ALTER SESSION SET NLS_DATE_FORMAT = 'YY/MM/DD';
-- 다시 확인
SELECT * FROM NLS_SESSION_PARAMETERS WHERE parameter = 'NLS_DATE_FORMAT';
```

## 날짜 계산 예제

```sql
-- RRRR은 연도, MM은 월, DD는 일
SELECT TO_DATE('2020-01-01', 'RRRR-MM-DD') FROM dual;

-- 2020년 1월 1일부터 2022년 6월 1일까지 총 일수: 882
SELECT TO_DATE('2022-06-01', 'RRRR-MM-DD') - TO_DATE('2020-01-01', 'RRRR-MM-DD') AS res FROM dual;

-- 같은 기간의 총 주 수: 126
SELECT ROUND((TO_DATE('2022-06-01', 'RRRR-MM-DD') - TO_DATE('2020-01-01', 'RRRR-MM-DD')) / 7) AS res
FROM dual;

-- 총 개월 수는? 30일, 31일 기준을 정하기 어려울 때
SELECT ename, MONTHS_BETWEEN(SYSDATE, hiredate) FROM emp;

-- ADD_MONTHS: 특정 날짜에 개월 수를 더한 날짜
-- 2024-04-01부터 100개월 후 → 2032-08-01
SELECT ADD_MONTHS(TO_DATE('2024-04-01', 'RRRR-MM-DD'), 100) AS addmonth FROM dual;

-- NEXT_DAY: 특정 날짜 다음에 오는 요일의 날짜
SELECT TO_DATE('2024-04-01', 'RRRR-MM-DD') AS 날짜,
       NEXT_DAY(TO_DATE('2024-04-01', 'RRRR-MM-DD'), '월요일')
FROM dual;

SELECT SYSDATE AS 날짜, NEXT_DAY(SYSDATE, '월요일') FROM dual;

-- 2024-05-05부터 100개월 후에 돌아오는 화요일 → 2032-09-07
SELECT '2024-05-05' AS 날짜,
       NEXT_DAY(ADD_MONTHS(TO_DATE('2024-05-05', 'RRRR-MM-DD'), 100), '화요일')
FROM dual;

-- 오늘부터 100개월 후에 돌아오는 월요일
SELECT SYSDATE AS 오늘, NEXT_DAY(ADD_MONTHS(SYSDATE, 100), '월요일') FROM dual;

-- LAST_DAY: 그 달의 마지막 날짜
-- 2024-05-22가 있는 달의 마지막 날 → 2024-05-31
SELECT TO_DATE('2024-05-22', 'RRRR-MM-DD') AS 날짜,
       LAST_DAY(TO_DATE('2024-05-22', 'RRRR-MM-DD')) AS "마지막 날짜"
FROM dual;

-- 오늘부터 이번 달 말일까지 며칠 남았을까?
SELECT LAST_DAY(SYSDATE) - SYSDATE AS 말일까지 FROM dual;
```

## TO_CHAR 형식 모음

```sql
SELECT SYSDATE, TO_CHAR(SYSDATE, 'yyyy'), TO_CHAR(SYSDATE, 'CC') FROM dual;  -- 연도 4자리, 세기(21)
SELECT SYSDATE, TO_CHAR(SYSDATE, 'YEAR') FROM dual;   -- 영문 표기: TWENTY TWENTY-FOUR
SELECT SYSDATE, TO_CHAR(SYSDATE, 'yy') FROM dual;     -- 연도 2자리
SELECT SYSDATE, TO_CHAR(SYSDATE, 'month'), TO_CHAR(SYSDATE, 'mon') FROM dual;  -- 월
SELECT SYSDATE, TO_CHAR(SYSDATE, 'q') FROM dual;      -- 분기
SELECT SYSDATE, TO_CHAR(SYSDATE, 'd') FROM dual;      -- 요일 번호(1~7, 1: 일요일)
SELECT SYSDATE, TO_CHAR(SYSDATE, 'dy') FROM dual;     -- 요일 한 글자(월)
SELECT SYSDATE, TO_CHAR(SYSDATE, 'day') FROM dual;    -- 요일(월요일)
SELECT SYSDATE, TO_CHAR(SYSDATE, 'dd') FROM dual;     -- 일
SELECT SYSDATE, TO_CHAR(SYSDATE, 'ddd') FROM dual;    -- 1년 중 몇 번째 날
SELECT SYSDATE, TO_CHAR(SYSDATE, 'hh') FROM dual;     -- 시
SELECT SYSDATE, TO_CHAR(SYSDATE, 'mi') FROM dual;     -- 분
SELECT SYSDATE, TO_CHAR(SYSDATE, 'ss') FROM dual;     -- 초
SELECT SYSDATE, TO_CHAR(SYSDATE, 'yyyy"년" mm"월" dd"일" day') FROM dual;  -- 2024년 04월 01일 월요일

-- 숫자 형식: 9는 값이 없으면 출력 안 함, 0은 값이 없어도 0으로 출력
SELECT ename, TO_CHAR(hiredate, 'DAY') AS 요일, TO_CHAR(sal, '999,999') AS 월급
FROM emp
WHERE ename = 'SCOTT';

-- L을 붙이면 지역 통화 기호(원화)로 출력
SELECT ename AS 이름, TO_CHAR(sal * 200, 'L999,999,999') AS 월급 FROM emp;

-- EXTRACT: 날짜에서 연, 월, 일 등을 꺼내기
SELECT ename AS 이름,
       EXTRACT(YEAR FROM hiredate) AS 연도,
       EXTRACT(MONTH FROM hiredate) AS 월,
       EXTRACT(DAY FROM hiredate) AS 일
FROM emp;
```
