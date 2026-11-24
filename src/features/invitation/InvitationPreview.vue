<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  calendarCells,
  ddayText,
  formatDateLong,
  formatTime,
  kakaoMapUrl,
  monthDay,
  naverMapUrl,
  parentsLine,
  smsHref,
  telHref,
  tmapUrl,
  venueLine,
} from './format'
import ParticleLayer from './ParticleLayer.vue'
import { FONTS, THEME_COLORS, type Account, type InvitationCard, type InvitationPhoto } from './types'
import { useInvitationFonts } from './useInvitationFonts'

const props = withDefaults(
  defineProps<{
    card: InvitationCard
    photos: InvitationPhoto[]
    /** 편집 화면 안의 미리보기(애니메이션·효과를 틀 안에 가둠) */
    embedded?: boolean
    /** 바뀌면 인트로를 다시 재생 */
    introKey?: number
    shareUrl?: string
  }>(),
  { embedded: false, introKey: 0, shareUrl: '' },
)

useInvitationFonts(() => props.card.template.font)

const theme = computed(() => THEME_COLORS.find((t) => t.key === props.card.template.color) ?? THEME_COLORS[0]!)
const font = computed(() => FONTS.find((f) => f.key === props.card.template.font) ?? FONTS[0]!)
const style = computed(() => ({
  '--inv-base': theme.value.base,
  '--inv-point': theme.value.point,
  '--inv-font': font.value.family,
  '--inv-scale': { S: '1', M: '1.08', L: '1.16' }[props.card.template.fontSize],
}))

// 메인 사진: 지정한 사진 → 메인으로 올린 사진. 나머지(기존 웨딩플래너 사진 포함)는 갤러리.
const mainPhoto = computed(
  () =>
    props.photos.find((p) => p.id === props.card.main.photoId) ??
    props.photos.find((p) => p.role === 'main') ??
    // 기존 웨딩플래너에서 사진만 올려 둔 시안은 첫 사진을 메인으로
    (props.card.main.photoId ? undefined : props.photos[0]),
)
const gallery = computed(() => props.photos.filter((p) => p.role !== 'main' && p.id !== mainPhoto.value?.id))
const md = computed(() => monthDay(props.card.wedding.date))
const dateLong = computed(() => formatDateLong(props.card.wedding.date))
const time = computed(() => formatTime(props.card.wedding.hour, props.card.wedding.minute))
const venue = computed(() => venueLine(props.card))
const cells = computed(() => calendarCells(props.card.wedding.date))
const dday = computed(() => ddayText(props.card.wedding.date))
const groomParents = computed(() => parentsLine(props.card.groom))
const brideParents = computed(() => parentsLine(props.card.bride))
const parentRows = computed(() => [
  { role: '신랑', parents: groomParents.value, relation: props.card.groom.relation, name: props.card.groom.name },
  { role: '신부', parents: brideParents.value, relation: props.card.bride.relation, name: props.card.bride.name },
])
const greetingLines = computed(() => props.card.greeting.body.split('\n'))
// 하객 휴대폰에서만 잠깐 보여 주는 안내
const tiltHint = ref(false)
onMounted(() => {
  if (props.embedded || props.card.main.falling === 'none' || !props.card.main.motion) return
  if (!matchMedia('(pointer: coarse)').matches) return
  setTimeout(() => (tiltHint.value = true), 1500)
  setTimeout(() => (tiltHint.value = false), 7000)
})

const transports = computed(() =>
  [
    { key: 'subway', label: '지하철', text: props.card.location.subway },
    { key: 'bus', label: '버스', text: props.card.location.bus },
    { key: 'car', label: '자가용', text: props.card.location.car },
  ].filter((t) => t.text.trim()),
)

const accountGroups = computed(() =>
  [
    { key: 'groom', label: '신랑측', list: props.card.accounts.groom },
    { key: 'bride', label: '신부측', list: props.card.accounts.bride },
  ].filter((g) => g.list.some((a) => a.number.trim())),
)
const openGroup = ref<string | null>(null)

