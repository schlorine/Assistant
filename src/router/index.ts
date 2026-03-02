import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import CalendarView from '../views/CalendarView.vue'
import ProjectView from '../views/ProjectView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    { path: '/', name: 'calendar', component: CalendarView },
    { path: '/projects', name: 'projects', component: ProjectView },
    { path: '/day/:date', name: 'dayDetail', component: () => import('../views/DayDetailView.vue') },
    { path: '/project/:id', name: 'projectDetail', component: () => import('../views/ProjectDetailView.vue') },
    { path: '/blog', name: 'blog', component: () => import('../views/BlogView.vue') },
    { path: '/blog/:id', name: 'blogDetail', component: () => import('../views/BlogDetailView.vue') },
    { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
    { path: '/whiteboard', name: 'whiteboard', component: () => import('../views/WhiteboardView.vue') }
  ]
})

// === 全局路由拦截器 (Route Guard) ===
let isInitialized = false

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 确保不管用户直接刷新哪个页面，我们都先等 Supabase 验证完他的身份
  if (!isInitialized) {
    await userStore.initializeSession()
    isInitialized = true
  }

  const isAuthenticated = !!userStore.currentUser

  if (to.name !== 'login' && !isAuthenticated) {
    // 没登录，强制踢去登录页
    next({ name: 'login' })
  } else if (to.name === 'login' && isAuthenticated) {
    // 已经登录了还想去登录页，强制送回主页
    next({ name: 'calendar' })
  } else {
    next()
  }
})

export default router