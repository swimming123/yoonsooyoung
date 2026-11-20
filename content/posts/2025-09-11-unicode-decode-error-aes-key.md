---
title: "UnicodeDecodeError: 'utf-8' codec can't decode byte (AES 복호화)"
date: 2025-09-11
summary: 프론트와 서버의 AES 키가 한 글자 달라서 복호화 결과가 깨졌고, 그 깨진 바이트를 UTF-8로 읽다가 난 에러
tags: [Python, Django, 암호화, 오류]
---

## 오류 메시지

```
Internal Server Error: /api/users/login
  File "utils.py", line 228, in login_decode_aes
    return unpad(cipher.decrypt(enc[16:])).decode('utf-8')
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xa8 in position 2: invalid start byte
```

## 상황

프론트에서 AES로 암호화한 비밀번호를 서버에서 복호화하는 코드다.

```python
def login_decode_aes(enc):
    key = hashlib.sha256(settings.LOGIN_KEY.encode('utf-8')).digest()
    unpad = lambda s: s[:-s[-1]]
    enc = base64.b64decode(enc)
    iv = enc[:16]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    return unpad(cipher.decrypt(enc[16:])).decode('utf-8')
```

## 원인

AES는 키가 틀려도 **에러 없이 복호화가 된다.** 다만 결과가 의미 없는 바이트일 뿐이다. 그 바이트를 `.decode('utf-8')`로 문자열로 바꾸려다 UTF-8로 읽을 수 없는 바이트(`0xa8`)를 만나서 에러가 났다. 즉 이 에러는 "**키가 맞지 않는다**"는 신호였다.

설정 파일의 키와 프론트의 키를 눈으로 비교하면 똑같아 보였는데, 키를 숫자 패드로 다시 입력했더니 해결됐다. 처음 입력할 때 한/영 상태나 입력기 때문에 겉보기엔 같은 다른 문자(전각 숫자 등)가 들어갔던 것으로 보인다.

## 해결과 교훈

- 키를 다시 입력해서 양쪽을 맞췄다.
- 키 같은 값은 손으로 치지 말고 생성해서 복사하고, 비교할 때는 눈 대신 바이트로 확인한다.

    ```python
    print(settings.LOGIN_KEY.encode('utf-8'))   # b'1122...' 가 아니면 이상한 문자가 섞인 것
    ```

- 복호화 실패를 500 에러로 터뜨리지 말고 잡아서 400으로 돌려준다. 패딩도 직접 자르지 말고 검증하는 함수를 쓴다.

    ```python
    from Crypto.Util.Padding import unpad

    try:
        plain = unpad(cipher.decrypt(enc[16:]), AES.block_size).decode('utf-8')
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({'success': False, 'message': '복호화 실패'}, status=400)
    ```

- 그리고 키를 프론트와 공유해야 하는 대칭키 방식은 보안상 한계가 있어서, 나중에 RSA로 바꿨다.
