---
title: "VS Code EBUSY: .nfs 파일이 잠겨서 삭제되지 않을 때"
date: 2025-09-04
summary: git clone이 중간에 끊긴 폴더를 지우려는데 EBUSY가 나서, lsof로 파일을 붙잡고 있던 프로세스를 찾아 정리한 기록
tags: [Linux, Git, VS Code, 오류]
---

## 오류 메시지

VS Code에서 폴더를 지우려고 하니 이런 에러가 났다.

```
Error: EBUSY: resource busy or locked, unlink '/home/dev/Three.js-TypeScript-Boilerplate/.git/.nfs000000000011056f00000131'
```

## 상황

원격 개발 서버(NFS로 마운트된 홈 디렉터리)에서 Three.js 보일러플레이트를 클론하다가 네트워크가 끊겼다.

```
$ git clone https://github.com/Sean-Bradley/Three.js-TypeScript-Boilerplate.git
error: RPC failed; curl 92 HTTP/2 stream 5 was not closed cleanly: CANCEL (err 8)
fatal: early EOF
fatal: fetch-pack: invalid index-pack output

$ git clone --depth=1 https://github.com/Sean-Bradley/Three.js-TypeScript-Boilerplate.git
error: RPC failed; curl 56 Recv failure: Connection reset by peer
fatal: early EOF
```

실패한 클론 폴더를 지우고 다시 받으려는데, `.nfs...`라는 처음 보는 파일 때문에 삭제가 안 됐다.

## 원인: .nfs 파일

NFS에서는 어떤 프로세스가 **열어 둔 파일을 삭제하면**, 파일이 바로 사라지지 않고 `.nfsXXXX` 이름으로 바뀌어 남는다. 그 프로세스가 파일을 닫으면 그때 지워진다. 이 `.nfs` 파일은 직접 지울 수 없다(EBUSY).

클론이 실패했는데도 `git` 프로세스들이 정리되지 않고 남아서 파일을 붙잡고 있었다.

## 해결

`lsof`로 그 폴더의 파일을 열고 있는 프로세스를 찾았다.

```bash
$ lsof | grep Three.js-TypeScript-Boilerplate
git       1212525  root  cwd   DIR  ...  /home/dev/Three.js-TypeScript-Boilerplate
git       1212525  root  3w    REG  ...  /home/dev/Three.js-TypeScript-Boilerplate/.git/.nfs000000000011056f00000131
git       1212679  root  4u    REG  ...  /home/dev/Three.js-TypeScript-Boilerplate/.git/objects/pack/.nfs00000000002a03c700000132
...
```

남아 있던 git 프로세스들을 끝내고 폴더를 지웠다.

```bash
kill 1212525 1212526 1212527 1212679   # 안 끝나면 kill -9
rm -rf ~/Three.js-TypeScript-Boilerplate
```

`lsof +D 폴더경로`로 특정 폴더만 볼 수도 있고, `fuser -vm 경로`도 같은 용도로 쓸 수 있다.

## 클론이 자꾸 끊길 때

큰 저장소를 불안정한 네트워크에서 받을 때는

- `--depth=1`로 최신 커밋만 받기
- `git config --global http.version HTTP/1.1` (HTTP/2 스트림 에러가 날 때)
- 그래도 안 되면 GitHub에서 zip으로 받기

## 정리

- `.nfs` 파일은 "누군가 아직 열고 있는 삭제된 파일"이다.
- `lsof`로 붙잡고 있는 프로세스를 찾아서 끝내면 지워진다.
