---
title: "Three.js: import * as THREE를 쓰는 이유와 3D 웹의 데이터 흐름"
date: 2025-09-18
summary: Three.js를 ES 모듈로 가져오는 방법과 이유, 그리고 Vue와 함께 쓸 때 API를 Three.js에서 직접 부를지 컴포넌트를 거칠지
tags: [Three.js, JavaScript, Vue]
---

Three.js 예제를 보면 항상 이렇게 시작한다.

```js
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
```

왜 코어는 `* as THREE`로 가져오고, 컨트롤과 로더는 경로를 길게 적어야 하는지 궁금해서 찾아봤다.

## 1. import * as THREE from 'three'

- `three` 패키지의 모든 export를 `THREE`라는 이름의 객체 하나로 묶어서 가져오는 문법이다.
- 그래서 `new THREE.Scene()`, `new THREE.PerspectiveCamera()`처럼 쓴다.
- `import { Scene, PerspectiveCamera } from 'three'`처럼 필요한 것만 가져와도 된다. 예전부터 `THREE.xxx`로 쓰던 습관과 예제 때문에 `* as THREE`가 흔할 뿐이다.

## 2. 확장 기능은 경로를 지정해서

Three.js는 핵심(core)과 확장 기능(addons)이 나뉘어 있다. `OrbitControls`, `GLTFLoader` 같은 건 코어에 없고 `examples/jsm` 아래에 각각 별도 ES 모듈로 들어 있다. 그래서 정확한 경로로 가져와야 한다.

최근 버전에서는 `three/addons/...`라는 짧은 경로도 쓸 수 있다.

```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
```

예전에는 `<script>`로 불러서 전역 `THREE.OrbitControls`로 썼지만, 지금은 ES 모듈 방식이 기본이다.

## 3. 왜 ES 모듈로 쓸까

- **의존성이 명확하다**: 전역 `<script>` 방식은 모든 게 전역에 섞여서 다른 코드와 이름이 겹칠 수 있다. 모듈은 필요한 걸 명시적으로 가져오니 코드 추적이 쉽다.
- **트리 셰이킹**: 번들러(Vite, Webpack)가 쓰지 않는 코드를 빌드에서 뺄 수 있다. 확장 기능을 따로 나눠 둔 것도 그래서다.
- **스코프가 안전하다**: 파일마다 자기 스코프가 있다.
- **코드 스플리팅**: 3D 뷰어처럼 무거운 부분을 필요할 때만 불러올 수 있다(`import()`).
- **개발 도구 지원**: 자동 완성, 타입 추론, 린트가 잘 된다.

## 4. 3D 웹의 데이터 흐름

3D 화면을 만들면서 데이터가 어디서 어디로 흐르는지도 정리했다.

- **잘 안 바뀌는 데이터**: 3D 모델 파일(`.gltf`, `.glb`), 텍스처 같은 건 정적 파일 서버나 CDN에 두고 캐싱한다.
    - `CDN → 프론트 → Three.js 씬`
- **자주 바뀌는 데이터**: 상태값, 사용자 설정 같은 건 API로 받는다. 실시간이 중요하면 WebSocket을 쓴다.
    - `프론트 → 백엔드 API → DB → 응답 → Three.js 씬 업데이트`

실제 렌더링은 전부 프론트에서 하고, 백엔드는 모델 파일과 데이터를 관리하는 역할이다.

## 5. API는 Three.js에서 직접? Vue를 거쳐서?

### 직접 호출: Three.js 코드가 API를 부른다

```js
async function loadModel(id) {
  const res = await fetch(`/api/models/${id}`)
  const info = await res.json()
  const gltf = await loader.loadAsync(info.modelUrl)
  scene.add(gltf.scene)
}
```

- 장점: 중간 단계가 없어서 단순하고 빠르다. 3D 쪽에서 모든 걸 제어한다.
- 단점: 데이터와 렌더링이 섞이고, 다른 화면(목록, 상세 패널)과 데이터를 나눠 쓰기 어렵다. 테스트도 어렵다.

### 경유 호출: Vue가 데이터를 받고 Three.js에는 넘겨만 준다

```vue
<script setup lang="ts">
const props = defineProps<{ id: number }>()
const info = ref<ModelInfo>()

watch(() => props.id, async (id) => {
  info.value = await fetchModelInfo(id)
}, { immediate: true })
</script>

<template>
  <ThreeViewer v-if="info" :model-url="info.modelUrl" :status="info.status" />
</template>
```

- 장점: 역할이 분명하다. 같은 데이터를 옆의 정보 패널, 차트와 함께 쓸 수 있고 상태 관리(Pinia)와도 잘 맞는다.
- 단점: 단계가 하나 늘어서 구조가 조금 복잡해진다.

### 고르는 기준

| 이럴 때 | 추천 |
| --- | --- |
| 3D 상호작용이 거의 전부인 단순한 앱, 프레임 단위 성능이 중요할 때 | 직접 호출 |
| 3D와 일반 UI(목록, 패널, 차트)가 함께 있고, 여러 컴포넌트가 데이터를 같이 쓸 때 | 경유 호출 |

내가 만드는 화면은 3D 뷰어 옆에 상태 표와 차트가 같이 있어서 경유 호출이 맞았다. Three.js 컴포넌트는 "받은 데이터를 그리는 일"만 하게 두니 훨씬 다루기 쉬웠다.
