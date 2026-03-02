<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import IconDelete from '../components/icons/IconDelete.vue'

const router = useRouter()
const store = useProjectStore()

const currentTimestamp = ref(Date.now())
let intervalId: number

onMounted(() => {
  intervalId = window.setInterval(() => { currentTimestamp.value = Date.now() }, 100)
})
onUnmounted(() => { clearInterval(intervalId) })

// --- 状态筛选逻辑 ---
// 默认勾选全部三种状态
const statusFilters = ref(['not-started', 'in-progress', 'completed'])

// 动态计算过滤后的项目列表
const filteredProjects = computed(() => {
  return store.projects.filter(p => statusFilters.value.includes(p.status || 'not-started'))
})

const getStatusText = (status: string) => {
  if (status === 'in-progress') return '进行中'
  if (status === 'completed') return '已完成'
  return '未开始'
}

// --- 计时器下拉菜单状态控制 ---
const activeDropdownProjectId = ref<number | null>(null)

const toggleTimerSelect = (projectId: number) => {
  activeDropdownProjectId.value = activeDropdownProjectId.value === projectId ? null : projectId
}

const selectTimer = (projectId: number, timerId: number | undefined) => {
  store.setActiveTimer(projectId, timerId)
  activeDropdownProjectId.value = null
}
// -----------------------------

const showCreateModal = ref(false)
const newProjectTitle = ref('')

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

const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus()
}
</script>

<template>
  <div class="project-container">
<div class="header-section">
      <h2>我的项目</h2>
      
      <div class="header-actions">
        <div class="filter-group">
          <label class="filter-checkbox">
            <input type="checkbox" value="not-started" v-model="statusFilters" />
            未开始
          </label>
          <label class="filter-checkbox">
            <input type="checkbox" value="in-progress" v-model="statusFilters" />
            进行中
          </label>
          <label class="filter-checkbox">
            <input type="checkbox" value="completed" v-model="statusFilters" />
            已完成
          </label>
        </div>
        
        <div class="divider-vertical"></div>
        <button class="create-btn" @click="openCreateModal">+ 创建新项目</button>
      </div>
    </div>

    <div class="project-grid">
      <div v-for="project in filteredProjects" :key="project.id" class="project-card" @click="openProjectDetail(project.id)">
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
              <IconDelete style="font-size: 18px;" />
            </button>
          </div>
          
          <div class="card-meta-row">
            <span class="project-date">建立时间: {{ project.createDate }}</span>
            <span class="status-tag" :class="project.status || 'not-started'">
              {{ getStatusText(project.status || 'not-started') }}
            </span>
          </div>
        </div>
        
        <div class="timer-placeholder" @click.stop>
          
          <div class="quick-timer-display" v-if="getActiveTimer(project)">
            <div class="time-clickable" @click="toggleTimerSelect(project.id)">
              <span class="time-text" :class="{ running: getActiveTimer(project)?.isRunning }">
                {{ formatTime(getActiveTimer(project)) }}
              </span>
              
              <div class="timer-dropdown" v-if="activeDropdownProjectId === project.id">
                <div class="dropdown-header">选择你要呈现的计时器</div>
                <div class="dropdown-item" @click.stop="selectTimer(project.id, undefined)">-- 隐藏计时器 --</div>
                <div class="dropdown-item" v-for="timer in store.timers[project.id]" :key="timer.id" @click.stop="selectTimer(project.id, timer.id)">
                  {{ timer.name }}
                </div>
              </div>
            </div>
            
            <button class="toggle-btn icon-btn" :class="{ active: getActiveTimer(project)?.isRunning }" @click="store.toggleTimer(project.id, getActiveTimer(project)?.id!)" :title="getActiveTimer(project)?.isRunning ? '暂停' : '启动'">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="13" r="8"></circle>
                <polyline points="12 9 12 13 14 15"></polyline>
                <line x1="10" y1="2" x2="14" y2="2"></line>
              </svg>
            </button>
          </div>
          
          <div v-else class="no-timer-hint" @click="toggleTimerSelect(project.id)">
            <span class="hint-text">点击选择展示计时器...</span>
            
            <div class="timer-dropdown" v-if="activeDropdownProjectId === project.id">
              <div class="dropdown-header">选择你要呈现的计时器</div>
              <div class="dropdown-item" v-for="timer in store.timers[project.id]" :key="timer.id" @click.stop="selectTimer(project.id, timer.id)">
                {{ timer.name }}
              </div>
            </div>
          </div>

        </div>
          
        </div>
      </div>
      
      <div v-if="filteredProjects.length === 0" class="empty-hint">
        没有符合当前筛选条件的项目...
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
</template>

