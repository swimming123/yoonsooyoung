<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { FallingEffect } from './types'
import { useTilt } from './useTilt'

// 떨어지는 파티클(꽃잎·나뭇잎·눈·하트·별). 휴대폰을 기울이면 그쪽으로 날리고, 흔들면 한 번에 흩날려요.
const props = defineProps<{
  effect: FallingEffect
  color: string
  /** 기울기·흔들기에 반응할지 */
  motion: boolean
  /** 편집 화면 미리보기: 휴대폰 틀 크기에 맞추고 마우스로 기울기 흉내 */
  embedded?: boolean
}>()
const emit = defineEmits<{ shake: [] }>()

const canvas = ref<HTMLCanvasElement>()
const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

const { tilt, step } = useTilt({
  onShake: () => {
    if (!props.motion) return
    burst()
    emit('shake')
  },
  // 편집 화면에서는 휴대폰 틀 위 마우스 위치로 기울기를 흉내 냅니다.
  pointerTarget: () => canvas.value?.closest<HTMLElement>('[data-tilt-root]') ?? undefined,
})

const GLYPH: Record<Exclude<FallingEffect, 'none' | 'petal'>, string> = {
  leaf: '🍃',
  snow: '❄',
  heart: '♥',
  star: '✦',
}

interface P {
  x: number
  y: number
  s: number
  r: number
  vr: number
  vy: number
  vx: number
  ph: number
  a: number
  bx: number
  by: number
  burst: boolean
  warm: boolean
}

let W = 0
let H = 0
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let particles: P[] = []

function make(fromBurst = false): P {
  const p: P = {
    x: Math.random() * W,
    y: -20 - Math.random() * H * 0.5,
    s: 6 + Math.random() * 7,
    r: Math.random() * 6.28,
    vr: (Math.random() - 0.5) * 0.04,
    vy: (props.effect === 'snow' ? 0.35 : 0.5) + Math.random() * 0.9,
    vx: 0,
    ph: Math.random() * 6.28,
    a: 0.5 + Math.random() * 0.4,
    bx: 0,
    by: 0,
    burst: fromBurst,
    warm: Math.random() < 0.25,
  }
  if (fromBurst) {
    p.x = W / 2 + (Math.random() - 0.5) * 120
    p.y = H * 0.55
    const ang = Math.random() * 6.28
    const sp = 4 + Math.random() * 9
    p.bx = Math.cos(ang) * sp
    p.by = Math.sin(ang) * sp - 6
    p.s += 3
  }
  return p
}

function seed() {
  particles = []
  if (props.effect === 'none' || reduce) return
  for (let i = 0; i < 20; i++) {
    const p = make()
    p.y = Math.random() * H
    particles.push(p)
  }
}

function burst() {
  if (props.effect === 'none' || reduce) return
  for (let i = 0; i < 60; i++) particles.push(make(true))
  navigator.vibrate?.(30)
}

function resize() {
  const el = canvas.value
  if (!el) return
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const box = el.getBoundingClientRect()
  W = box.width
  H = box.height
  el.width = W * dpr
  el.height = H * dpr
  ctx = el.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

function draw(p: P) {
  if (!ctx) return
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.r)
  if (props.effect === 'petal') {
    // 꽃잎: 기존 청첩장과 같은 베지어 꽃잎, 뒤집히는 느낌으로 세로 크기를 흔듦
    ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.ph)))
    ctx.fillStyle = p.warm ? `rgba(255,226,200,${p.a})` : rgba(props.color, p.a * 0.8)
    const s = p.s
    ctx.beginPath()
    ctx.moveTo(0, -s)
    ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.6, 0, s)
    ctx.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.9, -s * 0.6, 0, -s)
    ctx.fill()
  } else if (props.effect !== 'none') {
    ctx.globalAlpha = p.a
    ctx.fillStyle = props.effect === 'snow' ? 'rgba(255,255,255,0.95)' : props.color
    if (props.effect === 'snow') {
      ctx.shadowColor = 'rgba(120,130,150,0.35)'
      ctx.shadowBlur = 3
    }
    ctx.font = `${p.s * 1.7}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(GLYPH[props.effect], 0, 0)
  }
  ctx.restore()
}

function loop() {
  raf = requestAnimationFrame(loop)
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)
  if (props.motion) step()
  const tx = props.motion ? tilt.x : 0
  const ty = props.motion ? tilt.y : 0
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!
    p.vx += (tx * 1.6 - p.vx) * 0.03 // 기울인 쪽으로 바람
    p.ph += 0.03
    p.x += p.vx + Math.sin(p.ph) * 0.5 + p.bx
    p.y += p.vy + ty * 0.5 + p.by
    p.bx *= 0.94
    p.by *= 0.94
    p.r += p.vr
    // 화면 밖으로 나가면: 흩날린 것은 없애고, 기본 파티클은 들어갈 쪽 반대편에서 다시 등장
    if (p.y > H + 20 || p.x < -40 || p.x > W + 40 || p.y < -H) {
      if (p.burst) {
        particles.splice(i, 1)
        continue
      }
      if (p.x < -40) p.x = W + 20
      else if (p.x > W + 40) p.x = -20
      else {
        p.y = -20
        p.x = Math.random() * W
        p.vx = 0
      }
    }
    draw(p)
  }
}

onMounted(() => {
  resize()
  seed()
  addEventListener('resize', resize)
  if (!reduce) raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  removeEventListener('resize', resize)
})
watch(
  () => props.effect,
  () => seed(),
)

defineExpose({ burst })
</script>

<template>
  <canvas ref="canvas" class="particles" :class="{ embedded }" aria-hidden="true" />
</template>

<style scoped>
.particles { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }
.particles.embedded { position: absolute; inset: 0; }
</style>
