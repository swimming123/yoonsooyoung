<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import InvitationPreview from './InvitationPreview.vue'
import { invitationRepository } from './repository'
import type { InvitationCard, InvitationPhoto } from './types'

// 하객이 보는 공개 청첩장. 로그인 없이 읽기만 합니다.
// ?d=시안id 가 있으면 그 시안, 없으면 대표 시안을 보여 줍니다(기존 invite.html 과 같은 규칙).
const route = useRoute()
const card = ref<InvitationCard | null>(null)
const photos = ref<InvitationPhoto[]>([])
const error = ref('')
let stopState: (() => void) | undefined
let stopPhotos: (() => void) | undefined

onMounted(async () => {
  try {
    const repo = await invitationRepository()
    let first = true
    stopState = repo.watchState(
      async (state) => {
        if (!first) return
        first = false
        const wanted = String(route.query.d ?? '')
        const id = state.drafts.some((d) => d.id === wanted) ? wanted : state.activeId
        const loaded = await repo.loadCard(id)
        card.value = loaded
        stopPhotos = repo.watchPhotos(id, (list) => (photos.value = list))
        document.title = loaded.share.title.trim() || `${loaded.main.textLeft} ♡ ${loaded.main.textRight} 결혼합니다`
      },
      () => (error.value = '청첩장을 불러오지 못했어요. 잠시 후 다시 열어 주세요.'),
    )
  } catch {
    error.value = '청첩장을 불러오지 못했어요. 잠시 후 다시 열어 주세요.'
  }
})
onBeforeUnmount(() => {
  stopState?.()
  stopPhotos?.()
})
</script>

<template>
  <div class="page">
    <InvitationPreview v-if="card" :card="card" :photos="photos" />
    <p v-else-if="error" class="msg">{{ error }}</p>
    <p v-else class="msg">청첩장을 여는 중…</p>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f4f4f5; color-scheme: light; }
.msg { margin: 0; padding: 40vh 20px 0; text-align: center; color: #6f7179; }
</style>
