---
title: Django 로그 설정하기
date: 2025-09-12
summary: settings.py의 LOGGING으로 콘솔과 파일에 같이 로그를 남기고, 뷰에서 레벨별로 찍는 방법
tags: [Django, 로그]
---

서버를 `nohup`으로 띄워 두니 `print()`로 찍던 로그를 다시 볼 방법이 없었다. 그래서 Django의 `LOGGING` 설정으로 콘솔과 파일에 같이 남기도록 바꿨다.

## settings.py

```python
import os

LOG_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name}: {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(LOG_DIR, 'django-debug.log'),
            'maxBytes': 10 * 1024 * 1024,  # 10MB마다 새 파일
            'backupCount': 5,              # 최대 5개까지 보관
            'formatter': 'verbose',
            'encoding': 'utf-8',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['file', 'console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

- **formatters**: 로그 한 줄의 모양. 파일에는 시간과 로거 이름까지 자세히, 콘솔에는 짧게.
- **handlers**: 로그를 어디로 보낼지. 파일과 콘솔 두 군데.
- **root**: 따로 설정하지 않은 모든 로거(내 앱 코드 포함)의 기본값.
- **loggers.django**: Django 내부 로그는 INFO부터만.

처음에는 `logging.FileHandler`를 썼는데, 그러면 파일이 끝없이 커진다. `RotatingFileHandler`로 크기를 정해 두면 넘칠 때 `django-debug.log.1`, `.2`로 밀려나면서 오래된 건 지워진다.

`django` 로거에 `propagate: True`를 두면 같은 로그가 root 핸들러로도 올라가서 **두 번씩** 찍힌다. 핸들러를 직접 달았으면 `False`로 둔다.

## 뷰에서 쓰기

```python
import logging

logger = logging.getLogger(__name__)

def some_view(request):
    logger.debug('디버깅용 로그: %s', request.GET)
    logger.info('일반 정보')
    try:
        ...
    except Exception:
        logger.exception('처리 중 에러')  # error + 스택 트레이스
```

| 메서드 | 용도 |
| --- | --- |
| `logger.debug()` | 개발할 때 확인용. 레벨이 DEBUG일 때만 찍힌다 |
| `logger.info()` | 일반 정보 |
| `logger.warning()` | 문제는 아니지만 살펴볼 것 |
| `logger.error(..., exc_info=True)` / `logger.exception()` | 에러. 스택 트레이스까지 남긴다 |

값을 넣을 때는 `print`처럼 `logger.debug('값:', data)`로 쓰면 안 된다. 첫 번째 인자가 포맷 문자열이라서 `'값: %s', data`처럼 `%s` 자리를 만들어야 한다. 이렇게 쓰면 해당 레벨이 꺼져 있을 때 문자열을 만들지도 않아서 더 가볍다.

## 결과

`runserver` 터미널과 `logs/django-debug.log` 양쪽에 다 기록된다. `nohup`으로 띄워도 파일에서 확인할 수 있다.

운영에서는 root 레벨을 INFO로 올려서 DEBUG 로그가 쌓이지 않게 한다. `logs/` 폴더는 `.gitignore`에 넣어 둔다.
