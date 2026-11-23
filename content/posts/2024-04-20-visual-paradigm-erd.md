---
title: 비주얼 패러다임으로 ERD 그리고 SQL 만들기
date: 2024-04-20
summary: 무료 온라인 툴 비주얼 패러다임으로 엔티티를 그리고 오라클용 SQL을 자동 생성하기
tags: [SQL, 도구]
---

[비주얼 패러다임 온라인](https://online.visual-paradigm.com/ko/)은 이런 다이어그램(다른 것도 많다)을 무료로 만들 수 있는 툴이다.

![](/images/posts/visual-paradigm-erd/01.png)

SQL 코드로 바꿔 주기도 해서, 잘 쓰면 편한 기능이 많다.

## 오라클 설정

NUMBER, VARCHAR2 같은 오라클 자료형 설정이 풀렸을 때

1. Tools → DB → Database Configuration…

    ![](/images/posts/visual-paradigm-erd/02.png)

2. 설정!

    ![](/images/posts/visual-paradigm-erd/03.png)

## 테이블 그리기

1. Database Modeling → Entity Relationship
2. 엔티티를 만들고
3. 마우스 오른쪽 버튼 → Generate SQL
4. 비주얼 패러다임이 쿼리를 만들어 준다.

![](/images/posts/visual-paradigm-erd/04.png)

아래는 비주얼 패러다임이 만들어 준 쿼리다.

```sql
-- survey
-- DDL
-- CREATE
CREATE SEQUENCE survey_seq;
CREATE TABLE survey (num number(10) NOT NULL, sub varchar2(150) NOT NULL, code number(10) NOT NULL, sdate date, PRIMARY KEY (num));
CREATE TABLE surveycontent (subtype varchar2(50) NOT NULL, subcode number(10) NOT NULL, surveytitle number(100) NOT NULL, surveycnt number(10) NOT NULL);
ALTER TABLE surveycontent ADD CONSTRAINT FKsurveycont729712 FOREIGN KEY (subcode) REFERENCES survey (num);
-- DROP
DROP SEQUENCE survey_seq;
DROP TABLE survey CASCADE CONSTRAINTS;
DROP TABLE surveycontent CASCADE CONSTRAINTS;

-- DML
-- select
SELECT num, sub, code, sdate FROM survey;
SELECT subtype, subcode, surveytitle, surveycnt FROM surveycontent;
-- insert
INSERT INTO survey(num, sub, code, sdate) VALUES (?, ?, ?, ?);
INSERT INTO surveycontent(subtype, subcode, surveytitle, surveycnt) VALUES (?, ?, ?, ?);
-- update
UPDATE survey SET sub = ?, code = ?, sdate = ? WHERE num = ?;
UPDATE surveycontent SET subtype = ?, subcode = ?, surveytitle = ?, surveycnt = ? WHERE ;
-- delete
DELETE FROM survey WHERE num = ?;
```

`surveycontent`는 기본키가 없어서 UPDATE 문의 WHERE 조건이 비어 있다. 기본키를 정해 두면 이 부분도 채워진다.

## 상세 설정 화면

**엔티티 상세**

![](/images/posts/visual-paradigm-erd/05.png)

**속성 상세**

![](/images/posts/visual-paradigm-erd/06.png)

**관계 상세**

![](/images/posts/visual-paradigm-erd/07.png)

**1:1 속성 상세**

![](/images/posts/visual-paradigm-erd/08.png)

**제약 조건**

![](/images/posts/visual-paradigm-erd/09.png)

![](/images/posts/visual-paradigm-erd/10.png)
