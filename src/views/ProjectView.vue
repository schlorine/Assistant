<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'

const router = useRouter()
const store = useProjectStore()

const currentTimestamp = ref(Date.now())
let intervalId: number

onMounted(() => {
  intervalId = window.setInterval(() => { currentTimestamp.value = Date.now() }, 100)
})
onUnmounted(() => { clearInterval(intervalId) })

// 自定义新建项目弹窗的状态控制
const showCreateModal = ref(false)
const newProjectTitle = ref('')

// 唤起弹窗时清空上一次残余的输入
const openCreateModal = () => {
  newProjectTitle.value = ''
  showCreateModal.value = true
}

const confirmCreateProject = () => {
  if (newProjectTitle.value.trim()) {
    store.addProject(newProjectTitle.value.trim())
    showCreateModal.value = false
  }
}

const handleDelete = (id: number) => {
  if (window.confirm('确定要删除该项目吗？')) {
    store.deleteProject(id)
  }
}

const editingProjectId = ref<number | null>(null)
const tempTitle = ref('')

const startEditTitle = (project: any) => {
  editingProjectId.value = project.id
  tempTitle.value = project.title
}

const saveTitle = (id: number) => {
  if (tempTitle.value.trim()) {
    store.updateProjectTitle(id, tempTitle.value.trim())
  }
  editingProjectId.value = null
}

const openProjectDetail = (id: number) => {
  router.push({ name: 'projectDetail', params: { id } })
}

const getActiveTimer = (project: any) => {
  if (!project.activeTimerId) return null
  return store.timers[project.id]?.find(t => t.id === project.activeTimerId)
}

const formatTime = (timer: any) => {
  if (!timer) return '00:00:00'
  const activeTime = Math.max(0, currentTimestamp.value - timer.startTime)
  const totalMs = timer.isRunning ? timer.elapsed + activeTime : timer.elapsed
  const totalSeconds = Math.floor(totalMs / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// 搞个小指令，确保弹窗弹出来的时候输入框能自动获取光标
const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus()
}
</script>

<template>
  <div class="project-container">
    <div class="header-section">
      <h2>我的项目</h2>
      <button class="create-btn" @click="openCreateModal">+ 创建新项目</button>
    </div>

    <div class="project-grid">
      <div v-for="project in store.projects" :key="project.id" class="project-card" @click="openProjectDetail(project.id)">
        <div class="card-content">
          <div class="card-header-row">
            <input 
              v-if="editingProjectId === project.id" 
              v-model="tempTitle" 
              @blur="saveTitle(project.id)" 
              @keyup.enter="saveTitle(project.id)" 
              @click.stop
              class="edit-title-input" 
              v-focus
            />
            <h3 v-else class="project-title" @click.stop="startEditTitle(project)" title="点击修改名称">{{ project.title }}</h3>
            
            <button class="icon-btn delete-btn" @click.stop="handleDelete(project.id)" title="删除该项目">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
          <span class="project-date">建立时间: {{ project.createDate }}</span>
        </div>
        
        <div class="timer-placeholder" @click.stop>
          <select v-model="project.activeTimerId" class="timer-select" @change="store.setActiveTimer(project.id, project.activeTimerId)">
            <option :value="undefined">-- 选择展示的计时器 --</option>
            <option v-for="timer in store.timers[project.id]" :key="timer.id" :value="timer.id">
              {{ timer.name }}
            </option>
          </select>
          
          <div class="quick-timer-display" v-if="getActiveTimer(project)">
            <span class="time-text" :class="{ running: getActiveTimer(project)?.isRunning }">
              {{ formatTime(getActiveTimer(project)) }}
            </span>
            <button class="toggle-btn" @click="store.toggleTimer(project.id, getActiveTimer(project)?.id!)">
              {{ getActiveTimer(project)?.isRunning ? '暂停' : '启动' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showCreateModal" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h3>新建项目</h3>
        <input 
          v-model="newProjectTitle" 
          class="modal-input" 
          placeholder="给新项目起个响亮的名字..."
          @keyup.enter="confirmCreateProject"
          v-focus
        />
        <div class="modal-actions">
          <button class="action-btn cancel" @click="showCreateModal = false">取消</button>
          <button class="action-btn confirm" @click="confirmCreateProject">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-container { max-width: 900px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #f3f4f6; }
.header-section h2 { margin: 0; color: #1f2937; }
.create-btn { padding: 10px 20px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
.create-btn:hover { background-color: #2563eb; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.project-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 180px;
  transition: transform 0.2s, box-shadow 0.2s;
  /* 强行开启 GPU 硬件加速图层，规避渲染闪烁 */
  transform: translateZ(0);
  backface-visibility: hidden;
}
.project-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #93c5fd; }

.card-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.project-title { margin: 0; font-size: 1.25rem; color: #111827; flex: 1; word-break: break-all; border: 1px solid transparent; border-radius: 4px; padding: 2px 4px; margin-left: -4px; transition: background-color 0.2s; }
.project-title:hover { background-color: #f3f4f6; color: #3b82f6; }
.edit-title-input { flex: 1; font-size: 1.1rem; padding: 4px; border: 1px solid #3b82f6; border-radius: 4px; outline: none; }

/* 调整后的图标删除按钮样式 */
.icon-btn.delete-btn { background: transparent; color: #9ca3af; border: none; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; margin-top: -2px; }
.icon-btn.delete-btn:hover { background: #fee2e2; color: #ef4444; }

.project-date { font-size: 0.875rem; color: #6b7280; margin-left: 2px; }

.timer-placeholder { margin-top: 16px; padding: 12px; background-color: #f9fafb; border-radius: 6px; border: 1px dashed #d1d5db; display: flex; flex-direction: column; gap: 8px; }
.timer-select {
  width: 100%;
  padding: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  outline: none;
  /* 锁定背景色与颜色模式，阻断系统级主题的渲染干扰 */
  background-color: #ffffff;
  color: #1f2937;
  color-scheme: light;
}
/* 显式声明下拉列表内部选项的背景 */
.timer-select option {
  background-color: #ffffff;
  color: #1f2937;
}
.quick-timer-display { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.time-text { font-family: monospace; font-size: 1.2rem; font-weight: bold; color: #4b5563; }
.time-text.running { color: #10b981; }
.toggle-btn { padding: 4px 12px; border: 1px solid #d1d5db; background: white; border-radius: 4px; cursor: pointer; font-size: 0.875rem; transition: background 0.2s; }
.toggle-btn:hover { background: #f3f4f6; }

/* 弹窗专区样式 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); }
.modal-content { background: #ffffff; padding: 24px; border-radius: 12px; width: 90%; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); animation: modalFadeIn 0.2s ease-out; }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(-10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
.modal-content h3 { margin: 0 0 16px 0; color: #111827; font-size: 1.25rem; }
.modal-input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 24px; font-size: 1rem; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
.modal-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; }
.action-btn { padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 0.95rem; border: none; transition: all 0.2s; }
.action-btn.cancel { background: #f3f4f6; color: #4b5563; }
.action-btn.cancel:hover { background: #e5e7eb; }
.action-btn.confirm { background: #3b82f6; color: white; }
.action-btn.confirm:hover { background: #2563eb; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3); }
</style>