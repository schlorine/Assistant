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

// 初始化时读取存下的文字
const editorContent = ref(project?.content || '')

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
</script>

<template>
  <div class="layout-wrapper" v-if="project">
    <header class="page-header">
      <button class="back-btn" @click="router.push('/projects')">返回概览</button>
      <h2>项目: {{ project.title }}</h2>
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
          <div v-for="timer in store.timers[projectId]" :key="timer.id" class="timer-card">
            <div class="timer-info">
              <div class="timer-name-container">
                <input 
                  v-if="editingTimerId === timer.id" 
                  v-model="tempTimerName" 
                  @blur="saveTimerName(timer.id)" 
                  @keyup.enter="saveTimerName(timer.id)" 
                  class="edit-timer-input"
                  autofocus
                />
              <span v-else class="timer-name" @click="startEditTimer(timer)" title="点击修改名称">{{ timer.name }}</span>
              </div>
              <span class="timer-display" :class="{ running: timer.isRunning }">
                {{ formatTime(timer) }}
              </span>
            </div>
            <button class="btn" @click="store.toggleTimer(projectId, timer.id)">
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