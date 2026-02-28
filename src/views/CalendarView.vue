<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useJournalStore } from '../stores/journalStore'

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

// 统一提取日期字符串
const getFullDateString = (day: number) => {
  return `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const handleDayClick = (day: number) => {
  router.push({
    name: 'dayDetail',
    params: { date: getFullDateString(day) }
  })
}

// 判定当天是否包含实质性的日志内容
const hasJournal = (day: number) => {
  const record = store.records[getFullDateString(day)]
  if (!record || !record.content) return false
  
  // 剥离 HTML 标签，排除纯空行或换行符
  const plainText = record.content.replace(/<[^>]+>/g, '').trim()
  return plainText.length > 0 || record.content.includes('<img')
}

// 提取当天待办数据
const getTodos = (day: number) => {
  return store.records[getFullDateString(day)]?.todos || []
}

// 年月修改交互状态
const isEditingDate = ref(false)
const editDateValue = ref('')
const dateInputRef = ref<HTMLInputElement | null>(null)

// 触发编辑状态并自动聚焦输入框
const startEditDate = async () => {
  editDateValue.value = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}`
  isEditingDate.value = true
  await nextTick()
  dateInputRef.value?.focus()
}

// 校验并应用新日期
const saveEditDate = () => {
  if (!isEditingDate.value) return
  isEditingDate.value = false
  if (editDateValue.value) {
    const [year, month] = editDateValue.value.split('-')
    currentDate.value = new Date(Number(year), Number(month) - 1, 1)
  }
}
</script>

<template>
  <div class="calendar-wrapper">
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">&lt; 上个月</button>

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

      <button class="nav-btn" @click="nextMonth">下个月 &gt;</button>
    </div>

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
        <span class="day-text">{{ day }}</span>
        
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
</template>

<style scoped>
.calendar-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  height: 48px;
}

.nav-btn {
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
}

.nav-btn:hover { background-color: #e5e7eb; }

.date-display {
  cursor: pointer;
  padding: 4px 16px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.date-display:hover { background-color: #f3f4f6; }
.date-display h2 { margin: 0; color: #1f2937; }

.date-input {
  font-size: 1.5rem;
  font-weight: bold;
  padding: 4px 8px;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  outline: none;
  font-family: inherit;
  text-align: center;
}

.weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 12px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px; 
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  background-color: #ffffff;
  transition: all 0.2s ease;
  overflow: hidden; /* 配合待办文字截断使用 */
}

/* 具有日志内容的格子高亮 */
.day-cell.has-journal {
  background-color: #e0f2fe;
}

.day-cell:hover:not(.empty-cell) {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.day-cell.has-journal:hover:not(.empty-cell) {
  background-color: #bae6fd;
}

.empty-cell {
  border: none;
  background-color: transparent;
  cursor: default;
}

.day-text {
  font-size: 1.125rem;
  color: #1f2937;
  font-weight: 500;
}

.todo-preview-list {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
}

/* 隐藏内部滚动条使视觉保持清爽 */
.todo-preview-list::-webkit-scrollbar { display: none; }

.todo-preview-item {
  font-size: 0.75rem;
  color: #374151;
  background-color: rgba(255, 255, 255, 0.5);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 文字溢出处理 */
}

.todo-preview-item.done-item {
  text-decoration: line-through;
  color: #9ca3af;
}
</style>