const contacts = computed(() => {
  const rows: { side: string; label: string; name: string; contact: string }[] = []
  for (const [side, person, label] of [
    ['신랑측', props.card.groom, '신랑'],
    ['신부측', props.card.bride, '신부'],
  ] as const) {
    if (person.contact) rows.push({ side, label, name: person.name, contact: person.contact })
    if (person.father.contact && !person.father.deceased)
      rows.push({ side, label: `${label} 아버님`, name: person.father.name, contact: person.father.contact })
    if (person.mother.contact && !person.mother.deceased)
      rows.push({ side, label: `${label} 어머님`, name: person.mother.name, contact: person.mother.contact })
  }
  return rows
})

// ───── 복사 알림 ─────
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showToast(message: string) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}
async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.value = message
  } catch {
    toast.value = '복사하지 못했어요. 길게 눌러 직접 복사해 주세요.'
  }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}
function accountText(a: Account) {
  return `${a.bank} ${a.number} ${a.holder}`.trim()
}

// ───── 인트로 ─────
const introVisible = ref(false)
const typed = ref('')
let introTimers: ReturnType<typeof setTimeout>[] = []
function playIntro() {
  introTimers.forEach(clearTimeout)
  introTimers = []
  const text = props.card.main.introText.trim() || `${props.card.main.textLeft} ${props.card.main.textRight}, 결혼합니다`
  if (props.card.main.intro === 'none') {
    introVisible.value = false
    return
  }
  introVisible.value = true
  typed.value = props.card.main.intro === 'typing' ? '' : text
  let total = 900
  if (props.card.main.intro === 'typing') {
    ;[...text].forEach((_, i) => introTimers.push(setTimeout(() => (typed.value = text.slice(0, i + 1)), 120 * i + 300)))
    total = 120 * text.length + 1100
  }
  introTimers.push(setTimeout(() => (introVisible.value = false), total + 900))
}
watch(() => props.introKey, playIntro, { immediate: true })
onBeforeUnmount(() => introTimers.forEach(clearTimeout))

// ───── 갤러리 크게 보기 ─────
const shareHref = computed(() => props.shareUrl || globalThis.location?.href || '')

const lightbox = ref<number | null>(null)
function move(step: number) {
  if (lightbox.value === null) return
  const n = gallery.value.length
  lightbox.value = (lightbox.value + step + n) % n
}
</script>

