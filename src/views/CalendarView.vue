<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useJournalStore } from '../stores/journalStore'
import IconDelete from '../components/icons/IconDelete.vue'
import IconEdit from '../components/icons/IconEdit.vue'
import IconChevronLeft from '../components/icons/IconChevronLeft.vue'
import IconChevronRight from '../components/icons/IconChevronRight.vue'

const router = useRouter()
const store = useJournalStore()

const currentDate = ref(new Date())

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const firstDayOffset = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const prevMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const getFullDateString = (day: number) => {
  return `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const handleDayClick = (day: number) => {
  router.push({
    name: 'dayDetail',
    params: { date: getFullDateString(day) }
  })
}

const hasJournal = (day: number) => {
  const record = store.records[getFullDateString(day)]
  if (!record || !record.content) return false
  const plainText = record.content.replace(/<[^>]+>/g, '').trim()
  return plainText.length > 0 || record.content.includes('<img')
}

const getTodos = (day: number) => {
  return store.records[getFullDateString(day)]?.todos || []
}

// 新增：判断当前渲染的日期是否为物理时间的“今天”
const realToday = new Date()
const isToday = (day: number) => {
  return currentYear.value === realToday.getFullYear() &&
         currentMonth.value === realToday.getMonth() &&
         day === realToday.getDate()
}

const isEditingDate = ref(false)
const editDateValue = ref('')
const dateInputRef = ref<HTMLInputElement | null>(null)

const startEditDate = async () => {
  editDateValue.value = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}`
  isEditingDate.value = true
  await nextTick()
  dateInputRef.value?.focus()
}

const saveEditDate = () => {
  if (!isEditingDate.value) return
  isEditingDate.value = false
  if (editDateValue.value) {
    const [year, month] = editDateValue.value.split('-')
    currentDate.value = new Date(Number(year), Number(month) - 1, 1)
  }
}

// ================= 全局待办视图逻辑 =================
const viewMode = ref<'calendar' | 'todos'>('calendar')

// 自动生成当天的格式化日期，作为新建待办的默认日期
const todayYMD = `${realToday.getFullYear()}-${String(realToday.getMonth() + 1).padStart(2, '0')}-${String(realToday.getDate()).padStart(2, '0')}`
const newTodoDate = ref(todayYMD)
const newTodoText = ref('')

// 提取所有包含待办事项的日期，并按日期正序排列
const sortedDatesWithTodos = computed(() => {
  return Object.keys(store.records)
    .filter(date => store.getRecord(date).todos && store.getRecord(date).todos.length > 0)
    .sort((a, b) => a.localeCompare(b))
})

// 添加全局待办
const handleAddGlobalTodo = () => {
  if (!newTodoDate.value || !newTodoText.value.trim()) return
  store.addTodo(newTodoDate.value, newTodoText.value.trim())
  newTodoText.value = ''
}

// 行内重命名逻辑
const editingTodoId = ref<number | null>(null)
const tempTodoText = ref('')

const startEditTodo = (todo: any) => {
  editingTodoId.value = todo.id
  tempTodoText.value = todo.text
}

const saveTodoText = (date: string, todoId: number) => {
  if (tempTodoText.value.trim()) {
    store.updateTodoText(date, todoId, tempTodoText.value.trim())
  }
  editingTodoId.value = null
}

// 自动对焦指令
const vFocus = {
  mounted: (el: HTMLInputElement) => el.focus()
}

</script>