<style scoped>
.header-section h2 { font-size: 1.8rem; }
.header-actions { display: flex; align-items: center; gap: 20px; }
.filter-group { display: flex; gap: 16px; align-items: center; }
.filter-checkbox { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.95rem; color: #6b7280; user-select: none; font-weight: 500; transition: color 0.2s; }
.filter-checkbox:hover { color: #374151; }
.filter-checkbox input { accent-color: #3b82f6; width: 16px; height: 16px; cursor: pointer; margin: 0; }
.divider-vertical { width: 1px; height: 24px; background-color: #e5e7eb; }
.create-btn { padding: 8px 16px; }

.project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.project-card { display: flex; flex-direction: column; justify-content: space-between; min-height: 180px; transform: translateZ(0); backface-visibility: hidden; cursor: pointer; }

.card-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.project-title { margin: 0; font-size: 1.25rem; color: #111827; flex: 1; word-break: break-all; border: 1px solid transparent; border-radius: 4px; padding: 2px 4px; margin-left: -4px; transition: background-color 0.2s; }
.project-title:hover { background-color: #f3f4f6; color: #3b82f6; }
.edit-title-input { flex: 1; font-size: 1.1rem; padding: 4px; }
.icon-btn.delete-btn { margin-top: -2px; }

.card-meta-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.project-date { font-size: 0.875rem; color: #6b7280; margin-left: 2px; }
.status-tag { font-size: 0.75rem; padding: 4px 10px; border-radius: 12px; font-weight: 600; }
.status-tag.not-started { background-color: #f3f4f6; color: #6b7280; }
.status-tag.in-progress { background-color: #dbeafe; color: #1d4ed8; }
.status-tag.completed { background-color: #d1fae5; color: #047857; }

.timer-placeholder { margin-top: 16px; padding: 12px; background-color: #f9fafb; border-radius: 6px; border: 1px dashed #d1d5db; position: relative; display: flex; flex-direction: column; gap: 8px; }
.quick-timer-display { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.time-text { font-family: monospace; font-size: 1.2rem; font-weight: bold; color: #4b5563; }
.time-text.running { color: #10b981; }

.time-clickable { position: relative; cursor: pointer; user-select: none; padding: 2px 6px; border-radius: 4px; transition: background 0.2s; margin-left: -6px; }
.time-clickable:hover { background-color: #e5e7eb; }
.no-timer-hint { cursor: pointer; color: #9ca3af; font-size: 0.875rem; text-align: center; padding: 4px; position: relative; transition: color 0.2s; }
.no-timer-hint:hover { color: #4b5563; }

.timer-dropdown { position: absolute; top: 110%; left: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 200px; z-index: 50; padding: 8px 0; animation: dropdownFade 0.15s ease-out; cursor: default; }
@keyframes dropdownFade { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
.dropdown-header { font-size: 0.75rem; color: #9ca3af; padding: 4px 12px 8px; border-bottom: 1px solid #f3f4f6; margin-bottom: 4px; }
.dropdown-item { padding: 8px 12px; font-size: 0.9rem; color: #374151; transition: background 0.2s; cursor: pointer; }
.dropdown-item:hover { background: #f3f4f6; color: #111827; }

.toggle-btn { color: #9ca3af; padding: 6px; border-radius: 6px; }
.toggle-btn.active { color: #ef4444; background: #fee2e2; }

.empty-hint { grid-column: 1 / -1; text-align: center; color: #9ca3af; padding: 40px; font-size: 1.1rem; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); }
.modal-content { background: #ffffff; padding: 24px; border-radius: 12px; width: 90%; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); animation: modalFadeIn 0.2s ease-out; }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(-10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
.modal-content h3 { margin: 0 0 16px 0; color: #111827; font-size: 1.25rem; }
.modal-input { width: 100%; padding: 10px 12px; margin-bottom: 24px; font-size: 1rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; }
.action-btn { padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 0.95rem; border: none; transition: all 0.2s; }
.action-btn.cancel { background: #f3f4f6; color: #4b5563; }
.action-btn.cancel:hover { background: #e5e7eb; }

/* ================= 移动端细节适配 ================= */
@media (max-width: 768px) {
  /* 1. 头部操作区改为垂直堆叠 */
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
  }

  /* 2. 筛选状态组允许换行，隐藏电脑端的竖向分割线 */
  .filter-group {
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  }
  .divider-vertical {
    display: none; 
  }

  /* 3. 新建按钮变成撑满屏幕的 App 级大按钮，方便拇指点击 */
  .create-btn {
    width: 100%;
    padding: 12px;
    font-size: 1.05rem;
    display: flex;
    justify-content: center;
  }

  /* 4. 修复卡片内的下拉菜单在手机边缘被截断的问题 */
  .timer-dropdown {
    left: auto;
    right: 0; /* 强制靠右对齐 */
    width: 220px;
    transform-origin: top right;
  }
}
</style>