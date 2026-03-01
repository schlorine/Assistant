import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useProjectStore = defineStore('project', () => {
  const savedProjects = localStorage.getItem('projects')
  const savedTimers = localStorage.getItem('timers')

// 1. 在项目数据初始化时，兼容旧数据并赋予默认状态 'not-started'
  const parsedProjects = savedProjects ? JSON.parse(savedProjects) : []
  const projects = ref<{ id: number; title: string; createDate: string; content?: string; activeTimerId?: number; status: 'not-started' | 'in-progress' | 'completed' }[]>(
    parsedProjects.map((p: any) => ({ ...p, status: p.status || 'not-started' }))
  )

  const timers = ref<Record<number, { id: number; name: string; isRunning: boolean; startTime: number; elapsed: number }[]>>(
    savedTimers ? JSON.parse(savedTimers) : {}
  )

  // 首次访问初始化示例项目
  if (!savedProjects) {
    const todayStr = new Date().toISOString().split('T')[0]!
    const sampleProjectId = 1
    
    projects.value.push({
      id: sampleProjectId,
      title: '示例项目：前端架构构建',
      createDate: todayStr,
      content: '<h3>项目概览</h3><p>这是一个长期维度的示例项目。你可以在此拆解复杂的任务层级，或保存重要的技术参考链接。</p>',
      status: 'not-started'
    })
    
    // 注入示例计时器
    timers.value[sampleProjectId] = [
      { id: Date.now(), name: 'UI原型设计', isRunning: false, startTime: 0, elapsed: 3600000 }, // 预设 1 小时累计时长
      { id: Date.now() + 1, name: '后端接口对接', isRunning: false, startTime: 0, elapsed: 0 }
    ]
    
    // 默认展示第一个计时器
    projects.value[0]!.activeTimerId = timers.value[sampleProjectId][0]!.id
    
    localStorage.setItem('projects', JSON.stringify(projects.value))
    localStorage.setItem('timers', JSON.stringify(timers.value))
  }

  watch(projects, (newVal) => { localStorage.setItem('projects', JSON.stringify(newVal)) }, { deep: true })
  watch(timers, (newVal) => { localStorage.setItem('timers', JSON.stringify(newVal)) }, { deep: true })

  const addProject = (title: string) => {
    const newId = projects.value.length ? Math.max(...projects.value.map(p => p.id)) + 1 : 1
    projects.value.push({
      id: newId,
      title: title,
      createDate: new Date().toISOString().split('T')[0]!,
      content: '',
      status: 'not-started' // 新增这一行
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

  const deleteTimer = (projectId: number, timerId: number) => {
    if (timers.value[projectId]) {
      timers.value[projectId] = timers.value[projectId].filter(t => t.id !== timerId)
    }
    // 如果删除的是当前正在展示的计时器，把 activeTimerId 置空
    const project = projects.value.find(p => p.id === projectId)
    if (project && project.activeTimerId === timerId) {
      project.activeTimerId = undefined
    }
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

  const updateProjectStatus = (id: number, status: 'not-started' | 'in-progress' | 'completed') => {
    const project = projects.value.find(p => p.id === id)
    if (project) project.status = status
  }
  
  return { 
    projects, timers, addProject, deleteProject, updateProjectTitle, 
    updateProjectContent, setActiveTimer, addTimer, updateTimerName,
    toggleTimer, deleteTimer, updateProjectStatus 
  }
})