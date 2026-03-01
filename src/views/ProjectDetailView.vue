<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

// 添加控制计时器重命名的逻辑
const editingTimerId = ref<number | null>(null)
const tempTimerName = ref('')

const route = useRoute()
const router = useRouter()
const store = useProjectStore()

const projectId = Number(route.params.id)
const project = store.projects.find(p => p.id === projectId)

// 规范化状态变更函数，避免模板解析报错
const changeStatus = (newStatus: 'not-started' | 'in-progress' | 'completed') => {
  if (project) {
    project.status = newStatus
  }
}
// 初始化时读取存下的文字
const editorContent = ref(project?.content || '')

const handleDeleteTimer = (timerId: number) => {
  if (window.confirm('确定要删除这个计时器及其所有时长记录吗？')) {
    store.deleteTimer(projectId, timerId)
  }
}

// 计时器重命名函数
const startEditTimer = (timer: any) => {
  editingTimerId.value = timer.id
  tempTimerName.value = timer.name
}

const saveTimerName = (timerId: number) => {
  if (tempTimerName.value.trim()) {
    store.updateTimerName(projectId, timerId, tempTimerName.value.trim())
  }
  editingTimerId.value = null
}

// 只要文字有改动，立刻写进本地存储
watch(editorContent, (newVal) => {
  store.updateProjectContent(projectId, newVal)
})

const newTimerName = ref('')
const currentTimestamp = ref(Date.now())
let intervalId: number

onMounted(() => {
  // 把刷新间隔缩短到 100 毫秒，让界面响应更紧凑
  intervalId = window.setInterval(() => {
    currentTimestamp.value = Date.now()
  }, 100)
})

onUnmounted(() => {
  clearInterval(intervalId)
})

const handleAddTimer = () => {
  if (newTimerName.value.trim()) {
    store.addTimer(projectId, newTimerName.value)
    newTimerName.value = ''
  }
}