<template>
  <div class="inv" :class="{ embedded }" :style="style">
    <!-- 떨어지는 효과: 휴대폰을 기울이면 그쪽으로 날리고, 흔들면 흩날려요 -->
    <div v-if="card.main.falling !== 'none'" class="falling">
      <ParticleLayer
        :effect="card.main.falling"
        :color="theme.point"
        :motion="card.main.motion"
        :embedded="embedded"
        @shake="showToast('🌸 축하해 주셔서 감사합니다')"
      />
    </div>
    <Transition name="fade">
      <p v-if="tiltHint" class="tilt-hint">화면을 톡 누르고 휴대폰을 기울여 보세요</p>
    </Transition>

    <!-- 인트로 -->
    <Transition name="intro">
      <div v-if="introVisible" class="intro">
        <p :class="{ caret: card.main.intro === 'typing' }">{{ typed }}</p>
      </div>
    </Transition>

    <!-- 메인 -->
    <section class="main" :class="[`layout-${card.main.layout}`, `bg-${card.main.background}`]">
      <template v-if="card.main.layout !== 'poster'">
        <p class="save">SAVE THE DATE</p>
        <p class="md">{{ md.month }}<span>•</span>{{ md.day }}</p>
      </template>
      <div class="photo-wrap">
        <img v-if="mainPhoto" :src="mainPhoto.image" alt="메인 사진" class="photo" />
        <div v-else-if="embedded" class="photo placeholder" aria-label="메인 사진 자리">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="16" cy="8" r="2" />
            <path d="m3 15 4-4 5 5 3-3 6 5" />
          </svg>
        </div>
        <div v-if="card.main.layout === 'poster'" class="poster-text">
          <p class="poster-date">{{ md.month }}.{{ md.day }}</p>
          <p>{{ card.main.textLeft }} {{ card.main.textMiddle }} {{ card.main.textRight }}</p>
        </div>
      </div>
      <div class="names">
        <span>{{ card.main.textLeft }}</span>
        <span class="mid">{{ card.main.textMiddle }}</span>
        <span>{{ card.main.textRight }}</span>
      </div>
      <div class="when">
        <p>{{ dateLong }}, {{ time }}</p>
        <p v-if="card.wedding.showVenue && venue">{{ venue }}</p>
      </div>
    </section>

    <!-- 인사말 -->
    <section class="greeting">
      <p class="eyebrow">Invitation</p>
      <h2 class="section-title">{{ card.greeting.title }}</h2>
      <div class="body">
        <p v-for="(line, i) in greetingLines" :key="i">{{ line || ' ' }}</p>
      </div>
      <div v-if="card.greeting.showParents" class="parents">
        <p v-for="row in parentRows" :key="row.role">
          <template v-if="row.parents">
            <span class="who">{{ row.parents }}</span><span class="rel">의 {{ row.relation }}</span>
          </template>
          <span v-else class="rel">{{ row.role }}</span>
          <strong>{{ row.name }}</strong>
        </p>
      </div>
      <div v-if="contacts.length" class="contact-box">
        <details>
          <summary>연락하기</summary>
          <ul>
            <li v-for="c in contacts" :key="c.label">
              <span class="c-label">{{ c.label }}</span>
              <span class="c-name">{{ c.name }}</span>
              <a :href="telHref(c.contact)" aria-label="전화">📞</a>
              <a :href="smsHref(c.contact)" aria-label="문자">💬</a>
            </li>
          </ul>
        </details>
      </div>
    </section>

    <!-- 예식일 달력 -->
    <section v-if="card.calendar.show && cells.length" class="calendar tinted">
      <p class="eyebrow">Wedding day</p>
      <h2 class="cal-date">{{ dateLong }}</h2>
      <p class="cal-time">{{ time }}</p>
      <div class="grid head">
        <span v-for="(w, i) in ['일', '월', '화', '수', '목', '금', '토']" :key="w" :class="{ sun: i === 0 }">{{ w }}</span>
      </div>
      <div class="grid days">
        <span
          v-for="(c, i) in cells"
          :key="i"
          :class="{ sun: c.isSunday || i % 7 === 0, on: c.isWeddingDay, empty: !c.inMonth }"
          >{{ c.inMonth ? c.day : '' }}</span
        >
      </div>
      <p v-if="card.calendar.showDday && dday" class="dday">
        {{ card.main.textLeft }} <span class="heart">♥</span> {{ card.main.textRight }}, {{ dday }}
      </p>
    </section>

    <!-- 갤러리 -->
    <section v-if="card.gallery.show && (gallery.length || embedded)" class="gallery">
      <p class="eyebrow">Gallery</p>
      <h2 class="section-title small">{{ card.gallery.title }}</h2>
      <div v-if="gallery.length" :class="card.gallery.layout === 'grid' ? 'g-grid' : 'g-slide'">
        <button v-for="(p, i) in gallery" :key="p.id" type="button" class="g-item" @click="lightbox = i">
          <img :src="p.image" :alt="`갤러리 사진 ${i + 1}`" loading="lazy" />
        </button>
      </div>
      <p v-else class="empty-note">부가 기능 탭에서 갤러리 사진을 올려 주세요.</p>
    </section>

    <!-- 오시는 길 -->
    <section v-if="card.wedding.showVenue" class="location">
      <p class="eyebrow">Location</p>
      <h2 class="section-title small">오시는 길</h2>
      <p v-if="venue || embedded" class="venue-name">{{ venue || '예식장 이름' }}</p>
      <p v-if="card.wedding.venueAddress || embedded" class="address">
        {{ card.wedding.venueAddress || '예식장 주소' }}
        <button v-if="card.wedding.venueAddress" type="button" class="mini" @click="copy(card.wedding.venueAddress, '주소를 복사했어요')">
          복사
        </button>
      </p>
      <div class="map-buttons">
        <a :href="naverMapUrl(card)" target="_blank" rel="noopener">네이버 지도</a>
        <a :href="kakaoMapUrl(card)" target="_blank" rel="noopener">카카오맵</a>
        <a :href="tmapUrl(card)" target="_blank" rel="noopener">티맵</a>
      </div>
      <dl v-if="transports.length" class="transport">
        <template v-for="t in transports" :key="t.key">
          <dt>{{ t.label }}</dt>
          <dd>{{ t.text }}</dd>
        </template>
      </dl>
    </section>

    <!-- 마음 전하실 곳 -->
    <section v-if="card.accounts.show && accountGroups.length" class="accounts tinted">
      <p class="eyebrow">Account</p>
      <h2 class="section-title small">{{ card.accounts.title }}</h2>
      <p class="acc-msg">{{ card.accounts.message }}</p>
      <div v-for="g in accountGroups" :key="g.key" class="acc-group">
        <button type="button" class="acc-toggle" :aria-expanded="openGroup === g.key" @click="openGroup = openGroup === g.key ? null : g.key">
          {{ g.label }} 계좌번호 <span :class="{ flip: openGroup === g.key }">⌄</span>
        </button>
        <ul v-show="openGroup === g.key">
          <li v-for="a in g.list.filter((x) => x.number.trim())" :key="a.id">
            <div>
              <p class="acc-owner">{{ a.owner }} {{ a.holder }}</p>
              <p class="acc-num">{{ a.bank }} {{ a.number }}</p>
            </div>
            <button type="button" class="mini" @click="copy(accountText(a), '계좌번호를 복사했어요')">복사</button>
          </li>
        </ul>
      </div>
    </section>

    <section v-if="card.closing.show && card.closing.text.trim()" class="closing">
      <p v-for="(line, i) in card.closing.text.split('\n')" :key="i">{{ line || ' ' }}</p>
    </section>

    <section v-if="card.share.showLinkCopy" class="share">
      <button type="button" class="outline" @click="copy(shareHref, '청첩장 주소를 복사했어요')">
        🔗 청첩장 주소 복사하기
      </button>
    </section>

    <footer class="inv-foot">{{ card.main.textLeft }} &amp; {{ card.main.textRight }}</footer>

    <Transition name="fade">
      <div v-if="toast" class="toast" role="status">{{ toast }}</div>
    </Transition>

    <div v-if="lightbox !== null && gallery[lightbox]" class="lightbox" role="dialog" aria-label="사진 크게 보기" @click.self="lightbox = null">
      <button type="button" class="lb-close" aria-label="닫기" @click="lightbox = null">✕</button>
      <button type="button" class="lb-nav prev" aria-label="이전 사진" @click="move(-1)">‹</button>
      <img :src="gallery[lightbox].image" alt="" />
      <button type="button" class="lb-nav next" aria-label="다음 사진" @click="move(1)">›</button>
      <p class="lb-count">{{ lightbox + 1 }} / {{ gallery.length }}</p>
    </div>
  </div>
