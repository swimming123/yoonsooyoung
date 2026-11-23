<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import AccountList from './editor/AccountList.vue'
import ChoiceGroup from './editor/ChoiceGroup.vue'
import EditorSection from './editor/EditorSection.vue'
import FormRow from './editor/FormRow.vue'
import PersonFields from './editor/PersonFields.vue'
import PhotoDrop from './editor/PhotoDrop.vue'
import InvitationPreview from './InvitationPreview.vue'
import {
  compressImage,
  describeError,
  invitationRepository,
  newPhoto,
  type DraftSummary,
  type InvitationRepository,
} from './repository'
import {
  FALLING_EFFECTS,
  FONTS,
  MAIN_LAYOUTS,
  THEME_COLORS,
  defaultCard,
  type InvitationCard,
  type InvitationPhoto,
} from './types'
import { useInvitationFonts } from './useInvitationFonts'

type Tab = 'basic' | 'extra' | 'share'

const router = useRouter()
const route = useRoute()
const card = ref<InvitationCard>(defaultCard())
const drafts = ref<DraftSummary[]>([])
const activeId = ref('')
const draftId = ref('')
const switching = ref(false)
const photos = ref<InvitationPhoto[]>([])
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const savedAt = ref<Date | null>(null)
const saveError = ref('')
const savedJson = ref('')
const tab = ref<Tab>('basic')
const open = reactive<Record<string, boolean>>({ template: true })
const mobilePreview = ref(false)
const introKey = ref(0)
const busyMain = ref(false)
const busyGallery = ref(false)
const photoError = ref('')
const previewScroller = ref<HTMLElement>()

let repo: InvitationRepository | undefined
let stopPhotos: (() => void) | undefined
let stopState: (() => void) | undefined

// 편집 화면에서는 글꼴 미리보기를 위해 전부 불러옵니다.
useInvitationFonts(() => FONTS.map((f) => f.key))

