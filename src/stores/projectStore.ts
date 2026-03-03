import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { supabase } from '../utils/supabase'
import { useUserStore } from './userStore'
import { getTodayYMD } from '../utils/timeFormat'

export interface Project { id: number; title: string; createDate: string; content?: string; activeTimerId?: number; status: 'not-started' | 'in-progress' | 'completed' }
export interface Timer { id: number; name: string; isRunning: boolean; startTime: number; elapsed: number }

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const timers = ref<Record<number, Timer[]>>({})
  const userStore = useUserStore()

  const fetchProjectsData = async () => {
    if (!userStore.currentUser) return
    const [projectsRes, timersRes] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', userStore.currentUser.id).order('created_at', { ascending: true }),
      supabase.from('timers').select('*').eq('user_id', userStore.currentUser.id)
    ])
    if (projectsRes.data) {
      projects.value = projectsRes.data.map((p: any) => ({
        id: p.id, title: p.title, createDate: p.create_date, content: p.content || '', status: p.status, activeTimerId: p.active_timer_id || undefined
      }))
    }
    if (timersRes.data) {
      const tempTimers: Record<number, Timer[]> = {}
      timersRes.data.forEach((t: any) => {
        if (!tempTimers[t.project_id]) tempTimers[t.project_id] = []
        tempTimers[t.project_id]!.push({ id: t.id, name: t.name, isRunning: t.is_running, startTime: t.start_time, elapsed: t.elapsed })
      })
      timers.value = tempTimers
    }
  }

  watch(() => userStore.currentUser?.id, (userId) => {
    if (userId) fetchProjectsData()
    else { projects.value = []; timers.value = {} }
  }, { immediate: true })

  const addProject = (title: string) => {
    if (!userStore.currentUser) return null
    const newId = Date.now()
    projects.value.push({ id: newId, title: title, createDate: getTodayYMD(), content: '', status: 'not-started' })
    timers.value[newId] = []
    supabase.from('projects').insert([{ id: newId, user_id: userStore.currentUser.id, title: title, create_date: getTodayYMD(), content: '', status: 'not-started' }]).then()
    return newId
  }

  const deleteProject = (id: number) => {
    projects.value = projects.value.filter(p => p.id !== id)
    delete timers.value[id]
    if (userStore.currentUser) supabase.from('projects').delete().eq('id', id).eq('user_id', userStore.currentUser.id).then() // 【修复】
  }

  const updateProjectTitle = (id: number, title: string) => {
    const project = projects.value.find(p => p.id === id)
    if (project) {
      project.title = title
      if (userStore.currentUser) supabase.from('projects').update({ title }).eq('id', id).then() // 【修复】
    }
  }

  const updateProjectContent = (id: number, content: string) => {
    const project = projects.value.find(p => p.id === id)
    if (project) {
      project.content = content
      if (userStore.currentUser) supabase.from('projects').update({ content }).eq('id', id).then() // 【修复】
    }
  }

  const updateProjectStatus = (id: number, status: 'not-started' | 'in-progress' | 'completed') => {
    const project = projects.value.find(p => p.id === id)
    if (project) {
      project.status = status
      if (userStore.currentUser) supabase.from('projects').update({ status }).eq('id', id).then() // 【修复】
    }
  }

  const setActiveTimer = (projectId: number, timerId: number | undefined) => {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      project.activeTimerId = timerId
      if (userStore.currentUser) supabase.from('projects').update({ active_timer_id: timerId || null }).eq('id', projectId).then() // 【修复】
    }
  }

  const addTimer = (projectId: number, name: string) => {
    if (!userStore.currentUser) return
    if (!timers.value[projectId]) timers.value[projectId] = []
    const newTimer: Timer = { id: Date.now(), name, isRunning: false, startTime: 0, elapsed: 0 }
    timers.value[projectId].push(newTimer)
    supabase.from('timers').insert([{ id: newTimer.id, project_id: projectId, user_id: userStore.currentUser.id, name: newTimer.name, is_running: false, start_time: 0, elapsed: 0 }]).then()
  }

  const updateTimerName = (projectId: number, timerId: number, name: string) => {
    const timer = timers.value[projectId]?.find(t => t.id === timerId)
    if (timer) {
      timer.name = name
      if (userStore.currentUser) supabase.from('timers').update({ name }).eq('id', timerId).then() // 【修复】
    }
  }

  const deleteTimer = (projectId: number, timerId: number) => {
    if (timers.value[projectId]) timers.value[projectId] = timers.value[projectId].filter(t => t.id !== timerId)
    const project = projects.value.find(p => p.id === projectId)
    if (project && project.activeTimerId === timerId) {
      project.activeTimerId = undefined
      if (userStore.currentUser) supabase.from('projects').update({ active_timer_id: null }).eq('id', projectId).then()
    }
    if (userStore.currentUser) supabase.from('timers').delete().eq('id', timerId).then() // 【修复】
  }

  const toggleTimer = (projectId: number, timerId: number) => {
    const timer = timers.value[projectId]?.find(t => t.id === timerId)
    if (!timer) return
    if (timer.isRunning) { timer.elapsed += Date.now() - timer.startTime; timer.isRunning = false } 
    else { timer.startTime = Date.now(); timer.isRunning = true }
    if (userStore.currentUser) {
      supabase.from('timers').update({ is_running: timer.isRunning, start_time: timer.startTime, elapsed: timer.elapsed }).eq('id', timerId).then() // 【修复】
    }
  }
  
  return { projects, timers, fetchProjectsData, addProject, deleteProject, updateProjectTitle, updateProjectContent, setActiveTimer, addTimer, updateTimerName, toggleTimer, deleteTimer, updateProjectStatus }
})