</template>

<style scoped>
.inv {
  --inv-text: #3b3b3f;
  --inv-sub: #8a8a90;
  position: relative;
  max-width: 430px;
  margin: 0 auto;
  background: #fff;
  color: var(--inv-text);
  font-family: var(--inv-font);
  font-size: calc(14px * var(--inv-scale));
  line-height: 1.8;
  text-align: center;
  overflow: clip; /* hidden 이면 안쪽 sticky 효과가 멈춤 */
  word-break: keep-all;
}
.inv p { margin: 0; }
section { padding: 64px 28px; position: relative; }
.tinted { background: var(--inv-base); }
.eyebrow {
  font-family: 'Cormorant Garamond', 'Times New Roman', serif;
  font-style: italic;
  font-size: 1.15em;
  letter-spacing: 0.04em;
  color: var(--inv-point);
}
.section-title { margin: 4px 0 28px; font-size: 0.92em; font-weight: 600; color: var(--inv-text); letter-spacing: 0.08em; }
.section-title.small { font-size: 0.85em; font-weight: 500; color: var(--inv-sub); }

/* 메인 */
.main { padding: 56px 0 40px; }
.save { font-family: 'Cormorant Garamond', serif; letter-spacing: 0.35em; font-size: 0.8em; color: var(--inv-sub); }
.md { font-family: 'Cormorant Garamond', serif; font-size: 2.4em; line-height: 1.3; color: var(--inv-point); margin-bottom: 14px !important; }
.md span { font-size: 0.5em; margin: 0 10px; vertical-align: middle; }
.photo-wrap { position: relative; margin: 0 auto; }
.photo { display: block; width: 100%; aspect-ratio: 375 / 440; object-fit: cover; }
.placeholder { display: flex; align-items: center; justify-content: center; background: #f1f1f3; color: #9a9aa2; }
.layout-arch .photo-wrap { width: 76%; }
.layout-arch .photo { border-radius: 999px 999px 0 0; aspect-ratio: 3 / 4; }
.layout-frame .photo-wrap { width: 84%; padding: 10px; border: 1px solid color-mix(in srgb, var(--inv-point) 40%, transparent); }
.layout-frame .photo { aspect-ratio: 4 / 5; }
.layout-poster { padding-top: 0; }
.layout-poster .photo { aspect-ratio: 375 / 600; }
.poster-text {
  position: absolute; inset: auto 0 0 0; padding: 80px 20px 28px; color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.45));
  font-size: 1.05em; letter-spacing: 0.1em;
}
.poster-date { font-family: 'Cormorant Garamond', serif; font-size: 3.2em; line-height: 1; margin-bottom: 8px !important; }
.names { margin-top: 26px; display: flex; justify-content: center; gap: 18px; font-size: 1.1em; letter-spacing: 0.05em; }
.names .mid { color: var(--inv-point); }
.when { margin-top: 10px; font-size: 0.88em; color: var(--inv-sub); }
.bg-fog .photo-wrap::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 120%, rgba(255, 255, 255, 0.85), transparent 60%);
  animation: fog 6s ease-in-out infinite alternate;
}
.bg-wave .photo-wrap::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 36px; pointer-events: none;
  background: radial-gradient(circle at 10px -6px, transparent 14px, #fff 15px) 0 0 / 20px 36px repeat-x;
}
@keyframes fog { from { opacity: 0.4; transform: translateY(6px); } to { opacity: 0.9; transform: translateY(-6px); } }