// 시안을 못 불러왔으면(권한 오류 등) 저장할 것도 없음
const dirty = computed(() => !loading.value && !!draftId.value && JSON.stringify(card.value) !== savedJson.value)
const mainPhoto = computed(() => photos.value.find((p) => p.id === card.value.main.photoId))
const galleryPhotos = computed(() => photos.value.filter((p) => p.role !== 'main' && p.id !== card.value.main.photoId))
const isActive = computed(() => draftId.value === activeId.value)
const publicUrl = computed(() => {
  const query = isActive.value ? {} : { d: draftId.value }
  return new URL(router.resolve({ name: 'invite', query }).href, location.origin).href
})
const saveLabel = computed(() => {
  if (saving.value) return '저장 중…'
  if (saveError.value) return saveError.value
  if (dirty.value) return '저장하지 않은 변경 사항이 있어요'
  if (savedAt.value) return `저장됨 · ${savedAt.value.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
  return '청첩장을 만들고 있어요 🩷'
})

onMounted(async () => {
  try {
    repo = await invitationRepository()
    let first = true
    stopState = repo.watchState(
      (state) => {
        drafts.value = state.drafts
        activeId.value = state.activeId
        if (first) {
          first = false
          const wanted = String(route.query.d ?? '')
          void openDraft(state.drafts.some((d) => d.id === wanted) ? wanted : state.activeId)
        }
      },
      (e) => {
        loadError.value = describeError(e)
        loading.value = false
      },
    )
  } catch (e) {
    loadError.value = describeError(e)
    loading.value = false
  }
  window.addEventListener('beforeunload', warnUnsaved)
})

/** 시안을 열어 편집합니다. */
async function openDraft(id: string) {
  if (!repo || !id) return
  switching.value = true
  try {
    const loaded = await repo.loadCard(id)
    stopPhotos?.()
    draftId.value = id
    card.value = loaded
    savedJson.value = JSON.stringify(loaded)
    savedAt.value = null
    saveError.value = ''
    stopPhotos = repo.watchPhotos(id, (list) => (photos.value = list))
    if (route.query.d !== id) void router.replace({ query: { ...route.query, d: id } })
  } catch (e) {
    loadError.value = describeError(e)
  } finally {
    loading.value = false
    switching.value = false
  }
}

async function changeDraft(id: string) {
  if (id === draftId.value) return
  if (dirty.value && !confirm('저장하지 않은 변경 사항이 있어요. 다른 시안으로 넘어갈까요?')) return
  await openDraft(id)
}

async function makeActive() {
  try {
    await repo?.setActive(draftId.value)
  } catch (e) {
    saveError.value = describeError(e)
  }
}

async function addDraft() {
  if (!repo) return
  const name = prompt('새 시안 이름', `시안 ${drafts.value.length + 1}`)?.trim()
  if (!name) return
  try {
    // 지금 보고 있는 디자인을 복사해서 시작합니다(사진은 새 시안에서 따로 올려요).
    const copy: InvitationCard = JSON.parse(JSON.stringify(card.value))
    copy.main.photoId = ''
    const id = await repo.createDraft(name, copy)
    await openDraft(id)
  } catch (e) {
    saveError.value = describeError(e)
  }
}

onBeforeUnmount(() => {
  stopPhotos?.()
  stopState?.()
  window.removeEventListener('beforeunload', warnUnsaved)
})

function warnUnsaved(e: BeforeUnloadEvent) {
  if (dirty.value) e.preventDefault()
}

onBeforeRouteLeave(() => {
  if (dirty.value) return confirm('저장하지 않은 변경 사항이 있어요. 나갈까요?')
  return true
})

// 인트로 설정을 바꾸면 미리보기에서 다시 보여 줍니다.
watch(
  () => [card.value.main.intro, card.value.main.introText],
  () => {
    previewScroller.value?.scrollTo({ top: 0 })
    introKey.value++
  },
)

async function save() {
  if (!repo || saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    await repo.saveCard(draftId.value, card.value)
    savedJson.value = JSON.stringify(card.value)
    savedAt.value = new Date()
    // 메인 사진을 바꿨다면 이전 메인 사진은 이제 정리합니다.
    const stale = photos.value.filter((p) => p.role === 'main' && p.id !== card.value.main.photoId)
    await Promise.all(stale.map((p) => repo!.deletePhoto(p.id)))
  } catch (e) {
    saveError.value = '저장하지 못했어요. ' + describeError(e)
  } finally {
    saving.value = false
  }
}

async function uploadMain(files: File[]) {
  if (!repo || !files[0]) return
  busyMain.value = true
  photoError.value = ''
  try {
    const { url, kb } = await compressImage(files[0])
    const photo = newPhoto(draftId.value, 'main', -1, url, kb)
    await repo.savePhoto(photo)
    card.value.main.photoId = photo.id
  } catch (e) {
    photoError.value = e instanceof Error ? e.message : '사진을 올리지 못했어요.'
  } finally {
    busyMain.value = false
  }
}

async function uploadGallery(files: File[]) {
  if (!repo) return
  busyGallery.value = true
  photoError.value = ''
  try {
    let order = galleryPhotos.value.reduce((m, p) => Math.max(m, p.order), -1)
    for (const file of files.slice(0, 30 - galleryPhotos.value.length)) {
      const { url, kb } = await compressImage(file, 1280, 600)
      await repo.savePhoto(newPhoto(draftId.value, 'gallery', ++order, url, kb))
    }
  } catch (e) {
    photoError.value = e instanceof Error ? e.message : '사진을 올리지 못했어요.'
  } finally {
    busyGallery.value = false
  }
}

async function removeGallery(p: InvitationPhoto) {
  if (confirm('이 사진을 갤러리에서 삭제할까요?')) await repo?.deletePhoto(p.id)
}

async function moveGallery(index: number, step: number) {
  const list = galleryPhotos.value
  const a = list[index]
  const b = list[index + step]
  if (!repo || !a || !b) return
  await Promise.all([repo.savePhoto({ ...a, order: b.order }), repo.savePhoto({ ...b, order: a.order })])
}

const copied = ref(false)
async function copyUrl() {
  await navigator.clipboard.writeText(publicUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

const colorOptions = THEME_COLORS.map((t) => ({ value: t.key, label: t.label, badge: t.isNew ? 'NEW' : undefined }))
const fontOptions = FONTS.map((f) => ({
  value: f.key,
  label: f.label,
  preview: '우리 결혼해요',
  previewStyle: { fontFamily: f.family },
}))
const layoutOptions = MAIN_LAYOUTS.map((l) => ({ value: l.key, label: l.label, preview: l.description, previewStyle: { fontSize: '0.75rem', color: 'var(--ed-sub)' } }))
const hours = Array.from({ length: 24 }, (_, h) => h).filter((h) => h >= 8 && h <= 21)
const minutes = [0, 10, 20, 30, 40, 50]
const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'basic', label: '기본 정보', icon: '♡' },
  { key: 'extra', label: '부가 기능', icon: '✦' },
  { key: 'share', label: '공유 기능', icon: '↗' },
]
</script>

<template>
  <div class="editor">
    <form class="shell" @submit.prevent="save">
      <!-- 상단 바 -->
      <div class="topbar">
        <p class="state" :class="{ warn: dirty || saveError }" role="status">{{ saveLabel }}</p>
        <div class="actions">
          <button type="button" class="ghost only-mobile" @click="mobilePreview = true">미리보기</button>
          <a class="ghost" :href="publicUrl" target="_blank" rel="noopener">공개 페이지 ↗</a>
          <button type="submit" class="primary" :disabled="loading || saving || !dirty">저장하기</button>
        </div>
      </div>

      <p v-if="loadError" class="error">청첩장을 불러오지 못했어요. {{ loadError }}</p>

      <!-- 시안: 기존 웨딩플래너 '청첩장 관리'와 같은 목록 -->
      <div v-if="drafts.length" class="drafts">
        <label class="drafts-label" for="draft-select">시안</label>
        <select id="draft-select" :value="draftId" :disabled="switching" @change="changeDraft(($event.target as HTMLSelectElement).value)">
          <option v-for="d in drafts" :key="d.id" :value="d.id">
            {{ d.id === activeId ? '★ ' : '' }}{{ d.name }}{{ d.hasCard ? '' : ' (기존 블록 디자인)' }}
          </option>
        </select>
        <span v-if="isActive" class="badge-active">대표 시안 · 하객 링크에 보여요</span>
        <button v-else type="button" class="small" @click="makeActive">대표 시안으로 지정</button>
        <button type="button" class="small" @click="addDraft">+ 새 시안</button>
        <RouterLink class="small link" :to="{ name: 'wedding' }">웨딩플래너로 ↩</RouterLink>
      </div>
      <p v-if="drafts.find((d) => d.id === draftId && !d.hasCard)" class="note legacy-note">
        이 시안은 아직 기존 블록 디자인이에요. 이름·일시·장소·사진은 그대로 가져왔고, 여기서 저장하면 하객 링크가 새 디자인으로 바뀌어요.
      </p>

      <div class="layout">
        <!-- 미리보기 -->
        <aside class="phone-col" :class="{ show: mobilePreview }">
          <button type="button" class="close-preview only-mobile" @click="mobilePreview = false">✕ 닫기</button>
          <div ref="previewScroller" class="phone" aria-label="청첩장 미리보기">
            <InvitationPreview :card="card" :photos="photos" :intro-key="introKey" :share-url="publicUrl" embedded />
          </div>
        </aside>

        <!-- 편집 -->
        <section class="panel">
          <div class="tabs" role="tablist" aria-label="편집 메뉴">
            <button
              v-for="t in tabs"
              :key="t.key"
              type="button"
              role="tab"
              :aria-selected="tab === t.key"
              :class="{ on: tab === t.key }"
              @click="tab = t.key"
            >
              <span class="ic" aria-hidden="true">{{ t.icon }}</span>{{ t.label }}
            </button>
          </div>

          <div v-if="loading" class="skeleton">
            <div v-for="i in 5" :key="i" />
          </div>

          <!-- 기본 정보 -->
          <div v-else-if="tab === 'basic'" class="sections" role="tabpanel">
            <EditorSection v-model:open="open.template" title="템플릿">
              <FormRow label="색상" align="start">
                <ChoiceGroup v-model="card.template.color" label="색상 선택" :options="colorOptions" :columns="5" />
                <div class="swatches" aria-hidden="true">
                  <span v-for="t in THEME_COLORS" :key="t.key" :style="{ background: `linear-gradient(${t.base} 50%, ${t.point} 50%)` }" />
                </div>
              </FormRow>
              <FormRow label="글꼴" align="start">
                <ChoiceGroup v-model="card.template.font" label="글꼴 선택" :options="fontOptions" :columns="2" />
              </FormRow>
              <FormRow label="글꼴 크기">
                <ChoiceGroup
                  v-model="card.template.fontSize"
                  label="글꼴 크기"
                  :options="[
                    { value: 'S', label: 'S' },
                    { value: 'M', label: 'M' },
                    { value: 'L', label: 'L' },
                  ]"
                />
              </FormRow>
            </EditorSection>

            <EditorSection v-model:open="open.main" title="메인">
              <FormRow label="테마" align="start">
                <ChoiceGroup v-model="card.main.layout" label="테마 선택" :options="layoutOptions" :columns="2" />
              </FormRow>
              <FormRow label="메인 문구">
                <div class="three">
                  <input v-model="card.main.textLeft" placeholder="예: 김신랑" aria-label="메인 문구 왼쪽" />
                  <input v-model="card.main.textMiddle" class="mid" placeholder="♡" aria-label="메인 문구 가운데" />
                  <input v-model="card.main.textRight" placeholder="예: 박신부" aria-label="메인 문구 오른쪽" />
                </div>
              </FormRow>
              <FormRow label="사진" align="start">
                <div class="main-photo">
                  <img v-if="mainPhoto" :src="mainPhoto.image" alt="현재 메인 사진" />
                  <PhotoDrop :label="mainPhoto ? '메인 사진 바꾸기' : '메인 사진 올리기'" :busy="busyMain" @files="uploadMain" />
                </div>
              </FormRow>
              <FormRow label="효과 1">
                <ChoiceGroup
                  v-model="card.main.background"
                  label="사진 효과"
                  :options="[
                    { value: 'none', label: '없음' },
                    { value: 'fog', label: '안개' },
                    { value: 'wave', label: '물결' },
                  ]"
                />
              </FormRow>
              <FormRow label="효과 2" align="start">
                <ChoiceGroup
                  v-model="card.main.falling"
                  label="떨어지는 효과"
                  :options="FALLING_EFFECTS.map((f) => ({ value: f.key, label: f.label }))"
                />
              </FormRow>
              <FormRow label="인트로 효과">
                <ChoiceGroup
                  v-model="card.main.intro"
                  label="인트로 효과"
                  :options="[
                    { value: 'none', label: '없음' },
                    { value: 'fade', label: '페이드' },
                    { value: 'typing', label: '타이핑' },
                  ]"
                />
              </FormRow>
              <FormRow v-if="card.main.intro !== 'none'" label="인트로 문구" for="intro-text">
                <input id="intro-text" v-model="card.main.introText" :placeholder="`예: ${card.main.textLeft} ${card.main.textRight}, 결혼합니다`" />
              </FormRow>
            </EditorSection>

            <EditorSection v-model:open="open.groom" title="신랑측 정보">
              <PersonFields v-model="card.groom" who="신랑" />
            </EditorSection>

            <EditorSection v-model:open="open.bride" title="신부측 정보">
              <PersonFields v-model="card.bride" who="신부" />
            </EditorSection>

            <EditorSection v-model:open="open.wedding" title="예식 정보" required>
              <FormRow label="예식 일자" for="w-date">
                <input id="w-date" v-model="card.wedding.date" type="date" required />
              </FormRow>
              <FormRow label="예식 시간">
                <div class="two">
                  <select v-model.number="card.wedding.hour" aria-label="시">
                    <option v-for="h in hours" :key="h" :value="h">{{ h < 12 ? '오전' : '오후' }} {{ h % 12 || 12 }}시</option>
                  </select>
                  <select v-model.number="card.wedding.minute" aria-label="분">
                    <option v-for="m in minutes" :key="m" :value="m">{{ m }}분</option>
                  </select>
                </div>
              </FormRow>
              <div class="switch-row">
                <span>예식장 정보 표시</span>
                <label class="switch">
                  <input v-model="card.wedding.showVenue" type="checkbox" role="switch" aria-label="예식장 정보 표시" />
                  <span />
                </label>
              </div>
              <template v-if="card.wedding.showVenue">
                <FormRow label="예식장 이름" for="w-venue">
                  <input id="w-venue" v-model="card.wedding.venueName" placeholder="예: 서울 ○○호텔" />
                </FormRow>
                <FormRow label="층과 홀" for="w-hall">
                  <input id="w-hall" v-model="card.wedding.venueHall" placeholder="예: 2층 그랜드홀" />
                </FormRow>
                <FormRow label="주소" for="w-addr">
                  <input id="w-addr" v-model="card.wedding.venueAddress" placeholder="예: 서울 중구 ○○로 123" />
                </FormRow>
                <FormRow label="지도 검색어" for="w-map">
                  <input id="w-map" v-model="card.wedding.mapQuery" placeholder="비워 두면 주소로 검색해요" />
                </FormRow>
              </template>
              <p class="note">가족 예식이나 스몰웨딩이라면 예식장 정보를 숨길 수 있어요. 숨기면 오시는 길도 함께 숨겨져요.</p>
            </EditorSection>
          </div>

          <!-- 부가 기능 -->
          <div v-else-if="tab === 'extra'" class="sections" role="tabpanel">
            <EditorSection v-model:open="open.greeting" title="인사말">
              <FormRow label="제목" for="g-title">
                <input id="g-title" v-model="card.greeting.title" />
              </FormRow>
              <FormRow label="내용" for="g-body" align="start">
                <textarea id="g-body" v-model="card.greeting.body" rows="9" />
              </FormRow>
              <label class="check-row">
                <input v-model="card.greeting.showParents" type="checkbox" />
                인사말 아래에 혼주 이름 보여 주기
              </label>
            </EditorSection>

            <EditorSection v-model:open="open.calendar" title="예식일 달력">
              <label class="check-row"><input v-model="card.calendar.show" type="checkbox" /> 달력 보여 주기</label>
              <label class="check-row"><input v-model="card.calendar.showDday" type="checkbox" :disabled="!card.calendar.show" /> D-day 문구 보여 주기</label>
            </EditorSection>

            <EditorSection v-model:open="open.gallery" title="갤러리" hint="갤러리 사진은 올리거나 지우면 바로 저장돼요. 최대 30장.">
              <label class="check-row"><input v-model="card.gallery.show" type="checkbox" /> 갤러리 보여 주기</label>
              <FormRow label="제목" for="gal-title">
                <input id="gal-title" v-model="card.gallery.title" />
              </FormRow>
              <FormRow label="배치">
                <ChoiceGroup
                  v-model="card.gallery.layout"
                  label="갤러리 배치"
                  :options="[
                    { value: 'grid', label: '바둑판' },
                    { value: 'slide', label: '넘겨 보기' },
                  ]"
                  :columns="2"
                />
              </FormRow>
              <PhotoDrop label="갤러리 사진 올리기" multiple :busy="busyGallery" @files="uploadGallery" />
              <ul v-if="galleryPhotos.length" class="thumbs">
                <li v-for="(p, i) in galleryPhotos" :key="p.id">
                  <img :src="p.image" :alt="`갤러리 사진 ${i + 1}`" />
                  <div class="thumb-actions">
                    <button type="button" :disabled="i === 0" aria-label="앞으로" @click="moveGallery(i, -1)">‹</button>
                    <button type="button" aria-label="삭제" @click="removeGallery(p)">✕</button>
                    <button type="button" :disabled="i === galleryPhotos.length - 1" aria-label="뒤로" @click="moveGallery(i, 1)">›</button>
                  </div>
                </li>
              </ul>
            </EditorSection>

            <EditorSection v-model:open="open.location" title="오시는 길 안내" hint="쓴 항목만 청첩장에 나와요.">
              <FormRow label="지하철" for="l-sub" align="start">
                <textarea id="l-sub" v-model="card.location.subway" rows="3" placeholder="예: 3호선 ○○역 5번 출구에서 도보 5분" />
              </FormRow>
              <FormRow label="버스" for="l-bus" align="start">
                <textarea id="l-bus" v-model="card.location.bus" rows="3" placeholder="예: ○○정류장 하차 (간선 100, 지선 1234)" />
              </FormRow>
              <FormRow label="자가용" for="l-car" align="start">
                <textarea id="l-car" v-model="card.location.car" rows="3" placeholder="예: 건물 지하주차장 2시간 무료" />
              </FormRow>
            </EditorSection>

            <EditorSection v-model:open="open.accounts" title="마음 전하실 곳 (계좌)">
              <label class="check-row"><input v-model="card.accounts.show" type="checkbox" /> 계좌 안내 보여 주기</label>
              <FormRow label="제목" for="a-title">
                <input id="a-title" v-model="card.accounts.title" />
              </FormRow>
              <FormRow label="안내 문구" for="a-msg" align="start">
                <textarea id="a-msg" v-model="card.accounts.message" rows="3" />
              </FormRow>
              <FormRow label="신랑측" align="start"><AccountList v-model="card.accounts.groom" side="신랑" /></FormRow>
              <FormRow label="신부측" align="start"><AccountList v-model="card.accounts.bride" side="신부" /></FormRow>
            </EditorSection>

            <EditorSection v-model:open="open.closing" title="마무리 글">
              <label class="check-row"><input v-model="card.closing.show" type="checkbox" /> 마지막에 짧은 글 보여 주기</label>
              <textarea v-model="card.closing.text" rows="4" aria-label="마무리 글" placeholder="예: 저희의 새로운 시작을 함께해 주셔서 감사합니다." />
            </EditorSection>
          </div>

          <!-- 공유 기능 -->
          <div v-else class="sections" role="tabpanel">
            <EditorSection :open="true" title="청첩장 주소">
              <div class="url">
                <input :value="publicUrl" readonly aria-label="청첩장 주소" @focus="($event.target as HTMLInputElement).select()" />
                <button type="button" @click="copyUrl">{{ copied ? '복사됨' : '복사' }}</button>
              </div>
              <p class="note">
                {{ isActive ? '대표 시안이라 기존 하객 링크(wedding/invite.html)도 이 디자인으로 열려요.' : '대표 시안이 아니라서 이 주소로만 볼 수 있어요.' }}
                저장하기를 눌러야 반영돼요.
              </p>
              <label class="check-row"><input v-model="card.share.showLinkCopy" type="checkbox" /> 청첩장 아래에 '주소 복사' 버튼 보여 주기</label>
            </EditorSection>
            <EditorSection v-model:open="open.shareText" title="공유 문구">
              <FormRow label="제목" for="s-title">
                <input id="s-title" v-model="card.share.title" :placeholder="`${card.main.textLeft} ♡ ${card.main.textRight} 결혼합니다`" />
              </FormRow>
              <FormRow label="설명" for="s-desc">
                <input id="s-desc" v-model="card.share.description" placeholder="예: 11월 23일 낮 12시, 서울 ○○호텔" />
              </FormRow>
              <p class="note">
                브라우저 탭 제목에 쓰여요. 카카오톡 링크 미리보기(사진·문구)는 웨딩플래너 '청첩장 관리'의 링크 미리보기 설정을 그대로 따라요.
              </p>
            </EditorSection>
          </div>

          <p v-if="photoError" class="error">{{ photoError }}</p>
          <button type="submit" class="primary wide only-desktop" :disabled="loading || saving || !dirty">저장하기</button>
        </section>
      </div>
    </form>
  </div>
</template>

<style scoped>
.editor {
  --ed-brand: #d9607a;
  --ed-brand-strong: #b8445f;
  --ed-brand-soft: #fdeef1;
  --ed-card: #fff;
  --ed-bg: #f4f4f5;
  --ed-soft: #f6f6f8;
  --ed-line: #dee2e6;
  --ed-text: #26262b;
  --ed-sub: #6f7179;
  color: var(--ed-text);
  background: var(--ed-bg);
  margin: -32px -20px -24px;
  min-height: calc(100vh - 60px);
  color-scheme: light;
}
.topbar {
  position: sticky; top: 0; z-index: 30; height: 56px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 0 20px; background: #fff7f8e6; backdrop-filter: blur(12px); border-bottom: 1px solid #f3e4e7;
}
.state { margin: 0; font-size: 0.9rem; color: var(--ed-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.state.warn { color: var(--ed-brand-strong); }
.actions { display: flex; gap: 6px; flex-shrink: 0; }
.actions .ghost, .actions .primary { display: inline-flex; align-items: center; min-height: 40px; padding: 0 16px; border-radius: 8px; font-size: 0.92rem; }
.ghost { border: 1px solid var(--ed-line); background: #fff; color: #495057; text-decoration: none; }
.ghost:hover { text-decoration: none; filter: brightness(0.97); }
.primary { border: 0; background: var(--ed-brand); color: #fff; font-weight: 600; }
.primary:disabled { background: #d9d9de; color: #8a8a90; cursor: not-allowed; }
.drafts { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 16px 20px 0; }
.drafts-label { font-weight: 700; font-size: 0.9rem; }
.drafts select { width: auto !important; min-width: 200px; background: #fff !important; border: 1px solid var(--ed-line) !important; }
.small { min-height: 40px; padding: 0 14px; border: 1px solid var(--ed-line); border-radius: 8px; background: #fff; color: #495057; font-size: 0.88rem; }
.small.link { display: inline-flex; align-items: center; text-decoration: none; }
.badge-active { padding: 4px 10px; border-radius: 999px; background: var(--ed-brand-soft); color: var(--ed-brand-strong); font-size: 0.8rem; font-weight: 600; }
.legacy-note { margin: 12px 20px 0; background: #fff8e6; color: #7a5a00; }
.layout { display: flex; gap: 32px; justify-content: center; padding: 32px 20px 64px; }
.phone-col { position: sticky; top: 88px; align-self: flex-start; flex-shrink: 0; }
.phone {
  width: 375px; height: 660px; overflow-y: auto; border-radius: 32px; background: #fff; scrollbar-width: none;
  box-shadow: 0 0 0 8px #fff, 0 0 0 9px #e4e4e7, 0 20px 40px -20px rgba(0, 0, 0, 0.25);
}
.phone::-webkit-scrollbar { display: none; }
.panel { flex: 1; min-width: 0; max-width: 640px; display: flex; flex-direction: column; gap: 16px; }
.tabs {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 6px; border-radius: 32px; background: #e9e9ec;
}
.tabs button {
  min-height: 44px; border: 0; border-radius: 26px; background: none; color: var(--ed-sub); font-weight: 600; font-size: 0.98rem;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.tabs button.on { background: #26262b; color: #fff; }
.ic { display: none; }
.sections { display: flex; flex-direction: column; gap: 16px; }
.skeleton { display: flex; flex-direction: column; gap: 16px; }
.skeleton div { height: 61px; border-radius: 10px; background: #fff; animation: pulse 1.2s ease-in-out infinite alternate; }
@keyframes pulse { to { opacity: 0.5; } }

.editor :is(input:not([type='checkbox']):not([type='file']), select, textarea) {
  width: 100%; min-height: 44px; padding: 9px 14px; border: 1px solid transparent; border-radius: 8px;
  background: #f1f3f5; color: var(--ed-text); font: inherit; font-size: 0.95rem;
}
.editor textarea { resize: vertical; line-height: 1.6; }
.editor :is(input, select, textarea):focus-visible { outline: none; border-color: var(--ed-brand); box-shadow: 0 0 0 1px var(--ed-brand); }
.editor input:disabled { opacity: 0.5; }
.three { display: grid; grid-template-columns: 1fr 72px 1fr; gap: 8px; }
.three .mid { text-align: center; }
.two { display: grid; grid-template-columns: 3fr 2fr; gap: 8px; }
.swatches { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 6px; }
.swatches span { height: 10px; border-radius: 4px; border: 1px solid #00000010; }
.main-photo { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: stretch; }
.main-photo img { width: 104px; height: 130px; object-fit: cover; border-radius: 8px; }
.main-photo :deep(.drop) { grid-column: 2; }
.main-photo:not(:has(img)) { grid-template-columns: 1fr; }
.main-photo:not(:has(img)) :deep(.drop) { grid-column: 1; }
.switch-row { display: flex; align-items: center; justify-content: space-between; padding-top: 18px; border-top: 1px solid #eee; font-weight: 600; font-size: 0.9rem; }
.switch { position: relative; width: 52px; height: 28px; }
.switch input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; z-index: 1; }
.switch span { position: absolute; inset: 0; border-radius: 999px; background: #ced4da; transition: background 0.2s; }
.switch span::after { content: ''; position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
.switch input:checked + span { background: var(--ed-brand); }
.switch input:checked + span::after { transform: translateX(24px); }
.switch input:focus-visible + span { outline: 2px solid var(--ed-brand); outline-offset: 2px; }
.check-row { display: flex; align-items: center; gap: 10px; font-size: 0.92rem; min-height: 32px; cursor: pointer; }
.check-row input { width: 18px; height: 18px; accent-color: var(--ed-brand); }
.note { margin: 0; padding: 12px 14px; border-radius: 10px; background: var(--ed-soft); color: var(--ed-sub); font-size: 0.82rem; }
.thumbs { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
.thumbs li { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #eee; }
.thumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb-actions { position: absolute; inset: auto 0 0 0; display: flex; justify-content: space-between; padding: 4px; background: linear-gradient(transparent, #0008); }
.thumb-actions button { border: 0; background: #ffffffd9; border-radius: 6px; padding: 0 8px; min-height: 26px; font-size: 0.8rem; }
.thumb-actions button:disabled { opacity: 0.35; }
.url { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
.url button { border: 0; border-radius: 8px; background: #26262b; color: #fff; padding: 0 18px; }
.error { margin: 0 20px; padding: 10px 14px; border-radius: 8px; background: #fdecec; color: #b42318; font-size: 0.88rem; }
.panel .error { margin: 0; }
.wide { min-height: 44px; border-radius: 8px; }
.only-mobile { display: none !important; }
.close-preview { position: absolute; top: -48px; right: 0; border: 0; background: #fff; border-radius: 999px; padding: 8px 14px; }

@media (max-width: 1023px) {
  .only-mobile { display: inline-flex !important; }
  .only-desktop { display: none !important; }
  .layout { padding: 20px 12px 120px; }
  .phone-col { display: none; }
  .phone-col.show {
    display: flex; position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; z-index: 60;
    align-items: center; justify-content: center; background: #000a;
  }
  .phone-col.show .phone { height: min(660px, calc(100vh - 120px)); }
  .phone-col.show .close-preview { position: absolute; top: 16px; right: 16px; }
  .tabs {
    position: fixed; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 40;
    background: #ffffffd9; backdrop-filter: blur(14px); box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.25);
  }
  .tabs button { flex-direction: column; gap: 2px; font-size: 0.75rem; min-height: 50px; }
  .tabs button.on { background: #fff; color: var(--ed-text); box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.2); }
  .ic { display: inline; font-size: 1.05rem; }
  .actions a.ghost { display: none; }
}
@media (max-width: 640px) {
  .editor { margin: -32px -20px -24px; }
  .state { font-size: 0.82rem; }
  .three { grid-template-columns: 1fr 56px 1fr; }
}
</style>
