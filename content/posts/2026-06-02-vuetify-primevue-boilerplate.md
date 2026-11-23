---
title: Vuetify와 PrimeVue를 함께 쓰는 보일러플레이트
date: 2026-06-02
summary: 레이아웃은 Vuetify, 복잡한 데이터 컴포넌트는 PrimeVue로 역할을 나눈 Vue 3 템플릿 구조와, PrimeVue 프로젝트를 Vuetify로 옮길 때의 선택지
tags: [Vue, Vuetify, PrimeVue, 설계]
---

PrimeVue로 만든 프로젝트들과 Vuetify로 만든 프로젝트가 같이 있다 보니, 둘을 한 프로젝트에서 같이 쓸 수 있는 보일러플레이트를 만들어 보기로 했다. 무작정 섞으면 어떤 화면은 Vuetify, 어떤 화면은 PrimeVue로 뒤죽박죽이 되니까 **사용 규칙**을 먼저 정했다.

## 포함한 것

```
Vue 3, Vuetify, PrimeVue, Pinia, Vue Router, Axios
공통 레이아웃, 공통 인증
```

딱 이 정도만 넣었다. 템플릿은 가벼워야 가져다 쓰기 쉽다.

## 폴더 구조

```
src/
├─ layouts/
├─ views/
├─ components/
│  ├─ common/     # 라이브러리와 상관없는 공통 컴포넌트
│  ├─ prime/      # PrimeVue를 감싼 컴포넌트
│  └─ vuetify/    # Vuetify를 감싼 컴포넌트
├─ stores/
├─ router/
├─ api/
└─ plugins/
```

## 역할 나누기

| Vuetify가 맡는 것 | PrimeVue가 맡는 것 |
| --- | --- |
| 앱 레이아웃, 반응형 그리드 | DataTable |
| Navigation Drawer, App Bar | Tree, TreeTable |
| 대시보드 카드 | PickList |
| 폼 레이아웃 | 그 밖의 복잡한 업무용 컴포넌트 |

화면의 뼈대와 일반적인 UI는 Vuetify, 필터·정렬·그룹·가상 스크롤이 많이 필요한 데이터 컴포넌트는 PrimeVue가 강하다.

## 플러그인 등록

```ts
// plugins/index.ts
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

export const vuetify = createVuetify({ /* 테마, 기본값 */ })

export function registerPlugins(app: App) {
  app.use(vuetify)
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: '.app-dark',
        cssLayer: { name: 'primevue', order: 'vuetify, primevue' },
      },
    },
  })
}
```

- 두 라이브러리의 CSS가 서로 덮어쓰지 않게 PrimeVue 스타일을 CSS 레이어에 넣었다.
- 다크 모드는 두 라이브러리가 따로 관리한다. Vuetify 테마를 바꿀 때 `<html>`에 `app-dark` 클래스를 같이 붙였다 떼서 PrimeVue도 따라오게 했다.
- PrimeVue 테마 패키지 이름은 버전에 따라 다르니(`@primevue/themes` → `@primeuix/themes`) 설치한 버전 문서를 확인한다.

## 컴포넌트는 한 번 감싸서 쓰기

화면에서 PrimeVue의 `DataTable`을 직접 쓰지 않고 `components/prime/AppDataTable.vue`로 한 번 감쌌다. 나중에 라이브러리를 바꾸거나 공통 옵션(페이지 크기, 빈 화면 문구)을 바꿀 때 한 곳만 고치면 된다.

## PrimeVue 프로젝트를 Vuetify로 옮긴다면

보일러플레이트를 만들면서, 기존 PrimeVue 프로젝트들을 Vuetify 기반 포털로 합치는 방법도 같이 정리했다.

### UI만 바꾸는 일이 아니다

옮길 때는 세 가지를 같이 다뤄야 한다.

1. **비즈니스 로직**: API 호출, 데이터 가공, 상태 관리, 권한 처리, 공통 유틸
2. **UI 컴포넌트**: PrimeVue → Vuetify 교체
3. **라우팅**: 각 프로젝트의 `/dashboard`를 포털의 `/apps/서비스명/dashboard`처럼 합치기

| PrimeVue | Vuetify |
| --- | --- |
| DataTable | v-data-table |
| Tree | v-treeview |
| Dialog | v-dialog |
| Dropdown (v4: Select) | v-select |
| TabView (v4: Tabs) | v-tabs |
| Panel | v-expansion-panels |

### 순서

1. 서비스별 기능 목록 정리
2. **UI와 로직 분리**: `api/`, `stores/`, `composables/`, `utils/`로 빼서 UI와 상관없이 재사용 가능하게
3. 로직은 그대로 두고 화면만 Vuetify로 다시 작성

    ```vue
    <!-- 기존 -->
    <DataTable :value="items"><Column field="name" /></DataTable>

    <!-- 변경 -->
    <v-data-table :items="items" :headers="headers" />
    ```

    ```ts
    // 데이터 조회 로직은 그대로
    const items = ref([])
    onMounted(async () => { items.value = await getItems() })
    ```

4. 메뉴와 권한을 포털에서 통합 관리
5. 라우팅을 포털 라우터 하나로 통합

### 대안: 마이크로 프론트엔드

전부 다시 만들지 않고, 포털(Vuetify)은 로그인·메뉴·권한만 맡고 기존 PrimeVue 서비스는 그대로 연결하는 방법도 있다.

| | 전체 이관 | 마이크로 프론트엔드 |
| --- | --- | --- |
| UI 통일성 | 높음 | 낮음 |
| 개발 비용·기간 | 높음, 김 | 낮음, 짧음 |
| 운영 리스크 | 높음 | 낮음 |
| 유지 보수 | 하나로 모임 | 서비스별로 흩어짐 |

이미 운영 중인 서비스라면 전부 다시 만드는 건 비용 대비 효과가 낮다. 현실적인 순서는

1. 포털(Vuetify)과 통합 로그인·권한부터 만들고
2. 기존 PrimeVue 서비스는 연결만 하고
3. 새 기능은 Vuetify 기준으로 만들면서
4. 기존 화면은 하나씩 옮기는 것

그리고 그 과정에서 두 라이브러리가 같이 있는 기간이 꽤 길어질 테니, 위의 보일러플레이트처럼 역할을 정해 두는 게 도움이 된다.
