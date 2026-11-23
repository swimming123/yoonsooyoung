---
title: "테이블 정렬: 오름차순 → 내림차순 → 해제, 그리고 다중 정렬"
date: 2025-12-03
summary: 헤더를 클릭할 때마다 정렬이 바뀌는 테이블을 만들고, 여러 열 기준 정렬까지 넓혀 본 기록
tags: [JavaScript, React, 테이블]
---

목록 테이블에서 헤더를 누르면 정렬되게 해 달라는 요청이 있었다. 헤더를 누를 때마다 **오름차순 → 내림차순 → 정렬 해제** 순서로 바뀌고, 정렬 중인 열에는 화살표가 보이는 방식이다. 여러 열을 동시에 기준으로 쓰는 다중 정렬은 [bootstrap-table의 Multiple Sort](https://bootstrap-table.com/docs/extensions/multiple-sort/)를 참고했다.

예시 데이터는 이런 모양이다.

```js
const data = [
  { id: 109, category: '학습', type: 'PyTorch', name: 'pytorch-25.08' },
  { id: 108, category: '학습', type: 'NeMo', name: 'nemo-25.09' },
  { id: 59, category: '배포', type: 'Triton', name: 'triton-server' },
  { id: 21, category: '실습', type: 'Streamlit', name: 'playground' },
  // ...
]
```

## 1. 한 열 정렬 (React)

정렬 상태는 "어떤 열을, 어느 방향으로"만 기억하면 된다.

```jsx
const [sort, setSort] = useState({ key: null, direction: null })

const handleSort = (key) => {
  if (sort.key !== key) return setSort({ key, direction: 'asc' })
  if (sort.direction === 'asc') return setSort({ key, direction: 'desc' })
  setSort({ key: null, direction: null }) // 세 번째 클릭: 해제
  setPage(1)
}
```

정렬된 데이터는 `useMemo`로 계산한다. 원본 배열을 직접 `sort()`하면 원본이 바뀌니 복사해서 정렬한다.

```jsx
const sorted = useMemo(() => {
  if (!sort.key) return data
  const dir = sort.direction === 'asc' ? 1 : -1
  return [...data].sort((a, b) => compare(a[sort.key], b[sort.key]) * dir)
}, [data, sort])
```

### 비교 함수

처음엔 `a < b`로 비교했는데, 그러면 문자열이 사전 순으로 비교돼서 `'pytorch-25.10'`과 `'pytorch-25.9'`처럼 숫자가 섞인 이름이 이상하게 정렬된다. 한글이 섞이면 더 그렇다. `localeCompare`의 `numeric` 옵션을 쓰면 해결된다.

```js
const collator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' })

function compare(a, b) {
  if (a == null) return 1   // 빈 값은 항상 뒤로
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return collator.compare(String(a), String(b))
}
```

### 헤더 아이콘

```jsx
const SortIcon = ({ column }) => {
  if (sort.key !== column) return <ChevronsUpDown className="text-gray-400" />
  return sort.direction === 'asc' ? <ChevronUp /> : <ChevronDown />
}

<th key={col.key}>
  <button onClick={() => handleSort(col.key)}>
    {col.label} <SortIcon column={col.key} />
  </button>
</th>
```

정렬 기준이 바뀌면 보던 페이지가 의미가 없어지니 첫 페이지로 돌려보냈다.

## 2. 다중 정렬로 넓히기

"분류별로 묶고, 같은 분류 안에서는 이름순"처럼 기준이 여러 개 필요할 때가 있다. 정렬 상태를 하나가 아니라 **배열**로 들고 있으면 된다.

```js
// [{ key: 'category', direction: 'asc' }, { key: 'name', direction: 'desc' }]
const [sorts, setSorts] = useState([])

const handleSort = (key, additive) => {
  setSorts((prev) => {
    const current = prev.find((s) => s.key === key)
    const next = !current ? { key, direction: 'asc' }
      : current.direction === 'asc' ? { key, direction: 'desc' }
      : null // 해제
    const others = additive ? prev.filter((s) => s.key !== key) : []
    return next ? [...others, next] : others
  })
}

// Shift+클릭이면 기존 기준에 추가
<button onClick={(e) => handleSort(col.key, e.shiftKey)}>
```

정렬할 때는 첫 번째 기준으로 비교하고, 같으면 다음 기준으로 넘어간다.

```js
const sorted = useMemo(() => {
  if (!sorts.length) return data
  return [...data].sort((a, b) => {
    for (const { key, direction } of sorts) {
      const r = compare(a[key], b[key])
      if (r !== 0) return direction === 'asc' ? r : -r
    }
    return 0
  })
}, [data, sorts])
```

여러 기준이 걸려 있으면 헤더 아이콘 옆에 순서 번호(1, 2…)를 같이 보여 주면 헷갈리지 않는다.

## 정리

- 정렬 상태는 `{ key, direction }` 하나(또는 그 배열)로 충분하다.
- 원본 배열은 건드리지 말고 복사해서 정렬한다.
- 문자열에 숫자가 섞이면 `Intl.Collator`의 `numeric: true`로 사람이 기대하는 순서가 된다.
- 데이터가 많아서 서버에서 페이지를 나눠 받는다면, 정렬도 서버에 `?ordering=category,-name`처럼 넘겨서 해야 한다. 프론트에서는 지금 받은 페이지만 정렬되기 때문이다.
