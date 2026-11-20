---
title: "Oracle: 그룹 함수, NULL, RANK, NTILE, CUME_DIST, LISTAGG"
date: 2024-04-02
summary: 집계 함수와 GROUP BY, 쿼리 실행 순서, NVL과 NULL 정렬, 순위·등급·누적 비율 분석 함수, PARTITION BY, 행을 열로 출력하기
tags: [Oracle, SQL]
---

## 그룹 함수

- `MAX()`: 최댓값
- `MIN()`: 최솟값
- `AVG()`: 평균. NULL은 무시
- `SUM()`: NULL이 아닌 숫자만 합계
- `COUNT()`
    - `COUNT(*)`: NULL까지 포함한 행 개수
    - `COUNT(컬럼)`: NULL을 뺀, 값이 있는 행 개수

그룹 함수와 일반 컬럼을 같이 쓰려면 `GROUP BY`로 일반 컬럼을 그룹으로 묶어 줘야 한다.

```sql
SELECT job, MAX(sal)        -- (4)
FROM emp                    -- (1)
WHERE job = 'SALESMAN'      -- (2)
GROUP BY job;               -- (3)
```

## 쿼리 실행 순서

```sql
SELECT job AS 직업, SUM(sal)   -- 5
FROM table_name               -- 1
WHERE job != 'SALESMAN'       -- 2
GROUP BY job                  -- 3  SELECT보다 먼저 실행돼서 '직업'이라는 별칭을 쓸 수 없다
HAVING SUM(sal) >= 4000       -- 4
ORDER BY SUM(sal) DESC;       -- 6
```

## NULL

- `NVL(NULL일 수도 있는 값, 대신할 값)`

```sql
-- 조건에 맞는 행이 없으면 MIN은 NULL → 0으로 바꿔 출력
SELECT NVL(MIN(sal), 0) FROM table_name WHERE 1 = 2;
```

- 오라클은 NULL을 가장 큰 값으로 취급한다. 그래서 내림차순 정렬하면 NULL이 맨 먼저 나온다. (SQL Server는 반대로 NULL을 가장 작은 값으로 취급한다.)
- `NULLS LAST`: ORDER BY에서 NULL을 맨 마지막으로 보내는 문법

## 순위 함수

**RANK() OVER()**

- `RANK() OVER(ORDER BY 컬럼 DESC)`
- 순위를 출력하는 분석 함수
- 1, 1, 3, 4, 5: 공동 1등이 있으면 2등은 건너뛴다.

**DENSE_RANK() OVER()**

- 1, 1, 2, 3, 4: 공동 1등이 있어도 2등이 나온다.

**NTILE()**

- `NTILE(나눌 등급 수)`: 데이터를 등급으로 나눠 준다.
- 예: 4등급이면 1등급(0~25%), 2등급(25~50%), 3등급(50~75%), 4등급(75~100%)

```sql
SELECT name, job, sal, NTILE(4) OVER(ORDER BY sal DESC NULLS LAST) AS 등급
FROM emp
WHERE job IN ('사원', '대리', '과장');
```

**CUME_DIST()**

전체 데이터에서 특정 데이터까지의 누적 비율을 출력한다.

```sql
SELECT CUME_DIST() OVER(ORDER BY sal DESC) AS cume_dist FROM table_name;
```

## LISTAGG()와 WITHIN GROUP()

- `LISTAGG()`: 특정 컬럼의 데이터를 가로로 이어 출력
- `WITHIN GROUP()`: '~ 이내의'라는 뜻. 뒤 괄호 안의 정렬 기준대로 그룹 데이터를 출력

```sql
SELECT deptno,
       LISTAGG(ename, ',') WITHIN GROUP (ORDER BY ename) AS names
FROM emp
GROUP BY deptno;
```

```text
deptno  names
------  ----------------------------------------
10      CLARK,KING,MILLER
20      ADAMS,FORD,JONES,SCOTT,SMITH
30      ALLEN,BLAKE,JACK,JAMES,MARTIN,TURNER,WARD
50      jack
```

## PARTITION BY

```sql
SELECT ename, job, sal, DENSE_RANK() OVER(ORDER BY sal DESC) AS "순위"
FROM emp
WHERE job IN ('ANALYST', 'MANAGER');

-- PARTITION BY: 컬럼별로 따로 순위 매기기
-- (1) 직업별로 (2) 월급이 높은 순서대로 (3) 순위를 매겨 출력
SELECT ename, job, sal, RANK() OVER(PARTITION BY job ORDER BY sal DESC) AS "순위"
FROM emp;
```

## 행(row)을 컬럼으로 출력하기

테이블의 행을 컬럼처럼 가로로 출력하려면 그룹 함수와 DECODE를 같이 쓴다. 부서별 급여 합계를 예로 들면

```sql
SELECT SUM(sal) FROM emp;
-- 35025

SELECT deptno, SUM(sal) FROM emp GROUP BY deptno;
-- 30  12400
-- 20  10875
-- 50  3000
-- 10  8750

-- 부서별 합계를 한 행에 가로로
SELECT SUM(DECODE(deptno, 10, sal)) AS "10",
       SUM(DECODE(deptno, 20, sal)) AS "20",
       SUM(DECODE(deptno, 30, sal)) AS "30"
FROM emp;
-- 10     20      30
-- 8750   10875   12400
```
