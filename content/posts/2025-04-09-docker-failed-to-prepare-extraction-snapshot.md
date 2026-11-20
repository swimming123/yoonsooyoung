---
title: "Docker 빌드 failed to prepare extraction snapshot"
date: 2025-04-09
summary: docker compose 빌드 마지막에 parent snapshot does not exist가 나며 실패할 때, 빌드 캐시를 정리하고 캐시 없이 다시 빌드하기
tags: [Docker, 오류]
---

## 오류 메시지

`docker compose build` 마지막 단계(이미지 내보내기)에서 실패했다.

```
 > [backend] exporting to image:
------
failed to solve: failed to prepare extraction snapshot "extract-903061763-UPOG sha256:f06f...":
parent snapshot sha256:1df4... does not exist: not found
```

## 원인

Docker(BuildKit)는 이미지를 레이어 단위로 쌓고, 이전 빌드의 레이어를 캐시로 다시 쓴다. 그런데 캐시가 가리키는 **부모 레이어(snapshot)가 실제로는 지워져 있으면** 이 에러가 난다. 빌드 도중 디스크 정리를 했거나, 빌드가 비정상 종료돼서 캐시가 꼬였을 때 자주 생긴다.

## 해결

### 1. 빌드 캐시와 안 쓰는 이미지 정리

```bash
docker builder prune -af   # 빌드 캐시 전부 삭제
docker image prune -af     # 컨테이너가 쓰고 있지 않은 이미지 전부 삭제
```

`-a`는 "전부"라서, 다른 프로젝트의 이미지도 지워진다. 다시 받으면 되긴 하지만 공용 서버라면 먼저 확인하자. 캐시만 지우고 싶으면 `docker builder prune -f`(안 쓰는 캐시만)부터 해 본다.

### 2. 캐시 없이 다시 빌드

```bash
docker compose build --no-cache
docker compose up -d
```

예전 `docker-compose`(하이픈 있는 v1)도 같은 옵션이다. 지금은 Docker에 내장된 `docker compose`(v2)를 쓰는 게 기본이다.

## 그래도 안 되면

- 디스크 여유 공간 확인: `df -h`, `docker system df`
- Docker 데몬 재시작: `sudo systemctl restart docker` (Docker Desktop이면 앱 재시작)
- 그래도 같으면 `docker system prune -a --volumes`까지 가야 하는데, 이건 **볼륨(DB 데이터 등)까지 지우니** 정말 마지막에, 백업 후에.

## 정리

- `snapshot ... does not exist`는 빌드 캐시가 꼬였다는 뜻이다.
- 캐시 정리 → `--no-cache` 빌드 순서로 대부분 해결된다.
