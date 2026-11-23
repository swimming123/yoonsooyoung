<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import InvitationPreview from './InvitationPreview.vue'
import { invitationRepository } from './repository'
import type { InvitationCard, InvitationPhoto } from './types'

// 하객이 보는 공개 청첩장. 로그인 없이 읽기만 합니다.
const card = ref<InvitationCard | null>(null)
const photos = ref<InvitationPhoto[]>([])
const error = ref('')
let stop: (() => void) | undefined

onMounted(async () => {
  try {
    const repo = await invitationRepository()
    const loaded = await repo.loadCard()
    card.value = loaded
    stop = repo.watchPhotos((list) => (photos.value = list))
    document.title = loaded.share.title.trim() || `${loaded.main.textLeft} ♡ ${loaded.main.textRight} 결혼합니다`
    const desc = loaded.share.description.trim()
    if (desc) document.querySelector('meta[name="description"]')?.setAttribute('content', desc)
  } catch {
    error.value = '청첩장을 불러오지 못했어요. 잠시 후 다시 열어 주세요.'
  }
})
onBeforeUnmount(() => stop?.())
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
