---
title: 자바 스트림
date: 2024-03-23
summary: 바이트·문자 입출력 스트림, 보조 스트림, 직렬화와 역직렬화, File 클래스 정리
tags: [자바]
---

## 입출력 스트림

- 스트림은 **단방향**이다. 데이터를 주고받으려면 양쪽 모두 입력 스트림과 출력 스트림이 필요하다.
- `java.io` 패키지에서 제공한다.
- **입력 스트림**: 읽어 들인다. `InputStream`, `Reader`
- **출력 스트림**: 내보낸다. `OutputStream`, `Writer`

## 바이트 스트림

그림, 멀티미디어, 문자 등 모든 종류의 데이터를 입출력할 때 쓴다. 1바이트 단위로 처리하고, 문자도 바이트 스트림으로 전송한다!

### 출력: OutputStream

- 최상위 클래스이자 추상 클래스. 모든 바이트 출력 스트림은 이걸 상속받아 만든다.
- 하위 클래스: `FileOutputStream`, 기능을 더한 `PrintStream`, `BufferedOutputStream`, `DataOutputStream`
- 메서드
    - `write(int b)`: 1바이트 출력 (기본, 엄청 느림)
    - `write(byte[] b)`: 배열의 모든 바이트 출력 (좀 빠름)
    - `flush()`: 출력 버퍼에 남아 있는 바이트를 모두 출력
    - `close()`: 출력 스트림을 닫고 메모리 해제 (`finally`나 `AutoCloseable`로 처리)

### 입력: InputStream

- 기능을 더한 하위 클래스: `BufferedInputStream`, `DataInputStream`
- 메서드
    - `read()`: 1바이트를 읽어 `int`로 리턴. 4바이트 중 끝 1바이트만 쓴다. 더 읽을 바이트가 없으면 -1을 리턴하므로, -1이면 파일의 끝이다.
    - `read(byte[] b)`
    - `close()`

## 문자 스트림

문자만 입출력할 때 쓴다. 2바이트(`char`) 단위로 처리한다. 문자는 바이트 스트림으로 전송받은 뒤 문자 스트림으로 변환한다!

- 출력: `Writer`
    - `PrintWriter`: 예전 웹 자바에서 브라우저와 통신할 때 썼다고 한다.
    - `flush()`, `close()`
- 입력: `Reader`
    - `read(char[] cbuf)`

## 보조 스트림 ★★★★★

- 다른 스트림과 연결되어 여러 편리한 기능을 제공하는 스트림. 2차 스트림이라고도 한다.
- 장치(파일)에 직접 연결되지 않고, 오직 입출력 스트림을 통해서 연결된다.

```java
보조스트림 변수 = new 보조스트림(입출력스트림);
Scanner sc = new Scanner(System.in);

보조스트림2 변수 = new 보조스트림2(보조스트림1);  // 보조 스트림끼리도 연결 가능
```

- **브리지 스트림**: 바이트 스트림을 문자 스트림으로 이어 준다. `InputStreamReader`, `OutputStreamWriter`
- **버퍼 스트림**: 성능 향상. 고속 전송 가능

### 기본 타입 스트림

`DataInputStream`, `DataOutputStream`. 순서와 자료형이 중요하다. 쓴 순서와 읽는 순서의 자료형이 같아야 한다.

### PrintStream, PrintWriter

- `PrintStream`: 바이트 출력 스트림에 `print()`, `println()` 기능을 더한 보조 스트림
- `PrintWriter`: 브리지와 버퍼 기능을 모두 갖춘 문자 출력 스트림

## 직렬화와 역직렬화

- **직렬화**: 객체를 파일이나 네트워크로 내보내려고 바이트로 바꾸는 것 (분해)
- **역직렬화**: 직렬화된 바이트에서 객체의 필드 값을 복원하는 것 (조립)

### Serializable 인터페이스

- 직렬화할 수 있다는 표시(기차표 같은 것). `implements Serializable`
- `static` 필드는 직렬화에서 빠진다.
- `transient`를 붙인 필드도 직렬화에서 빠진다.

### serialVersionUID 필드

클래스 내용이 달라져도 같은 `serialVersionUID` 값을 가지면 역직렬화할 수 있다.

## File 클래스

파일의 상태를 다루는 클래스.

- `exists()`: 존재 여부 확인
- `createNewFile()`: 새 파일 생성
- `mkdir()`: 디렉터리 생성
- `mkdirs()`: 경로상의 없는 디렉터리까지 모두 생성
