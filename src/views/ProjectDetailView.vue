<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { QuillEditor } from '@vueup/vue-quill'
import IconDelete from '../components/icons/IconDelete.vue'
import IconEdit from '../components/icons/IconEdit.vue'
import IconStatusNotStarted from '../components/icons/IconStatusNotStarted.vue'
import IconStatusInProgress from '../components/icons/IconStatusInProgress.vue'
import IconStatusCompleted from '../components/icons/IconStatusCompleted.vue'
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
        <button class="back-btn" @click="goBack" title="返回概览">&lt;</button>
        <h2 class="project-title">项目: {{ project?.title }}</h2>
      </div>
      
      <div class="header-actions">
        <div class="icon-btn-group">
          <button class="status-icon-btn" :class="{ active: project?.status === 'not-started' || !project?.status }" @click="changeStatus('not-started')" title="设为：未开始">
            <IconStatusNotStarted style="font-size: 16px;" />
            未开始
          </button>
          <button class="status-icon-btn" :class="{ active: project?.status === 'in-progress' }" @click="changeStatus('in-progress')" title="设为：进行中">
            <IconStatusInProgress style="font-size: 16px;" />
            进行中
          </button>
          <button class="status-icon-btn" :class="{ active: project?.status === 'completed' }" @click="changeStatus('completed')" title="设为：已完成">
            <IconStatusCompleted style="font-size: 16px;" />
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
          <button @click="handleAddTimer" class="btn primary-btn add-btn" title="新建计时器">+</button>
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
                  <IconEdit style="font-size: 16px;" />
                </button>
                <button class="icon-btn delete-btn" @click="handleDeleteTimer(timer.id)" title="删除">
                  <IconDelete style="font-size: 16px;" />
                </button>
              </div>
              </div>
              <div class="timer-display" :class="{ running: timer.isRunning }">
                {{ formatTime(timer) }}
              </div>
            </div>
            <button 
              class="timer-toggle-btn icon-btn" 
              :class="{ active: timer.isRunning }"
              @click="store.toggleTimer(projectId, timer.id)"
              :title="timer.isRunning ? '暂停' : '开始'"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="13" r="8"></circle>
                <polyline points="12 9 12 13 14 15"></polyline>
                <line x1="10" y1="2" x2="14" y2="2"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else>项目不存在</div>
</template>

<style scoped>
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

.content-split { display: flex; gap: 24px; flex: 1; min-height: 0; }
.editor-section { flex: 7; display: flex; flex-direction: column; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
:deep(.ql-container) { flex: 1; font-size: 1rem; }

.timer-section { flex: 3; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; overflow-y: auto; }
.input-group { display: flex; gap: 8px; margin-bottom: 20px; }
.input-group input { flex: 1; padding: 8px; }
.add-btn { padding: 0 16px; font-size: 1.5rem; line-height: 1; }

.timer-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 12px; }
.timer-info { display: flex; flex-direction: column; gap: 4px; }
.timer-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.timer-name { font-size: 0.95rem; color: #374151; font-weight: 500; }
.edit-timer-input { font-size: 0.9rem; padding: 2px 6px; border: 1px solid #3b82f6; border-radius: 4px; outline: none; width: 120px; }
.timer-display { font-family: monospace; font-size: 1.5rem; font-weight: bold; color: #111827; }
.timer-display.running { color: #10b981; }

.timer-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; margin-left: 8px; }
.timer-item:hover .timer-actions { opacity: 1; }

.timer-toggle-btn { background: transparent; border: none; color: #9ca3af; padding: 8px; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
.timer-toggle-btn:hover { background: #f3f4f6; color: #3b82f6; }
.timer-toggle-btn.active { color: #ef4444; background: #fee2e2; }
</style>