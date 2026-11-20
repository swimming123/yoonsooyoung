---
title: "Oracle 시작: SQL 명령문, 자료형, 연산자"
date: 2024-04-02
summary: DQL·DML·DDL·TCL·DCL, 키의 종류, 오라클 자료형, 조건 연산자, SQL과 SQL*Plus 명령어의 차이
tags: [Oracle, SQL]
---

## SQL 명령문의 종류

| 분류 | 뜻 | 명령어 |
| --- | --- | --- |
| DQL | Data Query Language, 질의어 | SELECT |
| DML | Data Manipulation Language, 데이터 조작어 | INSERT, UPDATE, DELETE |
| DDL | Data Definition Language, 데이터 정의어 (자동 커밋됨) | CREATE, ALTER, DROP, RENAME, TRUNCATE |
| TCL | Transaction Control Language, 트랜잭션 처리어 | COMMIT, ROLLBACK, SAVEPOINT |
| DCL | Data Control Language, 데이터 제어어 | GRANT, REVOKE |

## 키의 종류

- 기본키
- 보조키(대체키)
- 외래키
- 복합키

## 자료형

| 자료형 | 설명 |
| --- | --- |
| VARCHAR2(길이) | 가변 길이 문자열. 최대 4000바이트 |
| CHAR(길이) | 고정 길이 문자열. 최대 2000바이트 |
| NVARCHAR2(길이) | 유니코드 가변 길이 문자열 |
| NUMBER(전체 자릿수, 소수점 이하 자릿수) | 숫자 |
| DATE | 날짜(세기, 연, 월, 일, 시, 분, 초) |
| BLOB | 대용량 이진 데이터. 최대 4GB |
| CLOB | 대용량 텍스트 데이터. 최대 4GB |
| BFILE | 외부 파일에 저장된 대용량 이진 데이터. 최대 4GB |

VARCHAR2와 CHAR의 차이를 그림으로 보면 이렇다. 길이를 10으로 잡고 4글자를 넣었을 때

```text
VARCHAR2(10): ■■■■            → 가변 길이, 실제 크기 4
CHAR(10):     ■■■■□□□□□□      → 고정 길이, 크기 10 (남은 칸은 공백으로 채움)
```

## 연산자

| 연산자 | 설명 |
| --- | --- |
| `=` | 같은 조건 검색 |
| `!=`, `<>` | 같지 않은 조건 검색 |
| `>` | 큰 조건 검색 |
| `>=` | 크거나 같은 조건 검색 |
| `<` | 작은 조건 검색 |
| `<=` | 작거나 같은 조건 검색 |
| `BETWEEN a AND b` | a와 b 사이의 범위 값 모두 검색 |
| `IN (a, b, c)` | 괄호 안의 값 중 하나인 조건 검색 |
| `LIKE` | 특정 패턴을 가진 조건 검색 |
| `IS NULL` / `IS NOT NULL` | NULL 검색 / NULL이 아닌 값 검색 |
| `A AND B` | A, B 모두 만족 |
| `A OR B` | A, B 중 하나라도 만족 |
| `NOT A` | A가 아닌 모든 조건 |

## SQL*Plus 명령어

SQL*Plus는 SQL 문을 실행하고 결과를 볼 수 있게 오라클이 제공하는 툴이다.

- 출력 형식 지정 같은 툴 환경을 설정한다.
- SQL 명령문을 저장하거나 편집할 수 있다.
- 컬럼이나 데이터의 출력 형식을 지정한다.

| SQL 문 | SQL*Plus 명령문 |
| --- | --- |
| RDBMS의 ANSI 표준 언어 | SQL 문을 실행하는 오라클의 툴 명령 |
| 여러 줄로 실행 | 한 줄로 실행 |
| 종결 문자 `;` 필요 | 종결 문자 필요 없음 |
| 연결 문자 필요 없음 | 줄을 이을 때 연결 문자 `-` 필요 |
| 키워드 줄여 쓰기 불가 | 키워드 줄여 쓰기 가능 |
| 마지막 명령문을 버퍼에 저장 | 버퍼에 저장하지 않음 |

```text
-- SQL*Plus 명령문: 한 줄, ; 없어도 됨
SQL> show user
USER is "ORA02"

-- SQL 문: 여러 줄, ; 로 끝냄
SQL> select *
  2  from tab
  3  ;
```
