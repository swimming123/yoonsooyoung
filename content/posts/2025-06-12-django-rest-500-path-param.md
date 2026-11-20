---
title: "Django REST 500 에러: URL 경로, HTTP 메서드, 파라미터"
date: 2025-06-12
summary: 경로 파라미터 자리에 변수 이름을 그대로 보내서 난 500 에러를 고치면서 정리한 경로 파라미터, 메서드, 요청 본문
tags: [Django, REST, 오류]
---

상세 조회 API를 호출했더니 500 에러가 났다. 원인은 생각보다 단순했는데, 고치면서 URL 경로 파라미터, HTTP 메서드, 요청 본문을 한 번에 정리하게 됐다.

## 1. 경로 파라미터

Django URL 패턴에서 `<int:idx>`처럼 경로의 일부를 변수로 받는 방식을 경로 파라미터(path parameter)라고 한다.

```python
# urls.py
path('api/items/<int:idx>/', views.item_detail)
```

`/api/items/5/`로 요청하면 `5`가 `idx`로 들어온다.

중요한 건, 클라이언트에서 호출할 때 `<int:idx>`라는 글자를 그대로 보내면 안 된다는 것. 실제 값을 문자열에 넣어서 호출해야 한다. 내가 한 실수가 바로 이거였다.

```js
// 틀린 예: 패턴 문구가 그대로 들어감
axios.post('/api/items/<int:idx>/', { ... })

// 맞는 예: 실제 값이 경로에 들어감
axios.get(`/api/items/${id}/`)
```

## 2. HTTP 메서드와 REST

| 메서드 | 용도 |
| --- | --- |
| GET | 조회 (Read) |
| POST | 생성 (Create) |
| PUT / PATCH | 수정 (Update) |
| DELETE | 삭제 (Delete) |

조회 API는 GET을 쓰는 게 관례다. 조회를 POST로 보내면 백엔드에서 라우팅이나 로직이 꼬이기 쉽다. 프론트에서 `axios.get`으로 호출하고, 백엔드도 GET을 받도록 맞췄다.

## 3. 경로 파라미터 vs 요청 본문

- 경로 파라미터는 뷰 함수의 인자로 바로 받는다: `def item_detail(request, idx):`
- 요청 본문(body)은 주로 POST, PUT에서 쓰고, GET은 보통 본문이 없다.
- 같은 값을 경로와 본문에서 둘 다 받으면 어느 쪽 값이 쓰이는지 헷갈리고, 잘못된 값이 쓰일 수 있다.

URL로 `idx`를 넘겼다면 백엔드에서 본문에서 또 꺼낼 필요가 없다.

```python
@api_view(['GET'])
def item_detail(request, idx):
    item = get_object_or_404(Item, pk=idx)
    return Response(ItemSerializer(item).data)
```

`get_object_or_404`를 쓰면 없는 번호일 때 500이 아니라 404가 나간다.

## 4. 500 에러는 어디서 왔나

500 Internal Server Error는 대부분 서버 코드 안에서 예외가 났을 때 생긴다. 그래서 **서버 로그를 꼭 확인**해야 한다.

| 문제가 생긴 흐름 | 고친 흐름 |
| --- | --- |
| 1. 클라이언트가 `/api/items/<int:idx>/`를 글자 그대로 호출 | 1. 실제 id를 넣어 `/api/items/5/`로 호출 |
| 2. 의도한 패턴과 맞지 않음 | 2. Django가 경로에서 `idx=5`를 정확히 받음 |
| 3. 뷰 함수가 `request.body`에서 idx를 찾음 | 3. 뷰 함수가 인자로 받은 `idx`를 바로 사용 |
| 4. 엉뚱한 값으로 동작하다 예외 → 500 | 4. 예외 없이 DB에서 조회해서 응답 |

## 배운 점

- 경로 파라미터는 반드시 실제 값으로 바꿔서 호출한다.
- 조회는 GET으로 요청한다.
- 서버에서는 경로 파라미터를 함수 인자로 받고, 본문과 중복해서 처리하지 않는다.
- 500 에러가 나면 서버 로그부터 본다.
