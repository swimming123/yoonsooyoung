---
title: 이름이 다른 같은 제품 판별하기 (문자열 정규화와 비교)
date: 2026-03-04
summary: "NVIDIA H100 80GB HBM3"와 "H100-SXM5-80GB"가 같은 GPU라는 걸 코드로 알아내기 위한 정규화, 별칭 사전, 정규식, 퍼지 매칭
tags: [JavaScript, 정규식, 데이터]
---

API에서 받아 온 GPU 이름으로 화면의 선택 상자(`v-select`)에서 해당 모델을 자동으로 골라 줘야 했다. 그런데 같은 GPU인데도 이름이 이런 식으로 들어왔다.

```
NVIDIA H100 80GB HBM3
H100-SXM5-80GB
```

둘 다 H100인데 `===`로 비교하면 당연히 `false`다. 데이터를 다루다 보면 아주 흔한 문제라서 접근 방법을 정리해 봤다.

## 네 가지 접근

### 1. 정규화 (normalization)

비교하기 전에 형식을 맞춘다.

- 대소문자 통일
- 하이픈, 슬래시, 공백 같은 특수문자 제거 또는 통일
- 의미 없는 단어(NVIDIA, GPU, 메모리 종류 등) 제거

`nvidia h100 80gb hbm3` vs `h100 sxm5 80gb` → 훨씬 비교하기 쉬운 상태가 된다.

### 2. 별칭 사전 (alias / canonical mapping)

여러 이름을 하나의 **대표 키**에 연결하는 사전을 관리한다.

```js
{ H100: ['NVIDIA H100', 'H100-SXM5', 'H100-PCIe', 'H100-80GB'] }
```

가장 확실하다. 새 모델이 나와도 코드가 아니라 데이터(JSON이나 DB)만 추가하면 된다. 대신 사람이 계속 관리해야 한다.

### 3. 정규식으로 핵심 코드 뽑기

GPU 모델명은 대부분 "영문자 하나 + 숫자 2~3개"(H100, A100, L40, B200) 규칙을 따른다. 이 패턴만 뽑아내면 사전에 없는 이름도 꽤 잡힌다.

```js
/[A-Z]\d{2,3}/
```

### 4. 부분 일치, 퍼지 매칭

- 부분 일치: 선택지(H100, A100…)를 돌면서 원본 문자열에 포함(`includes`)돼 있는지 본다.
- 퍼지 매칭: 레벤슈타인 거리 같은 알고리즘으로 두 문자열이 얼마나 비슷한지 점수를 매기고, 기준 이상이면 같은 걸로 본다.

퍼지 매칭은 `H100`과 `H200`처럼 한 글자 차이로 전혀 다른 제품이 되는 경우가 있어서 이번 문제에는 맞지 않았다.

## 구현: 별칭 사전 + 정규식

결론은 2번과 3번을 섞는 것이었다. 사전에 있으면 사전을 따르고, 없으면 정규식으로 뽑는다.

```js
// 1. 별칭 사전: 규칙으로 안 되는 것만 사람이 등록
const ALIAS_MAP = {
  'RTX PRO 6000 BLACKWELL SERVER EDITION': 'RTX6000',
  'RTX PRO 6000': 'RTX6000',
}

// 2. 정규화
function normalize(str) {
  return str
    .toUpperCase()
    .replace(/NVIDIA|GPU/g, '')
    .replace(/HBM\d+/g, '')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// 3. 대표 키 만들기
function getCanonicalGPU(str) {
  if (!str) return null
  const normalized = normalize(str)

  if (ALIAS_MAP[normalized]) return ALIAS_MAP[normalized] // 사전이 항상 먼저

  const sku = normalized.match(/\b[A-Z]\d{2,3}[A-Z]?\b/) // H100, L40S, B200
  if (sku) return sku[0]

  const fourDigits = normalized.match(/\b\d{4}\b/) // RTX 6000 계열
  if (fourDigits) return fourDigits[0]

  return null
}

function isSameGPU(a, b) {
  const ka = getCanonicalGPU(a)
  return ka !== null && ka === getCanonicalGPU(b)
}
```

```js
isSameGPU('NVIDIA H100 80GB HBM3', 'H100-SXM5-80GB')               // true
isSameGPU('NVIDIA B200', 'B200-SXM')                               // true
isSameGPU('RTX PRO 6000 Blackwell Server Edition', 'RTX PRO 6000') // true
isSameGPU('NVIDIA L40S', 'L40')                                    // false (다른 제품)
```

### 처음 버전에서 고친 것

- **사전을 마지막에 확인했었다.** 사전은 "규칙으로는 틀리는 경우를 사람이 바로잡는 곳"이니까 가장 먼저 봐야 한다. 나중에 보면 정규식이 먼저 엉뚱한 값을 뽑아 버리면 사전이 쓰일 기회가 없다.
- **L40S가 L40으로 잘렸다.** 처음 정규식은 `[A-Z]\d{2,3}`라서 뒤의 `S`를 버렸다. L40S와 L40은 다른 제품이라 끝의 영문자 하나(`[A-Z]?`)까지 포함하고, 단어 경계(`\b`)로 감쌌다.
- **둘 다 null이면 같다고 나왔다.** 아무것도 못 뽑은 두 문자열이 `null === null`로 같은 제품이 돼 버려서, null이면 false로 처리했다.

## 화면에 적용

```js
onMounted(async () => {
  const info = await fetchServerInfo()
  const key = getCanonicalGPU(info.gpuName)
  const option = gpuOptions.value.find((o) => getCanonicalGPU(o.label) === key)
  if (option) selectedGpu.value = option.value
})
```

```
API 데이터       → "NVIDIA H100 80GB HBM3"
대표 키 추출     → "H100"
선택지와 비교    → 목록에 "H100"이 있는지 확인
자동 선택        → selectedGpu = "H100"
```

## 정리

- 문자열을 비교하기 전에 먼저 **정규화**해서 형식을 맞춘다.
- 규칙(정규식)으로 대부분을 처리하고, 규칙이 틀리는 것만 **사전**으로 바로잡는다. 사전이 우선이다.
- 한 글자 차이로 다른 제품이 되는 데이터에는 퍼지 매칭을 조심해서 쓴다.

참고: [Canonicalization](https://en.wikipedia.org/wiki/Canonicalization), [Approximate string matching](https://en.wikipedia.org/wiki/Approximate_string_matching)