/* 인사말 */
.greeting .body { margin-bottom: 36px; }
.parents { display: grid; gap: 6px; font-size: 0.95em; }
.parents .who { color: var(--inv-text); }
.parents .rel { color: var(--inv-sub); font-size: 0.85em; margin: 0 8px 0 2px; }
.contact-box { margin-top: 32px; }
.contact-box summary {
  display: inline-block; cursor: pointer; list-style: none; padding: 8px 22px; border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--inv-point) 50%, transparent); color: var(--inv-point); font-size: 0.85em;
}
.contact-box summary::-webkit-details-marker { display: none; }
.contact-box ul { list-style: none; padding: 0; margin: 16px auto 0; max-width: 280px; text-align: left; font-size: 0.85em; }
.contact-box li { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f0f0f2; }
.c-label { color: var(--inv-sub); width: 76px; }
.c-name { flex: 1; }
.contact-box a { text-decoration: none; }

/* 달력 */
.cal-date { font-size: 0.95em; font-weight: 500; margin: 8px 0 0; }
.cal-time { color: var(--inv-sub); font-size: 0.85em; }
.grid { display: grid; grid-template-columns: repeat(7, 1fr); max-width: 280px; margin: 0 auto; }
.grid.head { margin-top: 26px; padding-bottom: 8px; border-bottom: 1px solid color-mix(in srgb, var(--inv-point) 25%, transparent); font-size: 0.8em; }
.grid.days span { display: flex; align-items: center; justify-content: center; height: 38px; font-size: 0.9em; }
.sun { color: #d26363; }
.days .on { position: relative; color: #fff; z-index: 0; }
.days .on::before { content: ''; position: absolute; width: 32px; height: 32px; border-radius: 50%; background: var(--inv-point); z-index: -1; }
.dday { margin-top: 22px !important; font-size: 0.88em; }
.heart { color: var(--inv-point); }

/* 갤러리 */
.gallery { padding-left: 16px; padding-right: 16px; }
.g-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.g-grid .g-item { aspect-ratio: 1; }
.g-slide { display: flex; gap: 8px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 6px; }
.g-slide .g-item { flex: 0 0 82%; aspect-ratio: 4 / 5; scroll-snap-align: center; }
.g-item { padding: 0; border: 0; border-radius: 4px; overflow: hidden; cursor: zoom-in; background: #eee; }
.g-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
.empty-note { color: var(--inv-sub); font-size: 0.85em; padding: 40px 0; border: 1px dashed #ddd; border-radius: 6px; }

/* 오시는 길 */
.venue-name { font-weight: 600; }
.address { color: var(--inv-sub); font-size: 0.88em; }
.map-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 20px 0 8px; }
.map-buttons a {
  padding: 9px 0; border: 1px solid #e3e3e6; border-radius: 6px; color: var(--inv-text); font-size: 0.8em; text-decoration: none;
}
.transport { text-align: left; margin: 28px 0 0; font-size: 0.86em; }
.transport dt { color: var(--inv-point); font-weight: 600; padding-bottom: 4px; border-bottom: 1px solid color-mix(in srgb, var(--inv-point) 35%, transparent); }
.transport dd { margin: 8px 0 22px; white-space: pre-line; color: var(--inv-text); }

/* 계좌 */
.acc-msg { white-space: pre-line; color: var(--inv-sub); font-size: 0.86em; margin-bottom: 24px !important; }
.acc-group { margin-top: 10px; text-align: left; }
.acc-toggle {
  width: 100%; display: flex; justify-content: space-between; padding: 12px 16px; border: 0; border-radius: 6px;
  background: #fff; color: var(--inv-text); font: inherit; font-size: 0.9em; cursor: pointer;
}
.acc-toggle span { transition: transform 0.2s; }
.acc-toggle .flip { transform: rotate(180deg); }
.acc-group ul { list-style: none; margin: 0; padding: 4px 16px; background: #fff; border-top: 1px solid #f2f2f4; border-radius: 0 0 6px 6px; }
.acc-group li { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f2f2f4; font-size: 0.85em; }
.acc-group li:last-child { border-bottom: 0; }
.acc-owner { color: var(--inv-sub); font-size: 0.9em; }

.mini {
  margin-left: 6px; padding: 2px 10px; border: 1px solid #dcdce0; border-radius: 999px; background: #fff;
  color: var(--inv-sub); font: inherit; font-size: 0.75em; cursor: pointer;
}
.closing { white-space: pre-line; color: var(--inv-sub); font-size: 0.9em; }
.share { padding-top: 0; }
.outline {
  width: 100%; padding: 11px 0; border: 1px solid #dcdce0; border-radius: 6px; background: #fff;
  color: var(--inv-text); font: inherit; font-size: 0.86em; cursor: pointer;
}
.inv-foot { padding: 20px 0 36px; font-family: 'Cormorant Garamond', serif; font-size: 0.85em; color: #b4b4ba; letter-spacing: 0.1em; }

/* 떨어지는 효과 (캔버스는 ParticleLayer) */
.falling { position: fixed; inset: 0; pointer-events: none; z-index: 5; }
.embedded .falling { position: sticky; top: 0; height: 660px; margin-bottom: -660px; }
.tilt-hint {
  position: fixed; left: 50%; top: 16px; transform: translateX(-50%); z-index: 30; margin: 0;
  padding: 7px 14px; border-radius: 999px; background: rgba(255, 255, 255, 0.92); color: var(--inv-point);
  font-size: 0.78em; white-space: nowrap; box-shadow: 0 4px 14px -6px rgba(0, 0, 0, 0.25);
}

/* 인트로 */
.intro {
  position: fixed; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center;
  background: #fff; color: var(--inv-point); font-size: 1.2em; letter-spacing: 0.06em; padding: 24px;
}
.embedded .intro { position: sticky; top: 0; height: 660px; margin-bottom: -660px; }
.caret::after { content: '|'; margin-left: 2px; animation: blink 0.8s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
.intro-leave-active { transition: opacity 0.8s; }
.intro-leave-to { opacity: 0; }

.toast {
  position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 30;
  padding: 8px 16px; border-radius: 999px; background: rgba(30, 30, 34, 0.86); color: #fff; font-size: 0.8em; white-space: nowrap;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.lightbox {
  position: fixed; inset: 0; z-index: 40; background: rgba(0, 0, 0, 0.9);
  display: flex; align-items: center; justify-content: center;
}
.lightbox img { max-width: 100%; max-height: 82%; object-fit: contain; }
.lb-close, .lb-nav { position: absolute; border: 0; background: none; color: #fff; font-size: 28px; cursor: pointer; padding: 10px; }
.lb-close { top: 8px; right: 8px; font-size: 20px; }
.lb-nav.prev { left: 0; }
.lb-nav.next { right: 0; }
.lb-count { position: absolute; bottom: 18px; color: #ccc; font-size: 12px; }

@media (prefers-reduced-motion: reduce) {
  .falling { display: none; }
  .bg-fog .photo-wrap::after { animation: none; }
}
</style>
