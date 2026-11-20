---
title: "오류: 기본 클래스를 찾거나 로드할 수 없습니다"
date: 2023-01-08
summary: 어제까지 되던 이클립스가 class file version 오류를 뿜을 때, 자바를 다 지우고 다시 깔아서 해결한 기록
tags: [자바, 오류]
---

아니, 어제까지 잘 되던 이클립스에서 오류가 떴다.

![이걸 시작으로 모든 게 오류가 났다](/images/posts/java-could-not-find-main-class/01.jpg)

```text
the selection cannot be launched and there are no recent launches

datatype has been compiled by a more recent version of the Java Runtime (class file version 61.0),
this version of the Java Runtime only recognizes class file versions up to 55.0
```

빨간 글씨가 와다닥 쓰여 있었는데, 대충 보니 자바 버전이 안 맞는다는 얘기 같았다. class file version 61.0은 자바 17, 55.0은 자바 11이다. 자바 17로 컴파일된 파일을 자바 11 이하의 런타임으로 실행하려고 해서 생긴 오류다.

그래서 자바 버전을 확인했다.

![](/images/posts/java-could-not-find-main-class/02.jpg)

지금은 1.8.0으로 나오지만, 오류가 났을 때는 17이었나, 가장 최신 버전이 깔려 있었다.

어찌저찌 설치된 자바를 모두 지우고(어떻게 지웠는지 모를 정도로 온갖 방법을 총동원했다 ㅠ), 다시 깔고, 이클립스도 다시 설치해서 드디어 실행됐다.

Hello World가 이렇게 반가울 줄이야.

![](/images/posts/java-could-not-find-main-class/03.jpg)

주말 내내 자바를 깔았다 지운 보람이 있다.

앞으로 설치할 때는

- 설치 경로를 꼭 확인하고 (문제가 생기면 바로 지울 수 있게)
- 안 된다 싶으면 관련 폴더까지 싹 지우고 처음부터 다시 시작해야겠다!
