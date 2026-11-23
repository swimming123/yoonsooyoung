---
title: "로그인 비밀번호 암호화해서 보내기: AES, RSA, 그리고 HTTPS"
date: 2025-09-15
summary: 개발자 도구에 비밀번호가 평문으로 보이는 게 걸려서 AES와 RSA로 암호화해 보고 겪은 키 형식, 라이브러리, 패딩 문제
tags: [보안, 암호화, Django, Vue]
---

로그인 요청을 보낼 때 개발자 도구(F12) 네트워크 탭을 열면 비밀번호가 평문으로 그대로 보였다. HTTPS로 통신하니 네트워크 구간에서는 암호화되지만, 그래도 요청 내용에 평문이 보이는 게 걸려서 프론트에서 암호화해서 보내는 방법을 찾아봤다.

## 선택지

| 방식 | 어떻게 | 문제 |
| --- | --- | --- |
| 대칭키(AES) | 프론트와 서버가 같은 키로 암호화/복호화 | 키가 프론트 코드에 들어가야 한다 |
| 비대칭키(RSA) | 서버가 준 공개키로 암호화, 서버만 가진 개인키로 복호화 | 키 관리와 라이브러리 호환을 신경 써야 한다 |
| 해시 | 프론트에서 해시해서 보냄 | 그 해시값이 곧 비밀번호가 돼서 의미가 줄어든다 |

## 첫 시도: AES

`crypto-js`로 AES-CBC 암호화를 해서 보냈다.

```ts
import CryptoJS from 'crypto-js'

const AES_KEY = '서버와 같은 키' // ← 문제

export function encodeAES(raw: string): string {
  const key = CryptoJS.SHA256(AES_KEY)
  const iv = CryptoJS.lib.WordArray.random(16)
  const encrypted = CryptoJS.AES.encrypt(raw, key, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 })
  return CryptoJS.enc.Base64.stringify(iv.concat(encrypted.ciphertext)) // iv + 암호문
}
```

동작은 했지만 **보안상 의미가 거의 없었다.** 키가 JS 번들 안에 들어 있으니 누구든 번들을 열어서 키를 찾고 그대로 복호화할 수 있다. "평문으로 보내고 싶지 않다"는 기분을 달래 주는 정도다.

## 두 번째 시도: RSA

공개키는 누가 가져가도 상관없고, 복호화는 서버의 개인키로만 된다. 프론트에 비밀을 둘 필요가 없다.

흐름은 이렇다.

1. 서버에서 RSA 키 쌍을 만들고 개인키는 서버에만 둔다.
2. 프론트가 공개키를 받아서 비밀번호를 암호화해서 보낸다.
3. 서버가 개인키로 복호화하고, 저장된 bcrypt 해시와 비교한다.

### 키 만들기

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

`public.pem`은 이렇게 생겼다. 앞뒤 줄까지 포함한 **PEM 전체 문자열**을 그대로 써야 한다.

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
```

개인키는 레포에 올리지 말고 환경 변수나 비밀 저장소로 넣는다.

### 서버 (Django + PyCryptodome)

```python
# settings.py
RSA_PUBLIC_KEY = Path(env('RSA_PUBLIC_KEY_PATH')).read_text()
RSA_PRIVATE_KEY = Path(env('RSA_PRIVATE_KEY_PATH')).read_text()
```

```python
# crypto_utils.py
import base64
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
from django.conf import settings

_private_key = RSA.import_key(settings.RSA_PRIVATE_KEY)

def rsa_decrypt(enc_b64: str) -> str:
    cipher = PKCS1_v1_5.new(_private_key)
    sentinel = object()
    plain = cipher.decrypt(base64.b64decode(enc_b64), sentinel)
    if plain is sentinel:
        raise ValueError('복호화 실패')
    return plain.decode('utf-8')
```

```python
# views.py
def public_key(request):
    return JsonResponse({'publicKey': settings.RSA_PUBLIC_KEY})

def login(request):
    user_id = request.POST.get('userId')
    try:
        password = rsa_decrypt(request.POST.get('userPwd', ''))
    except ValueError:
        return JsonResponse({'success': False, 'message': '복호화 실패'}, status=400)

    user = User.objects.filter(username=user_id, is_active=True).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return JsonResponse({'success': False, 'message': '아이디 또는 비밀번호가 맞지 않아요'}, status=401)
    # JWT 발급 등
```

아이디가 없는 경우와 비밀번호가 틀린 경우를 같은 메시지로 돌려줘야 어떤 아이디가 있는지 새어 나가지 않는다.

### 프론트 (Vue + JSEncrypt)

```ts
import JSEncrypt from 'jsencrypt'

export async function encryptPassword(password: string): Promise<string> {
  const { publicKey } = await api.getPublicKey()
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)
  const encrypted = encryptor.encrypt(password)
  if (!encrypted) throw new Error('암호화 실패')
  return encrypted
}
```

이제 F12 네트워크 탭에는 암호문만 보인다.

## 겪은 문제들

### 1. encrypt()가 false를 돌려줌

JSEncrypt는 실패하면 에러 대신 `false`를 돌려준다. 원인은 공개키 형식이었다. 서버가 키를 잘라서 보내거나, 줄바꿈이 깨지거나, `BEGIN/END` 줄 없이 보내면 이렇게 된다. 받은 공개키 길이를 찍어 보면 바로 안다(2048비트 PEM은 450자 정도).

또 RSA 2048비트 + PKCS#1 v1.5로는 한 번에 245바이트까지만 암호화된다. 비밀번호에는 충분하지만 긴 데이터를 넣으면 실패한다.

### 2. 서버에서 공개키 자리에 개인키를 쓰고 있었음

로그를 찍어 보니 "공개키" 변수에 `-----BEGIN PRIVATE KEY-----`가 들어 있었다. 설정 이름을 헷갈려서 바꿔 넣은 것. 공개키 API로 개인키를 내보내면 RSA를 쓰는 의미가 완전히 없어지니 꼭 확인해야 한다.

### 3. module 'Crypto.PublicKey.RSA' has no attribute 'import_key'

예전 패키지인 `pycrypto`가 깔려 있어서 `pycryptodome`과 충돌했다. 둘 다 `Crypto`라는 이름을 쓴다.

```bash
pip uninstall pycrypto
pip install pycryptodome
```

### 4. 패딩 방식이 달라서 복호화 실패

처음에는 서버에서 `PKCS1_OAEP`로 복호화하고 있었는데 계속 실패했다. JSEncrypt는 **PKCS#1 v1.5** 패딩으로 암호화하기 때문에 서버도 `PKCS1_v1_5`로 풀어야 한다. OAEP를 쓰고 싶으면 프론트에서 브라우저 내장 Web Crypto API(`RSA-OAEP`)로 암호화하면 된다.

## 정리

- **HTTPS가 기본이자 핵심이다.** 프론트에서 암호화하는 건 그 위에 얹는 추가 장치다. 개발자 도구나 로그, 프록시에 평문이 남지 않게 하는 정도의 효과다.
- 프론트에 키를 넣어야 하는 대칭키 암호화는 의미가 없다.
- RSA를 쓴다면 공개키 형식, 개인키 보관, 라이브러리 간 패딩 방식을 맞춰야 한다.
- 서버에 저장하는 비밀번호는 언제나 bcrypt나 argon2 같은 해시로.
