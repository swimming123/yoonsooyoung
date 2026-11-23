---
title: "Oracle: DECODE()와 CASE"
date: 2024-04-02
summary: 쿼리 안에서 if-else처럼 쓰는 DECODE 함수와, 더 다양한 비교가 가능한 CASE 식
tags: [Oracle, SQL]
---

## DECODE()

쿼리 안에서 if-else처럼 쓸 수 있는 함수다.

```sql
DECODE(기준 컬럼, 값1, 결과1, 값2, 결과2, ..., 그 외 결과) AS 컬럼이름
```

```sql
-- deptnum이 10이면 300, 20이면 400, 나머지 부서는 모두 0
SELECT name, num, DECODE(deptnum, 10, 300, 20, 400, 0) AS 보너스 FROM table_name;
```

## CASE

DECODE 기능을 확장한 식이다.

```sql
CASE [기준값] WHEN 조건1 THEN 결과1
              WHEN 조건2 THEN 결과2
              ELSE 그 외 결과
END
```

- DECODE는 기준 컬럼 값과 조건이 같은지(`=`)만 비교해서 일치하면 다른 값으로 바꾼다.
- CASE는 그 밖에도 산술, 논리, 관계 연산 같은 다양한 비교를 할 수 있다.
- `[기준값]`을 생략하면 WHEN 절에서 조건식으로 직접 비교할 수 있다.

```sql
-- 월급이 3000 이상이면 500, 2000 이상이면 300, 1000 이상이면 200, 나머지는 0
SELECT name, job, sal,
       CASE WHEN sal >= 3000 THEN 500
            WHEN sal >= 2000 THEN 300
            WHEN sal >= 1000 THEN 200
            ELSE 0
       END AS bonus
FROM table_name
WHERE job IN ('BOSS', 'NOBI');
```