const formatTime = (timer: { isRunning: boolean; elapsed: number; startTime: number }) => {
  // 加上 Math.max(0, ...) 彻底掐断出现负数的可能
  const activeTime = Math.max(0, currentTimestamp.value - timer.startTime)
  const totalMs = timer.isRunning ? timer.elapsed + activeTime : timer.elapsed
    
  const totalSeconds = Math.floor(totalMs / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="layout-wrapper" v-if="project">

    <header class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">返回概览</button>
        <h2 class="project-title">项目: {{ project?.title }}</h2>
      </div>
      
      <div class="header-actions">
        <div class="icon-btn-group">
          <button 
            class="status-icon-btn" 
            :class="{ active: project?.status === 'not-started' || !project?.status }" 
            @click="changeStatus('not-started')"
            title="设为：未开始"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            未开始
          </button>
          <button 
            class="status-icon-btn" 
            :class="{ active: project?.status === 'in-progress' }" 
            @click="changeStatus('in-progress')"
            title="设为：进行中"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            进行中
          </button>
          <button 
            class="status-icon-btn" 
            :class="{ active: project?.status === 'completed' }" 
            @click="changeStatus('completed')"
            title="设为：已完成"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            已完成
          </button>
        </div>
      </div>
    </header>
    <div class="content-split">
      <div class="editor-section">
        <QuillEditor theme="snow" v-model:content="editorContent" contentType="html" />
      </div>

      <div class="timer-section">
        <h3>项目计时器</h3>
        <div class="input-group">
          <input v-model="newTimerName" placeholder="新计时器名称" @keyup.enter="handleAddTimer" />
          <button @click="handleAddTimer" class="btn primary-btn">新建</button>
        </div>

        <div class="timer-list">
          <div v-for="timer in store.timers[projectId]" :key="timer.id" class="timer-item">
            <div class="timer-info">
              <div class="timer-header">
                <input 
                  v-if="editingTimerId === timer.id" 
                  v-model="tempTimerName"
                  @blur="saveTimerName(timer.id)"
                  @keyup.enter="saveTimerName(timer.id)"
                  class="edit-timer-input"
                  autoFocus
                />
                <span v-else class="timer-name">{{ timer.name }}</span>
                
                <div class="timer-actions" v-if="editingTimerId !== timer.id">
                <button class="icon-btn edit-btn" @click="startEditTimer(timer)" title="重命名">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="icon-btn delete-btn" @click="handleDeleteTimer(timer.id)" title="删除">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
              </div>
              <div class="timer-display" :class="{ running: timer.isRunning }">
                {{ formatTime(timer) }}
              </div>
            </div>
            <button 
              class="timer-toggle-btn" 
              :class="{ active: timer.isRunning }"
              @click="store.toggleTimer(projectId, timer.id)"
            >
              {{ timer.isRunning ? '暂停' : '开始' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else>项目不存在</div>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
.header-left { display: flex; align-items: center; gap: 16px; }
.project-title { margin: 0; font-size: 1.5rem; color: #111827; }
.header-actions { display: flex; align-items: center; }

.icon-btn-group { display: flex; gap: 8px; }
.status-icon-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; border: 1px solid transparent; background: #f9fafb; color: #9ca3af; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; }
.status-icon-btn:hover { background: #f3f4f6; color: #4b5563; }
.status-icon-btn svg { opacity: 0.7; }

.status-icon-btn.active:nth-child(1) { background: #f3f4f6; color: #4b5563; border-color: #d1d5db; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); }
.status-icon-btn.active:nth-child(2) { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; box-shadow: inset 0 1px 2px rgba(37,99,235,0.05); }
.status-icon-btn.active:nth-child(3) { background: #ecfdf5; color: #059669; border-color: #a7f3d0; box-shadow: inset 0 1px 2px rgba(5,150,105,0.05); }
.status-icon-btn.active svg { opacity: 1; }

.icon-btn-group { display: flex; gap: 8px; }
.status-icon-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; border: 1px solid transparent; background: #f9fafb; color: #9ca3af; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; }
.status-icon-btn:hover { background: #f3f4f6; color: #4b5563; }
.status-icon-btn svg { opacity: 0.7; }

/* 各个状态激活时的高亮样式 */
.status-icon-btn.active:nth-child(1) { background: #f3f4f6; color: #4b5563; border-color: #d1d5db; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); }
.status-icon-btn.active:nth-child(2) { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; box-shadow: inset 0 1px 2px rgba(37,99,235,0.05); }
.status-icon-btn.active:nth-child(3) { background: #ecfdf5; color: #059669; border-color: #a7f3d0; box-shadow: inset 0 1px 2px rgba(5,150,105,0.05); }
.status-icon-btn.active svg { opacity: 1; }

.timer-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.timer-name { font-size: 0.95rem; color: #374151; font-weight: 500; }
.edit-timer-input { font-size: 0.9rem; padding: 2px 6px; border: 1px solid #3b82f6; border-radius: 4px; outline: none; width: 120px; }

/* 容器平时透明，鼠标悬浮到计时器条目时显现 */
.timer-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; margin-left: 8px; }
.timer-item:hover .timer-actions { opacity: 1; }

/* 基础图标按钮样式：透明背景，平时淡灰色 */
.icon-btn { background: transparent; color: #9ca3af; border: none; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }

/* 单独悬浮时的高亮颜色 */
.icon-btn.edit-btn:hover { background: #eff6ff; color: #3b82f6; }
.icon-btn.delete-btn:hover { background: #fee2e2; color: #ef4444; }

.timer-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 12px; }
.timer-display { font-family: monospace; font-size: 1.5rem; font-weight: bold; color: #111827; }
.timer-display.running { color: #10b981; }
.timer-toggle-btn { padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
.timer-toggle-btn.active { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }
.layout-wrapper { max-width: 1200px; margin: 0 auto; padding: 20px; height: calc(100vh - 100px); display: flex; flex-direction: column; }
.page-header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
.back-btn { padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; }
.content-split { display: flex; gap: 24px; flex: 1; min-height: 0; }
.editor-section { flex: 7; display: flex; flex-direction: column; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
:deep(.ql-container) { flex: 1; font-size: 1rem; }
.timer-section { flex: 3; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; overflow-y: auto; }
.input-group { display: flex; gap: 8px; margin-bottom: 20px; }
.input-group input { flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; }
.btn { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; background: white; }
.primary-btn { background: #3b82f6; color: white; border: none; }
.timer-card { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 12px; }
.timer-info { display: flex; flex-direction: column; gap: 4px; }
.timer-name { font-size: 0.9rem; color: #4b5563; }
.timer-display { font-size: 1.5rem; font-weight: bold; font-family: monospace; }
.timer-display.running { color: #10b981; }
</style>