<template>
<div class="calendar-wrapper">
  
  <div class="calendar-header">
    <div class="header-left">
      <button class="nav-btn icon-btn" @click="prevMonth" title="上个月" v-show="viewMode === 'calendar'">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
    </div>

    <div class="header-center">
      <template v-if="viewMode === 'calendar'">
        <div class="date-display" v-if="!isEditingDate" @click="startEditDate" title="点击修改年月">
          <h2>{{ currentYear }} 年 {{ currentMonth + 1 }} 月</h2>
        </div>
        <input
          v-else
          type="month"
          class="date-input"
          v-model="editDateValue"
          ref="dateInputRef"
          @blur="saveEditDate"
          @keyup.enter="saveEditDate"
        />
      </template>
      <h2 v-else class="list-view-title">全部待办事项</h2>
    </div>

    <div class="header-right">
      <button class="nav-btn icon-btn" @click="prevMonth" title="上个月" v-show="viewMode === 'calendar'">
        <IconChevronLeft style="font-size: 24px;" />
      </button>

      <button class="nav-btn icon-btn" @click="nextMonth" title="下个月" v-show="viewMode === 'calendar'">
        <IconChevronRight style="font-size: 24px;" />
      </button>
    </div>
  </div>

  <div v-if="viewMode === 'calendar'" class="calendar-body">
    <div class="weekdays-row">
      <div v-for="day in weekDays" :key="day" class="weekday-cell">{{ day }}</div>
    </div>
    <div class="days-grid">
      <div v-for="empty in firstDayOffset" :key="`empty-${empty}`" class="day-cell empty-cell"></div>
      <div
        v-for="day in daysInMonth"
        :key="day"
        class="day-cell"
        :class="{ 'has-journal': hasJournal(day) }"
        @click="handleDayClick(day)"
      >
        <span class="day-text" :class="{ 'today-text': isToday(day) }">
          {{ isToday(day) ? 'Today' : day }}
        </span>
        <div class="todo-preview-list" v-if="getTodos(day).length > 0">
          <div
            v-for="todo in getTodos(day)"
            :key="todo.id"
            class="todo-preview-item"
            :class="{ 'done-item': todo.done }"
          >
            {{ todo.text }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="todos-list-view">
    
    <div class="global-add-todo">
      <input type="date" v-model="newTodoDate" class="todo-date-input" max="2100-12-31" />
      <input type="text" v-model="newTodoText" placeholder="输入新待办内容后按回车..." @keyup.enter="handleAddGlobalTodo" class="todo-text-input" />
      <button @click="handleAddGlobalTodo" class="add-btn" title="添加待办">+</button>
    </div>

    <div class="todo-groups">
      <div v-if="sortedDatesWithTodos.length === 0" class="empty-hint">您的日程表目前非常清闲...</div>
      
      <div v-for="date in sortedDatesWithTodos" :key="date" class="todo-date-group">
        <h3 class="group-header">
          <span class="group-date">{{ date }}</span>
          <span class="group-count">{{ store.records[date]!.todos.length }} 项</span>
        </h3>
        <div class="todo-list">
          <div v-for="todo in store.records[date]!.todos" :key="todo.id" class="todo-item">
            
            <div class="todo-content">
              <input 
                v-if="editingTodoId === todo.id" 
                v-model="tempTodoText" 
                @blur="saveTodoText(date, todo.id)" 
                @keyup.enter="saveTodoText(date, todo.id)" 
                class="edit-todo-input" 
                v-focus 
              />
              <label v-else class="todo-label">
                <input type="checkbox" v-model="todo.done" class="todo-checkbox" />
                <span :class="{ 'is-done': todo.done }">{{ todo.text }}</span>
              </label>
            </div>

            <div class="todo-actions" v-if="editingTodoId !== todo.id">
              <button class="icon-btn edit-btn" @click.stop="startEditTodo(todo)" title="重命名">
                <IconEdit style="font-size: 16px;" />
              </button>
              <button class="icon-btn delete-btn" @click.stop="store.deleteTodo(date, todo.id)" title="删除待办">
                <IconDelete style="font-size: 16px;" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; margin-bottom: 12px; margin-left: 100px; margin-right: 100px; height: 48px; }
.header-left, .header-right { display: flex; align-items: center; flex: 1; }
.header-right { justify-content: flex-end; gap: 8px; }
.header-center { display: flex; justify-content: center; flex: 1; }
.list-view-title { margin: 0; color: #1f2937; }

.date-display { cursor: pointer; padding: 4px 16px; border-radius: 6px; transition: background-color 0.2s; }
.date-display:hover { background-color: #f3f4f6; }
.date-input { font-size: 1.5rem; font-weight: bold; padding: 4px 8px; border: 1px solid #3b82f6; border-radius: 6px; outline: none; font-family: inherit; text-align: center; }

.weekdays-row { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-weight: 600; color: #4b5563; margin-bottom: 12px; }
.days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.day-cell { aspect-ratio: 1; display: flex; flex-direction: column; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; cursor: pointer; background-color: #ffffff; transition: all 0.2s ease; overflow: hidden; }
.day-cell.has-journal { background-color: #e0f2fe; }
.day-cell:hover:not(.empty-cell) { border-color: #3b82f6; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.day-cell.has-journal:hover:not(.empty-cell) { background-color: #bae6fd; }
.empty-cell { border: none; background-color: transparent; cursor: default; }

.day-text { font-size: 1.125rem; color: #1f2937; font-weight: 500; }
.today-text { color: #3b82f6; font-weight: 800; font-size: 1rem; }

.todo-preview-list { margin-top: 6px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; flex: 1; }
.todo-preview-list::-webkit-scrollbar { display: none; }
.todo-preview-item { font-size: 0.75rem; color: #374151; background-color: rgba(255, 255, 255, 0.5); padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.todo-preview-item.done-item { text-decoration: line-through; color: #9ca3af; }

.global-add-todo { display: flex; gap: 12px; margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; }
.todo-date-input { padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-family: inherit; color: #374151; }
.todo-text-input { flex: 1; padding: 8px 12px; font-size: 1rem; }
.add-btn { padding: 0 16px; font-size: 1.5rem; line-height: 1; }

.todo-date-group { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.group-header { display: flex; justify-content: space-between; align-items: center; margin: 0 0 12px 0; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6; }
.group-date { font-size: 1.1rem; color: #111827; font-weight: 600; }
.group-count { font-size: 0.8rem; background: #e5e7eb; color: #4b5563; padding: 2px 8px; border-radius: 12px; }

.todo-list { display: flex; flex-direction: column; gap: 8px; }
.todo-item { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-radius: 6px; transition: background 0.2s; }
.todo-item:hover { background: #f9fafb; }
.todo-content { display: flex; align-items: center; flex: 1; min-width: 0; }
.todo-label { display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer; color: #374151; margin: 0; }
.todo-checkbox { width: 18px; height: 18px; cursor: pointer; }
.is-done { text-decoration: line-through; color: #9ca3af; }
.edit-todo-input { flex: 1; padding: 4px 8px; border: 1px solid #3b82f6; border-radius: 4px; outline: none; font-size: 1rem; margin-right: 12px; }

.todo-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; margin-left: 8px; }
.todo-item:hover .todo-actions { opacity: 1; }
.icon-btn.delete-btn { margin-top: 0; }
</style>