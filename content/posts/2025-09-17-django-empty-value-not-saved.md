---
title: Django에서 빈 값이 저장되지 않을 때
date: 2025-09-17
summary: 수정 쿼리를 조립할 때 if obj.get(...)으로 검사해서 빈 문자열이 건너뛰어졌던 문제와, 문자열로 SQL을 이어 붙이면 생기는 위험
tags: [Django, Python, SQL, 오류]
---

## 증상

LDAP 연결을 해제하면서 사용자 정보의 LDAP 관련 값(아이디, 이름, 그룹)을 빈 문자열로 바꾸려고 했다. 로그에는 "업데이트 완료"가 찍히는데 DB에는 예전 값이 그대로 남아 있었다.

```
DEBUG query : update users set updated_at = now(), is_ldap = 'N' where id = %s
DEBUG db 업데이트 완료 {'id': 71, 'is_ldap': 'N', 'ldap_name': '', 'ldap_id': '', 'ldap_group': ''}
```

쿼리를 보면 `is_ldap`만 들어가 있고 나머지 세 컬럼은 아예 빠져 있다.

## 원인

수정 쿼리를 이렇게 조립하고 있었다.

```python
if obj.get('ldap_id'):
    query += " , ldap_id = '" + str(obj.get('ldap_id')) + "' "
if obj.get('ldap_name'):
    query += " , ldap_name = '" + str(obj.get('ldap_name')) + "' "
```

파이썬에서 빈 문자열 `''`은 **거짓(falsy)**이다. 그래서 `if obj.get('ldap_id'):`는 "값이 없을 때"뿐 아니라 "빈 문자열로 바꾸고 싶을 때"도 건너뛴다. `0`, `False`, `[]`도 마찬가지다.

## 해결

"키가 없음(바꾸지 않음)"과 "빈 값으로 바꿈"을 구분해야 한다.

```python
if obj.get('ldap_id') is not None:   # 키가 아예 없거나 None일 때만 건너뜀
    ...
# 또는
if 'ldap_id' in obj:
    ...
```

## 그런데 이 코드의 더 큰 문제

값을 문자열로 그대로 이어 붙이고 있다. 값에 `'`가 들어가면 쿼리가 깨지고, 악의적인 값이면 **SQL 인젝션**이 된다. ("MySQL 에러 모음" 글에서 실제로 따옴표 하나 때문에 쿼리가 깨진 사례를 정리했다.)

컬럼 이름은 허용 목록으로 고르고, 값은 자리표시자(`%s`)로 넘기는 게 맞다.

```python
UPDATABLE = ['name', 'is_ldap', 'ldap_id', 'ldap_name', 'ldap_group']

def update_user(obj):
    sets, params = ['updated_at = now()'], []
    for col in UPDATABLE:
        if col in obj:
            sets.append(f'{col} = %s')   # 컬럼 이름은 목록에 있는 것만
            params.append(obj[col])      # 값은 드라이버가 안전하게 넣는다
    params.append(obj['id'])
    with conn.cursor() as cur:
        cur.execute(f"UPDATE users SET {', '.join(sets)} WHERE id = %s", params)
```

Django ORM을 쓸 수 있다면 `User.objects.filter(id=...).update(**fields)`가 가장 간단하다.

## 정리

- `if 값:`은 빈 문자열, 0, False도 거른다. "있는지"를 보려면 `is not None`이나 `in`을 쓴다.
- SQL에 값을 문자열로 이어 붙이지 말고 파라미터로 넘긴다.
