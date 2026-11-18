import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** 주인으로 로그인해야 볼 수 있는 화면 */
    requiresOwner?: boolean
    title?: string
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
      meta: { requiresOwner: true, title: '웨딩플래너' },
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
