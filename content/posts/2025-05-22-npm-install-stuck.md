---
title: npm install이 중간에 멈춘 것 같을 때
date: 2025-05-22
summary: 컨테이너 안에서 npm install이 스피너만 돌아서 Ctrl+C로 끊었다가 SIGINT, EPIPE, UNMET DEPENDENCY까지 본 기록. 결론은 기다리기
tags: [npm, Docker, 오류]
---

## 증상

Docker 컨테이너 안에서 실행 스크립트를 돌리는데, Django 쪽 준비가 끝나고 `npm install`에서 스피너만 돌고 아무 진행이 없었다.

```
npm warn using --force Recommended protections disabled.
⠙
```

한참 기다리다가 멈춘 줄 알고 `Ctrl+C`로 끊었다.

```
npm error process terminated
npm error signal SIGINT
```

`SIGINT`는 에러 원인이 아니라 **내가 Ctrl+C로 끊었다는 뜻**이다.

## 확인한 것

### 1. 자세한 로그 보기

```bash
npm install --verbose
```

그러면 멈춘 게 아니라 의존성을 내려받고 있다는 게 보인다. deprecated 경고(`inflight`, `rimraf@3`, `eslint@8` 등)는 오래된 패키지를 쓴다는 알림일 뿐 설치를 막지 않는다.

### 2. optional dependency 실패

`@rollup/rollup-*`, `@esbuild/*`처럼 플랫폼별 바이너리 패키지가 설치 실패로 나오는 건 정상이다. 내 환경(linux x64)에 맞지 않는 것들은 원래 건너뛴다.

### 3. write EPIPE

```
FetchError: request to https://registry.npmjs.org/-/npm/v1/security/audits/quick failed, reason: write EPIPE
```

설치가 끝난 뒤 `npm audit` 요청이 네트워크 문제로 끊긴 것이다. 설치 자체와는 상관없다.

### 4. 설치가 정말 됐나

```bash
npm ls --depth=0
```

처음에 끊었을 때는 전부 `UNMET DEPENDENCY`였다. 설치가 끝나기 전에 중단했으니 당연한 결과.

## 해결: 기다리기

결국 **끝날 때까지 기다렸더니** 정상적으로 설치됐다. 컨테이너 안이고, 의존성이 많고, 네트워크가 느리면 처음 설치는 몇 분씩 걸린다. npm은 내려받는 동안 진행 상황을 잘 안 보여 줘서 멈춘 것처럼 보일 뿐이다.

## 그래도 정말 멈췄다면

```bash
# 레지스트리까지 네트워크가 되는지
curl -I https://registry.npmjs.org/

# 캐시 문제일 때
npm cache verify          # 먼저 검증
npm cache clean --force   # 그래도 이상하면 비우기

# lock 파일과 node_modules를 새로
rm -rf node_modules package-lock.json
npm install
```

마지막 방법은 lock 파일을 지우니 의존성 버전이 바뀔 수 있다. 팀 프로젝트라면 lock 파일은 지우지 말고 `npm ci`를 먼저 써 보자.

검색하면 다른 미러 레지스트리로 바꾸라는 답도 나오는데, 공식이 아닌 미러는 공급망 보안 면에서 조심해야 한다. 회사 안에서 쓰는 사내 미러가 있다면 그쪽을 쓰자.

## 덧붙임

스크립트에 `npm install --force`가 들어 있었다(`using --force Recommended protections disabled`). 의존성 충돌을 무시하고 설치하는 옵션이라 문제를 숨길 수 있다. 꼭 필요한 게 아니면 빼는 게 좋다.

## 정리

- `SIGINT`는 내가 끊었다는 뜻이다.
- 멈춘 것 같으면 `--verbose`로 진행 상황부터 본다.
- 첫 설치는 생각보다 오래 걸린다. 기다리자.
