---
title: 추론에서 NVLink가 있고 없고의 차이 (GPU 간 통신 병목)
date: 2026-06-10
summary: 웹 개발자 눈으로 정리한 GPU 서버의 병목, PCIe와 NVLink, RDMA, InfiniBand, 그리고 GPU를 여러 장 쓸 때 통신이 왜 중요해지는지
tags: [GPU, 인프라, AI]
---

GPU 서버 이야기를 들으면 늘 GPU 이름(H100, B200…)과 VRAM 크기부터 나온다. 그런데 NVLink가 있는 서버와 없는 서버는 같은 GPU를 꽂아도 성능이 크게 다를 수 있다고 해서 공부해 봤다. 당장 장비를 고르려는 건 아니고, 앞으로 모델이 커지면 GPU 자체보다 **GPU 사이의 통신**이 중요해질 수 있다는 감을 잡고 싶었다.

## 웹 개발자 관점에서 보면

웹에서 서비스가 느리면 먼저 어디가 병목인지 나눠 본다.

```
CPU 부족? DB 부족? 네트워크 부족?
```

AI 서버도 똑같다.

```
VRAM 부족? GPU 연산 부족? GPU 간 통신 부족? 스토리지 부족?
```

GPU 스펙보다 **병목을 먼저 찾는 관점**이 핵심이었다.

## 왜 GPU를 여러 장 쓰나

대부분 VRAM이 모자라서다.

```
모델 크기: 150GB
GPU 한 장 VRAM: 96GB
→ 한 장에 안 들어감 → 여러 장에 나눠 담아야 함
```

모델을 여러 GPU에 나눠 담으면(텐서 병렬, 파이프라인 병렬) 계산하는 중간중간 GPU끼리 데이터(활성값, 학습이라면 그래디언트와 가중치)를 주고받아야 한다. GPU를 늘리는 순간 **계산 문제가 통신 문제로** 바뀐다.

## PCIe와 NVLink

| | PCIe | NVLink |
| --- | --- | --- |
| 무엇 | CPU, GPU, 네트워크 카드를 잇는 표준 인터페이스 | NVIDIA GPU끼리 직접 잇는 전용 연결 |
| 대역폭(대략) | PCIe 4.0 x16 약 32GB/s, 5.0 x16 약 64GB/s (한 방향) | H100 세대 GPU당 약 900GB/s |
| 비유 | 일반 사내망 | GPU 전용 초고속 내부망 |

PCIe로도 GPU끼리 직접(P2P) 통신할 수는 있지만, 메인보드 구성에 따라 CPU 쪽을 거쳐 가기도 하고 무엇보다 대역폭이 한참 작다. GPU 여러 장이 계속 데이터를 주고받으면 여기가 병목이 된다.

**같은 소프트웨어를 써도 하드웨어 연결 방식에 따라 성능이 크게 달라진다.**

추론에서도 마찬가지다. 모델이 한 GPU에 들어가면 NVLink가 거의 상관없다. 하지만 모델을 여러 GPU에 나눠 돌리면 토큰을 하나 만들 때마다 GPU 사이에 통신이 일어나서, NVLink가 있으면 눈에 띄게 빨라진다는 사용 후기가 많다([RTX 3090 두 장 NVLink 후기](https://www.reddit.com/r/LocalLLaMA/comments/1j8i9rc/nvlink_improves_dual_rtx_3090_inference/)).

## DGX가 비싼 이유

처음엔 "DGX = GPU가 좋은 장비"라고 생각했는데, 정확히는 "**GPU 통신 구조가 좋은 장비**"에 가깝다. NVLink와 NVSwitch로 모든 GPU가 서로 빠르게 연결돼 있다.

| | 일반 GPU 서버 | DGX급 |
| --- | --- | --- |
| 가격 | 상대적으로 저렴 | 매우 비쌈 |
| GPU 교체·확장 | 유연함 | 어려움 |
| GPU 간 통신 | PCIe 위주 | NVLink + NVSwitch |
| 대규모 학습 | 통신 병목 | 유리 |
| 전력·냉각 | 상대적으로 여유 | 요구 사항이 높음 |

장비 가격만 비교하면 안 되고, 학습이 며칠에서 몇십 일까지 줄어드는 시간, 전력과 냉각, 운영 비용까지 같이 봐야 한다.

## 서버가 여러 대가 되면: RDMA와 InfiniBand

한 서버 안의 GPU는 NVLink로 잇는다. 서버가 여러 대가 되면 서버끼리도 빠르게 통신해야 한다.

### RDMA (Remote Direct Memory Access)

```
기존:  CPU 개입 → 메모리 복사 → 네트워크 전송
RDMA:  네트워크 카드가 메모리 ↔ 메모리로 바로 전송
```

CPU가 덜 끼어드니 지연이 줄고 CPU 부하도 준다.

### InfiniBand

RDMA를 기본으로 하는 AI·HPC용 고속 네트워크다. NVIDIA는 InfiniBand 장비를 만들던 Mellanox를 인수해서 GPU부터 서버 간 네트워크까지 갖추게 됐다.

```
서버 1대 안의 GPU끼리   → NVLink
서버 여러 대 사이       → InfiniBand (RDMA)
```

## 확장 과정 한눈에

```
GPU 1장 → VRAM 부족 → 멀티 GPU → GPU 간 통신 → PCIe 병목 → NVLink
       → 서버 여러 대 → RDMA → 대규모 클러스터 → InfiniBand
```

## GPU 스펙보다 먼저 물어볼 것

1. 학습인가, 추론인가?
2. 모델 크기는? VRAM에 들어가나?
3. 멀티 GPU가 필요한가?
4. 그렇다면 통신 병목이 생기나?

그다음에 NVLink, RDMA, InfiniBand, DGX가 필요한지를 따진다.

## 더 공부할 것

- VRAM과 모델 크기의 관계
- Tensor Parallelism / Data Parallelism
- AllReduce (GPU 간 동기화)
- NVLink / NVSwitch 토폴로지

> 웹 서비스가 커지면 CPU보다 네트워크 구조가 중요해지듯, AI 시스템도 GPU 성능보다 GPU 간 통신이 성능을 결정하는 구간이 있다.
