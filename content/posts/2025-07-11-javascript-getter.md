---
title: "JavaScript 접근자 프로퍼티 get(){}로 부모·자식 구분하기"
date: 2025-07-11
summary: 인스턴스 ID 규칙으로 부모와 자식을 나누면서 써 본 getter와 setter, 그리고 행 클릭과 아이콘 클릭 이벤트 나누기
tags: [JavaScript, Vue]
---

목록에 들어오는 인스턴스를 ID 규칙으로 구분해야 했다. ID가 `xxx-0`으로 끝나면 부모, `xxx-1`, `xxx-2`처럼 끝나면 그 부모의 자식이다. 이걸 매번 문자열로 검사하지 않으려고 객체의 **접근자 프로퍼티** `get(){}`를 써 봤다.

## get(){}: getter

프로퍼티를 읽을 때 함수가 실행되고, 그 함수가 돌려준 값이 프로퍼티 값이 된다. ([모던 JavaScript 튜토리얼: 프로퍼티 getter와 setter](https://ko.javascript.info/property-accessors))

```js
const instance = {
  id: 'col-a1b2-0',
  get isParent() {
    return this.id.endsWith('-0')
  },
  get groupKey() {
    return this.id.slice(0, this.id.lastIndexOf('-'))
  },
}

instance.isParent // true  (괄호 없이 값처럼 읽는다)
instance.groupKey // 'col-a1b2'
```

`id`가 바뀌면 `isParent`와 `groupKey`도 따라서 바뀐다. 값을 따로 저장하지 않으니 둘이 어긋날 일이 없다.

getter만 있는 프로퍼티에 값을 넣으면 바뀌지 않는다. 일반 모드에서는 조용히 무시되고, strict 모드(클래스 안, ES 모듈 포함)에서는 TypeError가 난다.

```js
instance.isParent = false
// strict 모드: TypeError: Cannot set property isParent of #<Object> which has only a getter
```

## set(){}: setter로 값 통제하기

setter를 같이 쓰면 들어오는 값을 검사할 수 있다. 객체 지향의 캡슐화와 같은 이야기다.

```js
const item = {
  _count: 0,
  get count() {
    return this._count
  },
  set count(value) {
    if (value < 0) {
      console.warn('개수는 음수가 될 수 없어요')
      return
    }
    this._count = value
  },
}

item.count = 3  // OK
item.count = -1 // 경고만 남고 3 그대로
```

밑줄(`_`)로 시작하는 프로퍼티는 "안에서만 쓰는 값"이라는 관례다. 밖에서 접근은 할 수 있지만 건드리지 않는다.

## 부모-자식 구조로 묶기

getter로 부모·자식을 판별한 뒤에는 데이터를 이런 트리 모양으로 묶었다.

```js
const groups = [
  {
    parent: { id: 'col-a1b2-0', name: '부모 1' },
    children: [
      { id: 'col-a1b2-1', name: '자식 1-1' },
      { id: 'col-a1b2-2', name: '자식 1-2' },
    ],
    isOpen: false,
  },
]
```

화면에서는 부모가 대표 행이 되고, 부모를 펼치면 자식 행들이 아래에 보인다.

## 행 클릭과 아이콘 클릭 나누기

부모 행을 클릭하면 상세로 이동하고, 행 안의 화살표 아이콘을 클릭하면 자식을 펼치게 하고 싶었다. 그런데 아이콘을 클릭하면 행 클릭까지 같이 실행됐다.

DOM 이벤트는 클릭한 요소에서 시작해서 부모 요소로 거슬러 올라가며 전달된다(**이벤트 버블링**). 그래서 아이콘에서는 전파를 막아야 한다. Vue에서는 `.stop` 수식어가 `event.stopPropagation()`과 같다.

```vue
<tr @click="openDetail(group.parent)">
  <td>
    <v-icon @click.stop="group.isOpen = !group.isOpen">mdi-chevron-down</v-icon>
    {{ group.parent.name }}
  </td>
</tr>
```

| 클릭한 곳 | 실행되는 것 |
| --- | --- |
| 화살표 아이콘 | 펼치기/접기만 (`.stop`으로 전파 차단) |
| 아이콘 밖의 행 | 상세 이동 |

## 정리

- ID 같은 규칙에서 파생되는 값은 getter로 만들면 따로 저장할 필요가 없다.
- setter로 들어오는 값을 검사할 수 있다.
- 부모 요소와 자식 요소에 모두 클릭이 있으면 자식 쪽에서 `.stop`으로 버블링을 막는다.
