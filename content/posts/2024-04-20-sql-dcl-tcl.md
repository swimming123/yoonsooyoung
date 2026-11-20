---
title: "SQL 기본: DCL, TCL"
date: 2024-04-20
summary: 권한을 주고 회수하는 GRANT·REVOKE, 트랜잭션을 제어하는 COMMIT·ROLLBACK·SAVEPOINT
tags: [SQL]
---

## DCL: Data Control Language

데이터 제어어. 데이터베이스에 접근하고 객체를 쓸 수 있도록 권한을 주고 회수하는 명령어다.

### GRANT: 권한 부여

```sql
GRANT 시스템권한 [, 시스템권한 ... | 롤]
TO 유저 [, 유저 ... | 롤 ... | PUBLIC]
[WITH ADMIN OPTION];
```

- 시스템 권한 예: `CREATE SESSION`, `CREATE TABLE`, `CREATE SEQUENCE`, `CREATE VIEW`, `CREATE PROCEDURE`, `CREATE ROLE`, `ALTER USER`, `DROP USER`
- `PUBLIC`: 시스템 권한이나 역할을 모든 사용자에게 줄 때 쓰는 옵션
- `WITH ADMIN OPTION`: 권한을 받은 사용자도 그 권한을 다른 사용자나 역할에게 줄 수 있게 하는 옵션

### REVOKE: 권한 회수

```sql
REVOKE 시스템권한 FROM 유저;
```

## TCL: Transaction Control Language

트랜잭션 제어어. 논리적인 작업 단위를 묶어서, DML로 바꾼 결과를 작업 단위(트랜잭션)별로 제어하는 명령어다.

| 명령어 | 설명 |
| --- | --- |
| COMMIT | 정상적으로 끝난 작업을 데이터베이스에 영구 반영 |
| ROLLBACK | 작업 시작 전 상태로 되돌림 |
| SAVEPOINT | 저장점. ROLLBACK과 함께 써서 이 지점까지만 되돌릴 수 있음 |

`CREATE`, `ALTER`, `DROP`, `RENAME`, `TRUNCATE` 같은 DDL은 실행하면 자동으로 커밋된다(AUTO COMMIT).

```sql
COMMIT;
...
SAVEPOINT c1;
...
SAVEPOINT c2;
...
ROLLBACK;          -- 마지막 COMMIT 지점으로 되돌림
ROLLBACK TO c1;    -- c1 위치로 되돌림
ROLLBACK TO c2;    -- c2 위치로 되돌림
```
