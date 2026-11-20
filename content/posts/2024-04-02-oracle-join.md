---
title: "Oracle: JOIN"
date: 2024-04-02
summary: EQUI·NON EQUI·OUTER·SELF·ANSI·NATURAL 조인, 카티션 곱, 한쪽에만 있는 데이터 찾기
tags: [Oracle, SQL]
---

## EQUI JOIN (= INNER JOIN)

- 조인 조건에 `=`를 쓴다.
- 양쪽 테이블에 공통으로 있는 기준 컬럼의 값이 같은 행만 가져온다.
- 한쪽 테이블에서라도 기준 컬럼 값이 NULL이면 결과에 나오지 않는다.

```sql
-- 오라클 문법
SELECT x.컬럼A, x.컬럼B, y.컬럼P
FROM 테이블X x, 테이블Y y
WHERE x.컬럼M = y.컬럼N;

-- ANSI 문법
SELECT 조회할 컬럼
FROM 1번 테이블
INNER JOIN 2번 테이블
ON 조인 조건
WHERE 조회 조건;  -- 선택
```

## NON EQUI JOIN

조인 조건에 `=`가 아닌 다른 비교 연산자(`BETWEEN`, `>`, `<` 등)를 쓰는 조인이다. `=`를 쓰면 EQUI JOIN이다.

## OUTER JOIN

- 두 테이블을 조인할 때, 데이터가 한쪽 테이블에만 있어도 결과에 나온다. 반대쪽 값은 NULL로 채워진다.
- 어느 테이블을 기준으로 하느냐에 따라 LEFT, RIGHT, FULL로 나뉜다. LEFT를 가장 많이 쓴다.
- 기준으로 잡은 테이블의 데이터는 모두 조회한다.

```sql
SELECT 조회할 컬럼
FROM 왼쪽 테이블(1번)
[LEFT | RIGHT | FULL] OUTER JOIN 오른쪽 테이블(2번)
ON 조인 조건
WHERE 조회 조건;  -- 선택
```

```sql
-- LEFT OUTER JOIN: a는 전부, b는 짝이 있는 것만
SELECT a.컬럼1, a.컬럼2, b.컬럼1
FROM a LEFT OUTER JOIN b
ON a.공통컬럼 = b.공통컬럼;

-- RIGHT OUTER JOIN: b는 전부, a는 짝이 있는 것만
SELECT a.컬럼1, a.컬럼2, b.컬럼1
FROM a RIGHT OUTER JOIN b
ON a.공통컬럼 = b.공통컬럼;

-- FULL OUTER JOIN: 양쪽 모두. LEFT 결과와 RIGHT 결과를 UNION한 것과 같다
SELECT a.컬럼1, a.컬럼2, b.컬럼1
FROM a FULL OUTER JOIN b
ON a.공통컬럼 = b.공통컬럼;
```

## SELF JOIN

테이블 하나를 가상으로 두 개인 것처럼 보고 조인한다. 예를 들어 사원 테이블에서 사원과 그 상사를 이어 볼 때 쓴다.

```sql
SELECT x1.컬럼A, x1.컬럼B, x2.컬럼C
FROM 테이블X x1, 테이블X x2
WHERE x1.컬럼A = x2.컬럼C;
```

## ANSI JOIN

- 다른 DBMS에서도 똑같이 쓸 수 있는 표준 조인 문법이다.
- FROM 절에서 `JOIN`을 쓰고, 조인 조건(`ON`)과 WHERE 조건이 분리된다.
- OUTER JOIN 중 FULL JOIN은 오라클 전용 문법이 없어서 ANSI 문법으로만 쓸 수 있다.

```sql
SELECT x.컬럼A, x.컬럼B, y.컬럼C
FROM 테이블X x JOIN 테이블Y y
ON x.컬럼M = y.컬럼N;
```

## NATURAL JOIN

- 두 테이블에서 이름이 같은 열을 기준으로 조인한다. 조인 조건을 따로 쓰지 않는다.
- 이름이 같은 **모든** 열로 조인하기 때문에 의도하지 않은 결과가 나올 수 있다.
- 그럴 때는 NATURAL JOIN보다 `JOIN ... ON`으로 조건을 명시하는 게 좋다.

```sql
SELECT *
FROM emp m
NATURAL JOIN dept d;
```

## 카티션 곱(Cartesian Product)

- 조인 조건 없이 두 테이블의 모든 행을 조합한다.
- 결과 행 수는 두 테이블의 행 수를 곱한 만큼이다.
- 모든 경우의 수가 나오므로 조건절과 함께 써야 하고, 보통은 조인을 쓴다.

```sql
SELECT * FROM table_a, table_b;
```

## 한쪽에만 있는 데이터 찾기 (A - B)

a에는 있고 b에는 없는 데이터만 보고 싶을 때. a를 왼쪽에 두고 LEFT JOIN한 다음, 겹치는 쪽을 빼기 위해 반대쪽 키가 NULL인 행만 남긴다.

```sql
SELECT a.컬럼1, a.컬럼2, b.컬럼1
FROM a LEFT OUTER JOIN b
ON a.공통컬럼 = b.공통컬럼
WHERE b.공통컬럼 IS NULL;
```

참고로 두 결과의 교집합은 `INTERSECT`, 차집합은 오라클에서 `MINUS`로도 구할 수 있다.
