import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'

// 휴대폰 기울기(자이로) · 흔들기(가속도) 를 읽어 파티클이 기울인 쪽으로 날리게 합니다.
// 기존 웨딩플래너 invite.html 의 모션 코드를 Vue 로 옮긴 것.
//  - deviceorientation: gamma(좌우) · beta(앞뒤) → tilt.tx / tilt.ty (-1 ~ 1)
//  - devicemotion: 가속도 변화나 회전 속도가 크면 '흔들기' 로 보고 onShake 호출
//  - iOS 는 사용자가 화면을 누른 순간에만 센서 권한을 물을 수 있어서, 첫 터치 때 요청합니다.
//  - 센서가 없는 PC 는 마우스 위치로 대신합니다.

type PermissionCapable = { requestPermission?: () => Promise<'granted' | 'denied'> }

const clamp = (v: number) => Math.max(-1, Math.min(1, v))

export function useTilt(options: { onShake?: () => void; pointerTarget?: () => HTMLElement | undefined } = {}) {
  const tilt = reactive({ x: 0, y: 0, tx: 0, ty: 0 })
  const sensorOn = ref(false)
  /** iOS 처럼 권한을 따로 물어야 하는 기기인지 */
  const needsPermission = ref(false)
  let baseBeta: number | null = null
  let lastA: { x: number; y: number; z: number } | null = null
  let lastShake = 0
  let asked = false

  function onOrientation(e: DeviceOrientationEvent) {
    if (e.gamma == null || e.beta == null) return
    sensorOn.value = true
    if (baseBeta === null) baseBeta = e.beta // 처음 잡은 각도를 중립으로
    baseBeta += (e.beta - baseBeta) * 0.003 // 천천히 재보정 (누워서 봐도 자연스럽게)
    tilt.tx = clamp(e.gamma / 25)
    tilt.ty = clamp((e.beta - baseBeta) / 25)
  }

  function onMotion(e: DeviceMotionEvent) {
    const a = e.accelerationIncludingGravity
    const r = e.rotationRate
    let jolt = 0
    if (a && a.x != null && a.y != null && a.z != null) {
      if (lastA) jolt = Math.abs(a.x - lastA.x) + Math.abs(a.y - lastA.y) + Math.abs(a.z - lastA.z)
      lastA = { x: a.x, y: a.y, z: a.z }
    }
    const spin = r ? Math.abs(r.alpha ?? 0) + Math.abs(r.beta ?? 0) + Math.abs(r.gamma ?? 0) : 0
    const now = Date.now()
    if ((jolt > 30 || spin > 420) && now - lastShake > 1200) {
      lastShake = now
      options.onShake?.()
    }
  }

  /** 센서 켜기. iOS 에서는 터치/클릭 이벤트 안에서 불러야 권한 창이 떠요. */
  async function enable(): Promise<boolean> {
    if (asked) return sensorOn.value
    asked = true
    const DM = (globalThis as { DeviceMotionEvent?: PermissionCapable }).DeviceMotionEvent
    const DO = (globalThis as { DeviceOrientationEvent?: PermissionCapable }).DeviceOrientationEvent
    if (!DM && !DO) return false
    try {
      const reqs: Promise<string>[] = []
      if (typeof DM?.requestPermission === 'function') reqs.push(DM.requestPermission().catch(() => 'denied'))
      if (typeof DO?.requestPermission === 'function') reqs.push(DO.requestPermission().catch(() => 'denied'))
      if (reqs.length && !(await Promise.all(reqs)).includes('granted')) return false
    } catch {
      return false
    }
    addEventListener('deviceorientation', onOrientation, true)
    addEventListener('devicemotion', onMotion, true)
    needsPermission.value = false
    return true
  }

  function onPointer(e: PointerEvent) {
    if (sensorOn.value || e.pointerType === 'touch') return
    const el = options.pointerTarget?.()
    const box = el ? el.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight }
    tilt.tx = clamp(((e.clientX - box.left) / box.width - 0.5) * 2)
    tilt.ty = clamp(((e.clientY - box.top) / box.height - 0.5) * 2)
  }
  function onPointerLeave() {
    if (!sensorOn.value) tilt.tx = tilt.ty = 0
  }
  // 첫 터치 때 권한 요청 (iOS) — 안드로이드는 권한 없이 바로 켜져요.
  function onFirstTap() {
    void enable()
  }

  /** 매 프레임 부르면 목표값으로 부드럽게 따라갑니다. */
  function step() {
    tilt.x += (tilt.tx - tilt.x) * 0.09
    tilt.y += (tilt.ty - tilt.y) * 0.09
  }

  onMounted(() => {
    const DO = (globalThis as { DeviceOrientationEvent?: PermissionCapable }).DeviceOrientationEvent
    needsPermission.value = typeof DO?.requestPermission === 'function'
    if (!needsPermission.value) void enable()
    else addEventListener('click', onFirstTap, { once: true, capture: true })
    const target = options.pointerTarget?.() ?? window
    target.addEventListener('pointermove', onPointer as EventListener, { passive: true })
    target.addEventListener('pointerleave', onPointerLeave)
  })

  onBeforeUnmount(() => {
    removeEventListener('deviceorientation', onOrientation, true)
    removeEventListener('devicemotion', onMotion, true)
    removeEventListener('click', onFirstTap, { capture: true })
    const target = options.pointerTarget?.() ?? window
    target.removeEventListener('pointermove', onPointer as EventListener)
    target.removeEventListener('pointerleave', onPointerLeave)
  })

  return { tilt, sensorOn, needsPermission, enable, step }
}
