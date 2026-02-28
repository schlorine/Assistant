import { createRouter, createWebHistory } from 'vue-router'
import CalendarView from '../views/CalendarView.vue'
import ProjectView from '../views/ProjectView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'calendar',
      component: CalendarView
    },
    {
      path: '/projects',
      name: 'projects',
      component: ProjectView
    },
    // 日志详情页路由
    {
      path: '/day/:date',
      name: 'dayDetail',
      component: () => import('../views/DayDetailView.vue')
      },
    // 项目详情页路由
    {
      path: '/project/:id',
      name: 'projectDetail',
      component: () => import('../views/ProjectDetailView.vue')
    }
  ]
})

export default router