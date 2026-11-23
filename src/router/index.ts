import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** 주인으로 로그인해야 볼 수 있는 화면 */
    requiresOwner?: boolean
    title?: string
    /** 본문 폭 제한 없이 넓게 보여줄 화면 */
    wide?: boolean
    /** 사이트 머리글 없이 화면 전체를 쓰는 페이지(공개 청첩장) */
    bare?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/features/blog/BlogListView.vue'),
      meta: { title: '블로그' },
    },
    {
      path: '/blog/:slug',
      name: 'post',
      component: () => import('@/features/blog/BlogPostView.vue'),
      props: true,
    },
    {
      path: '/ledger',
      name: 'ledger',
      component: () => import('@/features/ledger/LedgerView.vue'),
      meta: { requiresOwner: true, title: '가계부' },
    },
    {
      path: '/wedding',
      name: 'wedding',
      component: () => import('@/features/wedding/WeddingView.vue'),
      meta: { requiresOwner: true, title: '웨딩플래너', wide: true },
    },
    {
      path: '/wedding/migrate',
      name: 'wedding-migrate',
      component: () => import('@/features/wedding/WeddingMigrateView.vue'),
      meta: { requiresOwner: true, title: '웨딩플래너 데이터 옮기기' },
    },
    {
      path: '/wedding/invitation',
      name: 'invitation-editor',
      component: () => import('@/features/invitation/InvitationEditorView.vue'),
      meta: { requiresOwner: true, title: '청첩장 만들기', wide: true },
    },
    {
      path: '/invite',
      name: 'invite',
      component: () => import('@/features/invitation/InvitationPublicView.vue'),
      meta: { bare: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '로그인' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresOwner) return true
  const authStore = useAuthStore()
  await authStore.init()
  if (authStore.isOwner) return true
  return { name: 'login', query: { redirect: to.fullPath } }
})

router.afterEach((to) => {
  if (to.meta.title) document.title = `${to.meta.title} · yoonsooyoung`
})
