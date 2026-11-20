---
title: "Oracle: GROUP BY, ROLLUP, CUBE, GROUPING SETS"
date: 2024-04-02
summary: 그룹별 합계에 전체 합계나 소계를 더해 보는 ROLLUP, CUBE, GROUPING SETS 비교
tags: [Oracle, SQL]
---

## GROUP BY

```sql
SELECT deptno, SUM(sal) FROM emp GROUP BY deptno;
```

```text
30  12400
20  10875
10  8750
```

## ROLLUP()

그룹별 집계 결과에 더해 **전체 합계**를 한 줄 더 붙여 준다. 컬럼을 여러 개 넣으면 왼쪽 컬럼부터 단계별 소계를 만든다.

```sql
SELECT deptno, SUM(sal) FROM emp GROUP BY ROLLUP(deptno);
```

```text
10      8750
20      10875
30      12400
(null)  32025    ← 전체 합계
```

## CUBE()

넣은 컬럼으로 만들 수 있는 **모든 조합**의 소계와 전체 합계를 구한다. 컬럼이 하나면 ROLLUP과 결과가 같고, 이번에 실행했을 때는 전체 합계가 맨 위에 나왔다. (출력 순서는 보장되지 않으니, 순서가 중요하면 ORDER BY를 붙이자.)

```sql
SELECT deptno, SUM(sal) FROM emp GROUP BY CUBE(deptno);
```

```text
(null)  32025    ← 전체 합계
10      8750
20      10875
30      12400
```

## GROUPING SETS()

집계할 컬럼 조합을 직접 골라서 집계한다. `()`는 전체 합계를 뜻한다.

```sql
SELECT deptno, SUM(sal) FROM emp GROUP BY GROUPING SETS(deptno);
-- 30  12400
-- 20  10875
-- 10  8750

SELECT deptno, SUM(sal) FROM emp GROUP BY GROUPING SETS(deptno, ());
-- 10      8750
-- 20      10875
-- 30      12400
-- (null)  32025
```

### 부서별·직업별·전체 합계 한 번에 보기

```sql
SELECT SUM(sal) FROM emp;  -- 32025

SELECT deptno, job, SUM(sal) FROM emp GROUP BY deptno, job;
```

```text
20  MANAGER    2975
30  SALESMAN   8600
30  CLERK      950
20  CLERK      1900
10  PRESIDENT  5000
30  MANAGER    2850
10  CLERK      1300
10  MANAGER    2450
20  ANALYST    6000
```

부서별 합계와 직업별 합계만 보고 싶을 때는 GROUPING SETS가 ROLLUP, CUBE보다 쉽게 원하는 결과를 볼 수 있다.

```sql
SELECT deptno, job, SUM(sal) FROM emp GROUP BY GROUPING SETS((deptno), (job));
```

```text
(null)  SALESMAN   8600
(null)  CLERK      4150
(null)  PRESIDENT  5000
(null)  MANAGER    8275
(null)  ANALYST    6000
30      (null)     12400
20      (null)     10875
10      (null)     8750
```

여기에 전체 합계까지 더하려면 `()`를 추가한다.

```sql
SELECT deptno, job, SUM(sal) FROM emp GROUP BY GROUPING SETS((deptno), (job), ());
```

```text
(null)  SALESMAN   8600
(null)  CLERK      4150
(null)  PRESIDENT  5000
(null)  MANAGER    8275
(null)  ANALYST    6000
10      (null)     8750
20      (null)     10875
30      (null)     12400
(null)  (null)     32025
```
