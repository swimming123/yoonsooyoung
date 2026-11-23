---
title: Redis를 Docker로 띄우기
date: 2025-11-20
summary: 메일 워커용 Redis를 docker compose로 띄우면서 정한 비밀번호, 메모리 정책, 영속성, 로그, 헬스체크 설정
tags: [Redis, Docker]
---

메일 발송 워커에서 쓸 메시지 큐로 Redis를 Docker로 띄웠다. 처음에는 최소 설정으로 띄웠다가, 운영을 생각하면서 로그와 헬스체크를 더했다.

## 폴더 구성

```
redis/
├── Dockerfile
├── docker-compose.yml
├── redis.conf
├── .env          # 비밀번호 (git에 올리지 않음)
├── data/         # RDB, AOF 파일
└── logs/         # redis.log
```

## Dockerfile

```dockerfile
FROM redis:7.2.4-alpine3.19

RUN mkdir -p /var/log/redis && chown redis:redis /var/log/redis

COPY redis.conf /usr/local/etc/redis/redis.conf

EXPOSE 6379

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
```

## redis.conf

```conf
port 6379
# requirepass는 compose에서 명령줄로 넣는다

maxmemory 512mb
maxmemory-policy allkeys-lru

# RDB 스냅샷: 60초 동안 100개 이상 바뀌면 저장
save 60 100
dbfilename dump.rdb
dir /data

# AOF: 모든 쓰기를 기록, 1초마다 디스크에 반영
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

logfile "/var/log/redis/redis.log"
```

### 메모리 정책 (maxmemory-policy)

`maxmemory`를 넘었을 때 어떻게 할지 정한다.

| 정책 | 동작 |
| --- | --- |
| `noeviction` | 아무것도 지우지 않고, 새 쓰기를 에러로 거부한다 (기본값) |
| `volatile-lru` | **TTL이 있는 키** 중에서 오래 안 쓴 것부터 지운다 |
| `allkeys-lru` | **모든 키** 중에서 오래 안 쓴 것부터 지운다 |

처음엔 `volatile-lru`로 했는데, TTL을 안 단 키가 많으면 지울 게 없어서 결국 `noeviction`처럼 쓰기가 `OOM command not allowed` 에러로 막힌다. 캐시 용도라면 `allkeys-lru`가 안전하다.

다만 **큐 용도**라면 이야기가 다르다. 메모리가 찼다고 아직 처리 안 된 메일 작업이 지워지면 안 되니까, 큐 전용 Redis라면 `noeviction`으로 두고 메모리 사용량에 알림을 거는 게 맞다. 용도에 따라 고르자.

### 영속성

- **RDB**: 일정 조건마다 전체 스냅샷을 저장. 파일이 작고 복구가 빠르지만 마지막 스냅샷 이후는 잃을 수 있다.
- **AOF**: 모든 쓰기 명령을 기록. `everysec`면 최악의 경우 1초 정도만 잃는다.

둘 다 켜 두면 재시작할 때 AOF 기준으로 복구한다.

## docker-compose.yml

```yaml
services:
  redis:
    build: .
    container_name: redis-dev
    command: ["redis-server", "/usr/local/etc/redis/redis.conf", "--requirepass", "${REDIS_PASSWORD}"]
    ports:
      - "127.0.0.1:6379:6379"   # 외부에 열 필요 없으면 로컬에만
    volumes:
      - ./data:/data
      - ./logs:/var/log/redis
    environment:
      REDISCLI_AUTH: ${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "PING"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped
```

`.env`에는 `REDIS_PASSWORD=...`만 넣어 두고, git에는 올리지 않는다.

- **requirepass**: 비밀번호를 설정 파일에 적으면 파일째로 노출되기 쉬워서, 환경 변수로 받아 명령줄로 넘겼다.
- **healthcheck**: Redis 프로세스가 응답하지 않는데 컨테이너만 살아 있는 상황을 잡는다.
    - `redis-cli -a 비밀번호`로 쓰면 비밀번호가 설정 파일과 `docker inspect`에 그대로 보인다. `REDISCLI_AUTH` 환경 변수를 쓰면 `-a` 없이 인증된다.
    - 포트를 기본값(6379)이 아닌 걸로 바꿨다면 `redis-cli -p 포트 PING`으로 포트도 맞춰야 한다. 안 그러면 헬스체크가 계속 실패한다.
- **로그 볼륨**: 컨테이너가 재시작돼도 `logs/redis.log`가 남아서 장애 원인을 볼 수 있다.

## 파이썬에서 연결

```python
import redis

r = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD,
    decode_responses=True,
)
r.ping()
```

같은 compose 네트워크 안의 다른 컨테이너에서는 `host`에 서비스 이름(`redis`)을 쓰면 된다.

## 처음 버전에서 바꾼 것

- 비밀번호를 설정 파일에서 환경 변수로 분리
- 메모리 정책을 용도에 맞게 다시 정함
- 로그 파일 경로와 볼륨 추가
- 헬스체크 추가
- compose 파일의 `version:` 줄은 지금의 Docker Compose에서는 쓰지 않아서 뺐다
