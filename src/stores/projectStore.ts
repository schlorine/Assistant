import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useProjectStore = defineStore('project', () => {
  const savedProjects = localStorage.getItem('projects')
  const savedTimers = localStorage.getItem('timers')

  // 数据结构新增 activeTimerId 字段，用于在卡片上展示特定的计时器
  const projects = ref<{ id: number; title: string; createDate: string; content?: string; activeTimerId?: number }[]>(
    savedProjects ? JSON.parse(savedProjects) : []
  )

  const timers = ref<Record<number, { id: number; name: string; isRunning: boolean; startTime: number; elapsed: number }[]>>(
    savedTimers ? JSON.parse(savedTimers) : {}
  )

  watch(projects, (newVal) => { localStorage.setItem('projects', JSON.stringify(newVal)) }, { deep: true })
  watch(timers, (newVal) => { localStorage.setItem('timers', JSON.stringify(newVal)) }, { deep: true })

  const addProject = (title: string) => {
    const newId = projects.value.length ? Math.max(...projects.value.map(p => p.id)) + 1 : 1
    projects.value.push({
      id: newId,
      title: title,
      createDate: new Date().toISOString().split('T')[0]!,
      content: ''
    })
    timers.value[newId] = []
    return newId
  }

  const deleteProject = (id: number) => {
    projects.value = projects.value.filter(p => p.id !== id)
    delete timers.value[id]
  }

  const updateProjectTitle = (id: number, title: string) => {
    const project = projects.value.find(p => p.id === id)
    if (project) project.title = title
  }

  const updateProjectContent = (id: number, content: string) => {
    const project = projects.value.find(p => p.id === id)
    if (project) project.content = content
  }

  // 设定项目卡片上快捷显示的计时器
  const setActiveTimer = (projectId: number, timerId: number | undefined) => {
    const project = projects.value.find(p => p.id === projectId)
    if (project) project.activeTimerId = timerId
  }

  const addTimer = (projectId: number, name: string) => {
    if (!timers.value[projectId]) timers.value[projectId] = []
    timers.value[projectId].push({ id: Date.now(), name, isRunning: false, startTime: 0, elapsed: 0 })
  }

  const updateTimerName = (projectId: number, timerId: number, name: string) => {
    const timer = timers.value[projectId]?.find(t => t.id === timerId)
    if (timer) timer.name = name
  }

  const toggleTimer = (projectId: number, timerId: number) => {
    const timer = timers.value[projectId]?.find(t => t.id === timerId)
    if (!timer) return

    if (timer.isRunning) {
      timer.elapsed += Date.now() - timer.startTime
      timer.isRunning = false
    } else {
      timer.startTime = Date.now()
      timer.isRunning = true
    }
  }

  return { 
    projects, timers, addProject, deleteProject, updateProjectTitle, 
    updateProjectContent, setActiveTimer, addTimer, updateTimerName, toggleTimer 
  }
})