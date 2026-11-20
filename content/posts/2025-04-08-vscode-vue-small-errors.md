---
title: VS Code·Vue 자잘한 오류 모음
date: 2025-04-08
summary: Pylance import 에러, 탭과 공백 섞임, pip 의존성 충돌, 한글이 두 번 입력될 때, defineEmits import 경고, Vite 의존성 해결 실패
tags: [VS Code, Python, Vue, 오류]
---

Django + Vue 프로젝트를 처음 세팅하면서 만난 자잘한 오류들. 하나하나는 금방 고쳤지만 다시 만나면 또 검색할 것 같아서 모아 둔다.

## 1. Import "rest_framework" could not be resolved (Pylance)

```
Import "rest_framework" could not be resolved Pylance(reportMissingImports)
```

### 원인

패키지는 가상환경에 설치했는데, VS Code가 다른 파이썬(시스템 파이썬)을 보고 있었다. 코드 실행에는 문제가 없고 에디터만 빨간 줄을 긋는다.

### 해결

`Ctrl + Shift + P` → **Python: Select Interpreter** → 지금 쓰는 가상환경의 파이썬 선택

## 2. Inconsistent use of tabs and spaces in indentation

![탭과 공백이 섞여 Pylance 경고가 난 코드](/images/posts/vscode-vue-small-errors/01.png)

### 원인

다른 곳에서 복사한 코드에 탭이 섞여 들어왔다. 파이썬은 들여쓰기로 블록을 나누니 탭과 공백이 섞이면 에러가 난다.

### 해결

`Ctrl + Shift + P` → **Convert Indentation to Spaces**

다시 안 생기게 하려면 설정에서 `"editor.insertSpaces": true`, 파이썬은 `"editor.tabSize": 4`로 두고, 저장할 때 포매터(black, ruff 등)를 돌리면 좋다.

## 3. pip 패키지 의존성 충돌

```
... because these package versions have conflicting dependencies.
```

VS Code에서는 이런 안내도 같이 떴다.

```
You may have installed Python packages into your global environment, which can cause conflicts
between package versions. Would you like to create a virtual environment with these packages?
```

### 처음 한 해결과 주의할 점

검색해서 찾은 이 명령으로 일단 설치는 됐다.

```bash
pip install --upgrade --no-deps --force-reinstall -r requirements.txt
```

그런데 `--no-deps`는 **의존성 검사를 끄고** requirements.txt에 적힌 것만 강제로 까는 옵션이다. 설치는 되지만 실제로 필요한 하위 패키지가 빠지거나 버전이 안 맞을 수 있다. 문제를 덮은 셈이다.

### 제대로 하려면

VS Code 안내대로 프로젝트마다 가상환경을 만드는 게 답이다. 전역 환경에 이것저것 깔려 있으면 충돌이 생긴다.

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pip check                      # 의존성이 맞는지 확인
```

## 4. VS Code에서 한글이 두 번씩 입력됨

```
내가 쓸 말
내가 쓸 말말
```

마지막 글자가 한 번 더 들어갔다. Windows 11의 Microsoft 한글 입력기와 VS Code(Electron)가 부딪히는 문제였다.

### 해결

Windows 설정에서 입력기 호환성 옵션을 켠다.

1. `Windows + I` → **시간 및 언어** → **언어 및 지역**
2. **한국어** 옆 `…` → **언어 옵션**
3. **Microsoft 입력기** 옆 `…` → **키보드 옵션**
4. **호환성** → **켬** (이전 버전의 Microsoft IME 사용)

## 5. defineEmits is a compiler macro and no longer needs to be imported

```
[@vue/compiler-sfc] defineEmits is a compiler macro and no longer needs to be imported.
```

### 원인과 해결

`defineEmits`, `defineProps`는 `<script setup>` 안에서 컴파일러가 처리하는 매크로라서 import하지 않는다.

```vue
<script setup>
// ❌ import { defineEmits, onMounted } from 'vue'
import { onMounted } from 'vue'

const emit = defineEmits(['cancel'])
</script>
```

## 6. The following dependencies are imported but could not be resolved

```
Error: The following dependencies are imported but could not be resolved:
  axios (imported by .../src/views/News/WeeklyView.vue?id=0)
Are they installed?
```

### 원인과 해결

말 그대로 `axios`를 import했는데 설치가 안 돼 있었다. 다른 사람이 `package.json`에 추가한 걸 내가 아직 `npm install` 하지 않았거나, 아예 `package.json`에 빠져 있는 경우다.

```bash
npm install axios
```

브랜치를 받아 온 뒤에는 `package.json`이 바뀌었는지 보고 `npm install`부터 하는 습관을 들이자.
