---
title: "npm error code EBADENGINE: Node 버전 문제"
date: 2025-04-15
summary: Node 18에서 최신 npm을 설치하려다 난 EBADENGINE, nvm으로 Node를 올리거나 Node에 맞는 npm 버전을 고정하기
tags: [npm, Node.js, 오류]
---

## 오류 메시지

의존성 설치 스크립트를 돌리는데 이렇게 멈췄다.

```
npm error code EBADENGINE
npm error engine Unsupported engine
npm error engine Not compatible with your version of node/npm: npm@11.3.0
npm error notsup Required: {"node":"^20.17.0 || >=22.9.0"}
npm error notsup Actual:   {"npm":"10.8.2","node":"v18.20.8"}
```

## 원인

스크립트 안에 `npm install -g npm@latest`가 있었다. 그때 최신 npm(11.3.0)은 **Node 20.17 이상 또는 22.9 이상**을 요구하는데, 서버의 Node는 18이었다.

`engines` 필드는 패키지가 "이 버전의 Node에서 돌아간다"고 적어 둔 것이고, 맞지 않으면 npm이 EBADENGINE으로 알려 준다.

## 해결

### 방법 1: Node를 올린다 (권장)

Node 18은 2025년 4월 말로 지원이 끝났다. 이참에 LTS로 올리는 게 맞다. nvm을 쓰면 여러 버전을 오가며 쓸 수 있다.

```bash
# nvm 설치 (최신 설치 스크립트 주소는 nvm 저장소 README에서 확인)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/<버전>/install.sh | bash
source ~/.bashrc

nvm install 22
nvm use 22
node -v
npm -v
```

프로젝트 루트에 `.nvmrc` 파일로 버전을 적어 두면 `nvm use`만으로 맞출 수 있다.

```
22
```

Docker라면 베이스 이미지를 바꾼다.

```dockerfile
FROM node:22-alpine
```

### 방법 2: Node에 맞는 npm을 고정한다

당장 Node를 못 올리는 상황이면 `latest` 대신 Node 18에서 돌아가는 npm 버전을 고정한다.

```bash
npm install -g npm@10
```

스크립트에 `@latest`를 쓰면 오늘은 되던 게 내일 새 버전이 나오면서 깨질 수 있다. 버전은 고정해 두자.

## 정리

- EBADENGINE은 "이 패키지가 요구하는 Node/npm 버전과 지금 버전이 다르다"는 뜻이다. `Required`와 `Actual`을 비교하면 바로 보인다.
- 설치 스크립트에서 `@latest`는 피하고 버전을 고정한다.
- 프로젝트에 `.nvmrc`나 `package.json`의 `engines`로 Node 버전을 적어 두면 팀원끼리 맞추기 쉽다.
