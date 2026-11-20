---
title: LDAP 로그인 여부를 어디에 둘까? JWT claim과 DB 확인 비교
date: 2025-09-16
summary: 일반 로그인과 LDAP 로그인을 같이 쓰면서 LDAP 사용자만 쓸 수 있는 API를 막기 위해 정리한 프론트 상태, JWT claim, DB 조회
tags: [인증, JWT, Django, Vue]
---

서비스에 일반 로그인과 LDAP(사내 계정) 로그인이 같이 있었다. 일부 기능은 LDAP으로 로그인한 사용자만 써야 했는데, "LDAP으로 로그인했다"는 상태를 어디에 어떻게 둘지 고민했다.

## 현재 흐름

- **프론트(Vue)**: 로그인 폼 → LDAP 로그인 API 호출 → 성공하면 `access_token`, `refresh_token`, 사용자 이름을 저장
- **백엔드(Django)**: LDAP으로 인증 확인 → DB에서 사용자 조회 → JWT 발급(SimpleJWT) → 토큰 반환

## 1. 프론트 상태만으로는 안 된다

처음엔 Pinia 스토어에 `isLdap` 플래그를 두고 localStorage에도 저장하려고 했다. 화면에서 메뉴를 보여 줄지 말지 정하는 데는 이걸로 충분하다.

그런데 **API 접근 권한**까지 막아야 한다면 이야기가 다르다. 프론트의 플래그는 브라우저에서 얼마든지 바꿀 수 있다. 접근 제어는 항상 서버가 믿을 수 있는 근거로 해야 한다.

## 2. JWT claim에 넣기

토큰을 발급할 때 커스텀 claim으로 로그인 방식을 넣었다. JWT는 서명돼 있어서 서버의 시크릿 키 없이는 claim을 바꿀 수 없다.

```python
from rest_framework_simplejwt.tokens import RefreshToken

refresh = RefreshToken.for_user(user)
refresh['auth_type'] = 'ldap'  # 리프레시 토큰에 넣으면 access 토큰에도 복사된다

return JsonResponse({
    'success': True,
    'access_token': str(refresh.access_token),
    'refresh_token': str(refresh),
    'user_name': user.get_full_name(),
})
```

DRF permission 클래스에서 claim을 확인한다. JWT 인증을 쓰면 검증된 토큰이 `request.auth`에 들어 있다.

```python
from rest_framework.permissions import BasePermission

class IsLdapAuthenticated(BasePermission):
    def has_permission(self, request, view):
        token = request.auth
        return bool(request.user and request.user.is_authenticated and token
                    and token.get('auth_type') == 'ldap')
```

```python
class ClusterResourceView(APIView):
    permission_classes = [IsLdapAuthenticated]

    def get(self, request):
        ...  # LDAP 로그인 사용자만
```

프론트는 같은 토큰을 디코딩해서 화면 제어에만 쓴다.

```ts
import { jwtDecode } from 'jwt-decode'

const isLdap = (token: string) => jwtDecode<{ auth_type?: string }>(token).auth_type === 'ldap'
```

- 프론트: 화면 제어용 (메뉴 보이기/숨기기)
- 백엔드: 보안 제어용 (API 접근 막기)

## 3. 토큰 claim vs 매번 DB 확인

그럼 토큰만 믿으면 될까? 두 방식을 비교해 봤다.

### 방식 1: 토큰의 claim 확인

요청 → 토큰 검증 → `auth_type` 확인

- 장점: DB 조회가 없어서 가볍고 빠르다.
- 단점: **발급 시점의 정보**만 안다. 그 사이에 계정이 비활성화되거나 LDAP 연결이 해제돼도 토큰이 만료될 때까지는 모른다.

### 방식 2: 매번 DB 조회

요청 → 사용자 DB 조회 → LDAP 연결 여부 확인

- 장점: 항상 최신 상태를 반영한다. 오래된 토큰이라도 DB 기준으로 막을 수 있다.
- 단점: 요청마다 DB를 조회하니 트래픽이 많으면 부담이 된다.

### 정리

| 우선순위 | 방법 |
| --- | --- |
| 성능 | 토큰 claim만으로 확인. 액세스 토큰 수명을 짧게 해서 오래된 정보의 위험을 줄인다 |
| 보안·정합성 | 대부분은 claim으로 확인하고, 계정 변경이나 관리자 기능 같은 민감한 작업 직전에만 DB로 한 번 더 확인 |

대부분의 API는 방식 1로 처리하고, 민감한 작업 직전에만 방식 2를 섞는 게 균형이 맞았다.
