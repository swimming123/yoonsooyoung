<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import { firebaseOptions } from '@/lib/firebaseConfig'
import { COPY_TARGETS, sourceFirebaseOptions, targetKey, type CopyTarget } from './migration'

type Row = { status: 'wait' | 'run' | 'done' | 'skip' | 'error'; count: number; message: string }

const email = ref('')
const password = ref('')
const sourceUser = ref('')
const loginError = ref('')
const running = ref(false)
const finished = ref(false)
const rows = reactive<Record<string, Row>>(
  Object.fromEntries(COPY_TARGETS.map((t) => [targetKey(t), { status: 'wait', count: 0, message: '' }])),
)
const sameProject = computed(() => firebaseOptions.projectId === sourceFirebaseOptions.projectId)
const total = computed(() => Object.values(rows).reduce((n, r) => n + r.count, 0))
const failed = computed(() => Object.values(rows).filter((r) => r.status === 'error').length)

let sourceAuth: Auth | undefined
let sourceDb: Firestore | undefined

async function sdk() {
  const [app, auth, fs, site] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
    import('@/lib/firebase'),
  ])
  return { app, auth, fs, site }
}

async function loginSource() {
  loginError.value = ''
  try {
    const { app, auth, fs } = await sdk()
    // 사이트 앱과 섞이지 않게 이름을 붙인 두 번째 앱으로 엽니다.
    const src = app.getApps().find((a) => a.name === 'wedding-log') ?? app.initializeApp(sourceFirebaseOptions, 'wedding-log')
    sourceAuth = auth.getAuth(src)
    await auth.setPersistence(sourceAuth, auth.inMemoryPersistence)
    const cred = await auth.signInWithEmailAndPassword(sourceAuth, email.value.trim(), password.value)
    sourceDb = fs.getFirestore(src)
    sourceUser.value = cred.user.email ?? cred.user.uid
    password.value = ''
  } catch (e) {
    loginError.value = (e as { code?: string }).code ?? String(e)
  }
}

async function copyOne(t: CopyTarget) {
  const { fs, site } = await sdk()
  const row = rows[targetKey(t)]!
  row.status = 'run'
  row.count = 0
  row.message = ''
  try {
    if (t.kind === 'doc') {
      const snap = await fs.getDoc(fs.doc(sourceDb!, ...t.path))
      if (!snap.exists()) {
        row.status = 'skip'
        row.message = '기존 프로젝트에 없음'
        return
      }
      await fs.setDoc(fs.doc(site.db(), ...t.path), snap.data())
      row.count = 1
    } else {
      const snap = await fs.getDocs(fs.collection(sourceDb!, t.path))
      // 사진 문서는 하나가 1MB 가까이 될 수 있어서 한 건씩 씁니다.
      for (const d of snap.docs) {
        await fs.setDoc(fs.doc(site.db(), t.path, d.id), d.data())
        row.count++
      }
      if (!snap.size) row.message = '비어 있음'
    }
    row.status = 'done'
  } catch (e) {
    row.status = 'error'
    const code = (e as { code?: string }).code
    row.message =
      code === 'permission-denied'
        ? '권한 없음: 이 사이트 프로젝트의 Firestore 규칙에 지금 로그인한 계정 uid 가 있는지 확인해 주세요.'
        : (code ?? String(e))
  }
}

async function run() {
  if (!sourceDb || running.value) return
  if (!confirm(`${firebaseOptions.projectId} 프로젝트에 같은 위치의 데이터가 있으면 기존 웨딩플래너 데이터로 덮어써요. 진행할까요?`)) return
  running.value = true
  finished.value = false
  for (const t of COPY_TARGETS) await copyOne(t)
  running.value = false
  finished.value = true
}

const label: Record<Row['status'], string> = { wait: '대기', run: '복사 중…', done: '완료', skip: '건너뜀', error: '실패' }
</script>

<template>
  <h1>웨딩플래너 데이터 옮기기</h1>
  <p class="lead">
    기존 웨딩플래너 프로젝트(<code>{{ sourceFirebaseOptions.projectId }}</code>)의 데이터를 이 사이트 프로젝트(<code>{{
      firebaseOptions.projectId
    }}</code>)로 복사해요. 원본은 지우지 않아요.
  </p>

  <p v-if="sameProject" class="box warn">이미 같은 프로젝트를 쓰고 있어서 옮길 필요가 없어요.</p>

  <template v-else>
    <section class="box">
      <h2>1. 기존 웨딩플래너 계정으로 로그인</h2>
      <p v-if="sourceUser" class="ok">✓ {{ sourceUser }} 로 로그인했어요.</p>
      <form v-else class="login" @submit.prevent="loginSource">
        <input v-model="email" type="email" autocomplete="username" placeholder="기존 웨딩플래너 이메일" required />
        <input v-model="password" type="password" autocomplete="current-password" placeholder="비밀번호" required />
        <button type="submit" class="primary">로그인</button>
      </form>
      <p v-if="loginError" class="err">로그인 실패: {{ loginError }}</p>
      <p class="hint">이 로그인은 복사에만 쓰고, 페이지를 닫으면 사라져요.</p>
    </section>

    <section class="box">
      <h2>2. 복사하기</h2>
      <table>
        <tbody>
          <tr v-for="t in COPY_TARGETS" :key="targetKey(t)">
            <td>{{ t.label }}<br /><code>{{ targetKey(t) }}</code></td>
            <td :class="rows[targetKey(t)]!.status">
              {{ label[rows[targetKey(t)]!.status] }}
              <template v-if="rows[targetKey(t)]!.count"> · {{ rows[targetKey(t)]!.count }}건</template>
              <div v-if="rows[targetKey(t)]!.message" class="msg">{{ rows[targetKey(t)]!.message }}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <button type="button" class="primary" :disabled="!sourceUser || running" @click="run">
        {{ running ? '복사 중…' : finished ? '다시 복사하기' : '복사 시작' }}
      </button>
      <p v-if="finished" :class="failed ? 'err' : 'ok'">
        {{ failed ? `${failed}개 항목이 실패했어요. 위 메시지를 확인해 주세요.` : `끝났어요. 모두 ${total}건을 복사했어요.` }}
      </p>
    </section>

    <section v-if="finished && !failed" class="box">
      <h2>3. 확인</h2>
      <p>
        <RouterLink to="/wedding">웨딩플래너</RouterLink>와
        <RouterLink :to="{ name: 'invitation-editor' }">청첩장 꾸미기</RouterLink>를 열어 내용이 다 보이는지 확인해 주세요.
      </p>
    </section>
  </template>
</template>

<style scoped>
.lead { color: var(--muted); }
.box { border: 1px solid var(--line); border-radius: 10px; padding: 16px 18px; margin: 16px 0; }
.box h2 { margin: 0 0 12px; font-size: 1.05rem; }
.warn { background: var(--bg-soft); }
.login { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; }
.hint { color: var(--muted); font-size: 0.85rem; margin: 8px 0 0; }
.ok { color: var(--income); }
.err { color: var(--expense); }
table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 0.92rem; }
td { padding: 8px 6px; border-bottom: 1px solid var(--line); vertical-align: top; }
td code { color: var(--muted); font-size: 0.8rem; }
td.done { color: var(--income); }
td.error { color: var(--expense); }
td.skip { color: var(--muted); }
.msg { font-size: 0.8rem; }
@media (max-width: 640px) { .login { grid-template-columns: 1fr; } }
</style>
