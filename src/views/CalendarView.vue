<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useJournalStore } from '../stores/journalStore'
import IconChevronLeft from '../components/icons/IconChevronLeft.vue'
import IconChevronRight from '../components/icons/IconChevronRight.vue'
import IconEdit from '../components/icons/IconEdit.vue'
import IconDelete from '../components/icons/IconDelete.vue'

const router = useRouter()
const store = useJournalStore()

// === 移动端环境侦测 ===
const isMobile = ref(false)
const checkMobile = () => { isMobile.value = window.innerWidth <= 768 }

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  // 渲染完毕后，手机端自动向下滚动至“当前月”
  setTimeout(scrollToCurrentMonth, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// ================= 月历核心逻辑 =================
const currentDate = ref(new Date())
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const firstDayOffset = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay())
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const prevMonth = () => { currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1) }
const nextMonth = () => { currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1) }

// 动态参数化处理日期（为了兼容手机端同时渲染多月）
const getFullDateString = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const handleDayClick = (year: number, month: number, day: number) => {
  router.push({ name: 'dayDetail', params: { date: getFullDateString(year, month, day) } })
}

const hasJournal = (year: number, month: number, day: number) => {
  const record = store.records[getFullDateString(year, month, day)]
  if (!record || !record.content) return false
  const plainText = record.content.replace(/<[^>]+>/g, '').trim()
  return plainText.length > 0 || record.content.includes('<img')
}

const getTodos = (year: number, month: number, day: number) =>
  store.records[getFullDateString(year, month, day)]?.todos || []

const realToday = new Date()
const isToday = (year: number, month: number, day: number) => {
  return year === realToday.getFullYear() && month === realToday.getMonth() && day === realToday.getDate()
}

// ================= 头部日期编辑逻辑 =================
const isEditingDate = ref(false)
const editDateValue = ref('')
const dateInputRef = ref<HTMLInputElement | null>(null)

const startEditDate = async () => {
  // 手机端基于滑动到的表头进行编辑，电脑端基于当前月
  const y = isMobile.value ? headerDisplayYear.value : currentYear.value
  const m = isMobile.value ? headerDisplayMonth.value : currentMonth.value
  editDateValue.value = `${y}-${String(m + 1).padStart(2, '0')}`
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

// ================= 移动端连续无缝滚动逻辑 =================
const headerDisplayYear = ref(currentYear.value)
const headerDisplayMonth = ref(currentMonth.value)
const currentMonthBlockRef = ref<HTMLElement | null>(null)

let scrollBehavior: ScrollBehavior = 'auto'

// 新增核心控制函数：只允许内部容器滚动，绝不干涉外部
const scrollToCurrentMonth = () => {
   if (isMobile.value) {
      nextTick(() => {
         const container = document.querySelector('.mobile-scroll-body') as HTMLElement
         const target = currentMonthBlockRef.value
         if (container && target) {
            // 使用 target.offsetTop 获取相对容器顶部的距离，精准设置 scrollTop
            container.scrollTo({ top: target.offsetTop, behavior: scrollBehavior })
         }
         scrollBehavior = 'auto' // 执行完毕后重置为默认值
      })
   }
}

const goToToday = async () => {
  const now = new Date()
  const newCurrent = new Date(now.getFullYear(), now.getMonth(), 1)
  
  if (currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth()) {
    scrollBehavior = 'smooth'
    scrollToCurrentMonth()
  } else {
    scrollBehavior = isMobile.value ? 'smooth' : 'auto'
    currentDate.value = newCurrent
  }
}

watch(currentDate, (newVal) => {
   headerDisplayYear.value = newVal.getFullYear()
   headerDisplayMonth.value = newVal.getMonth()
   scrollToCurrentMonth()
})

// 修复初次加载时的定位
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  setTimeout(() => scrollToCurrentMonth(), 150)
})

// 构建一个滑动窗口：前后各 12 个月
const mobileMonths = computed(() => {
  const list = []
  const base = new Date(currentDate.value)
  for(let i = -12; i <= 12; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1)
    list.push({
       year: d.getFullYear(),
       month: d.getMonth(),
       id: `${d.getFullYear()}-${d.getMonth()}`,
       firstDayOffset: d.getDay(),
       daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    })
  }
  return list
})


// 滚动侦测：计算当前划到了哪个月，并动态更新头部的标题
let scrollTimeout: any = null
const handleMobileScroll = (e: Event) => {
   if (!isMobile.value) return
   if (scrollTimeout) return
   scrollTimeout = setTimeout(() => {
       const container = e.target as HTMLElement
       const blocks = container.querySelectorAll('.mobile-month-block')
       let topBlock: Element | null = null
       const containerTop = container.getBoundingClientRect().top

       // 判定哪个月份块位于容器视图的正上方
       blocks.forEach(block => {
          const rect = block.getBoundingClientRect()
          if (rect.top <= containerTop + 100 && rect.bottom >= containerTop + 100) {
              topBlock = block
          }
       })

       if (topBlock) {
          headerDisplayYear.value = parseInt((topBlock as HTMLElement).dataset.year || '0')
          headerDisplayMonth.value = parseInt((topBlock as HTMLElement).dataset.month || '0')
       }
       scrollTimeout = null
   }, 50)
}

// ================= 全局待办视图逻辑 =================
const viewMode = ref<'calendar' | 'todos'>('calendar')
const todayYMD = `${realToday.getFullYear()}-${String(realToday.getMonth() + 1).padStart(2, '0')}-${String(realToday.getDate()).padStart(2, '0')}`
const newTodoDate = ref(todayYMD)
const newTodoText = ref('')

const sortedDatesWithTodos = computed(() => {
  return Object.keys(store.records)
    .filter(date => store.records[date]!.todos && store.records[date]!.todos.length > 0)
    .sort((a, b) => a.localeCompare(b))
})

const handleAddGlobalTodo = () => {
  if (!newTodoDate.value || !newTodoText.value.trim()) return
  store.addTodo(newTodoDate.value, newTodoText.value.trim())
  newTodoText.value = ''
}

const editingTodoId = ref<number | null>(null)
const tempTodoText = ref('')

const startEditTodo = (todo: any) => {
  editingTodoId.value = todo.id
  tempTodoText.value = todo.text
}

const saveTodoText = (date: string, todoId: number) => {
  if (tempTodoText.value.trim()) {
    const record = store.getRecord(date)
    const t = record.todos.find(item => item.id === todoId)
    if (t) t.text = tempTodoText.value.trim()
  }
  editingTodoId.value = null
}

const vFocus = { mounted: (el: HTMLInputElement) => el.focus() }
</script>

<template>
  <div class="calendar-wrapper">
    <div class="calendar-header">
      <div class="header-left">
        <button class="icon-btn mobile-hide" @click="prevMonth" title="上个月" v-show="viewMode === 'calendar'">
          <IconChevronLeft style="font-size: 24px;" />
        </button>
      </div>

      <div class="header-center">
        <template v-if="viewMode === 'calendar'">
          <div class="date-display" v-if="!isEditingDate" @click="startEditDate" title="点击修改年月">
            <h2 v-if="!isMobile">{{ currentYear }} 年 {{ currentMonth + 1 }} 月</h2>
            <h2 v-else>{{ headerDisplayYear }} 年 {{ headerDisplayMonth + 1 }} 月</h2>
          </div>
          <input v-else type="month" class="date-input" v-model="editDateValue" ref="dateInputRef" @blur="saveEditDate" @keyup.enter="saveEditDate" />
        </template>
        <h2 v-else class="list-view-title">全部待办事项</h2>
      </div>

      <div class="header-right">
        <button class="icon-btn" @click="goToToday" title="定位到今天" v-show="viewMode === 'calendar'">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>

        <button class="icon-btn mobile-hide" @click="nextMonth" title="下个月" v-show="viewMode === 'calendar'">
          <IconChevronRight style="font-size: 24px;" />
        </button>
        
        <button class="icon-btn" @click="viewMode = viewMode === 'calendar' ? 'todos' : 'calendar'" :title="viewMode === 'calendar' ? '查看全部待办' : '返回月历'">
          <svg v-if="viewMode === 'calendar'" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          <svg v-else viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </button>
      </div>
    </div>

    <div v-if="viewMode === 'calendar' && !isMobile" class="calendar-body desktop-calendar">
      <div class="weekdays-row">
        <div v-for="day in weekDays" :key="day" class="weekday-cell">{{ day }}</div>
      </div>
      <div class="days-grid">
        <div v-for="empty in firstDayOffset" :key="`empty-${empty}`" class="day-cell empty-cell"></div>
        <div v-for="day in daysInMonth" :key="day" class="day-cell" :class="{ 'has-journal': hasJournal(currentYear, currentMonth, day) }" @click="handleDayClick(currentYear, currentMonth, day)">
          <span class="day-text" :class="{ 'today-text': isToday(currentYear, currentMonth, day) }">{{ day }}</span>
          <div class="todo-preview-list" v-if="getTodos(currentYear, currentMonth, day).length > 0">
            <div v-for="todo in getTodos(currentYear, currentMonth, day)" :key="todo.id" class="todo-preview-item" :class="{ 'done-item': todo.done }">{{ todo.text }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="viewMode === 'calendar' && isMobile" class="calendar-body mobile-scroll-body" @scroll="handleMobileScroll" ref="mobileScrollContainer">
      <div class="weekdays-row sticky-weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday-cell">{{ day }}</div>
      </div>

      <div class="mobile-months-wrapper">
        <div
          v-for="m in mobileMonths"
          :key="m.id"
          class="mobile-month-block"
          :data-year="m.year"
          :data-month="m.month"
          :ref="el => { if (el && m.year === currentYear && m.month === currentMonth) currentMonthBlockRef = el as HTMLElement }"
        >
          <div class="mobile-month-separator">
             {{ m.month === 0 ? m.year + '年 1月' : (m.month + 1) + '月' }}
          </div>

          <div class="days-grid">
            <div v-for="empty in m.firstDayOffset" :key="`empty-${empty}`" class="day-cell empty-cell"></div>
            <div v-for="day in m.daysInMonth" :key="day" class="day-cell" :class="{ 'has-journal': hasJournal(m.year, m.month, day) }" @click="handleDayClick(m.year, m.month, day)">
              <span class="day-text" :class="{ 'today-text': isToday(m.year, m.month, day) }">{{ day }}</span>
              <div class="todo-preview-list" v-if="getTodos(m.year, m.month, day).length > 0">
                <div v-for="todo in getTodos(m.year, m.month, day)" :key="todo.id" class="todo-preview-item" :class="{ 'done-item': todo.done }">{{ todo.text }}</div>
              </div>
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
                <input v-if="editingTodoId === todo.id" v-model="tempTodoText" @blur="saveTodoText(date, todo.id)" @keyup.enter="saveTodoText(date, todo.id)" class="edit-todo-input" v-focus />
                <label v-else class="todo-label">
                  <input type="checkbox" v-model="todo.done" class="todo-checkbox" />
                  <span :class="{ 'is-done': todo.done }">{{ todo.text }}</span>
                </label>
              </div>
              <div class="todo-actions" v-if="editingTodoId !== todo.id">
                <button class="icon-btn edit-btn" @click.stop="startEditTodo(todo)" title="重命名"><IconEdit style="font-size: 16px;" /></button>
                <button class="icon-btn delete-btn" @click.stop="store.deleteTodo(date, todo.id)" title="删除待办"><IconDelete style="font-size: 16px;" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ================= 基础桌面端样式 ================= */
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; height: 48px; }
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
/* 将日期文字统一做成正圆形容器，方便高亮 */
.day-text { 
  display: inline-flex; 
  align-items: center; 
  justify-content: center;
  width: 28px; 
  height: 28px; 
  font-size: 1.125rem; 
  color: #1f2937; 
  font-weight: 500; 
  border-radius: 50%;
}

/* 当天高亮：统一为纯粹的科技蓝实心圆 */
.today-text { 
  background-color: #3b82f6; 
  color: #ffffff; 
  font-weight: bold; 
}

.todo-preview-list { margin-top: 6px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; flex: 1; }
.todo-preview-list::-webkit-scrollbar { display: none; }
.todo-preview-item { font-size: 0.75rem; color: #374151; background-color: rgba(255, 255, 255, 0.5); padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.todo-preview-item.done-item { text-decoration: line-through; color: #9ca3af; }

.global-add-todo { display: flex; gap: 12px; margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db; }
.todo-date-input { padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-family: inherit; color: #374151; }
.todo-text-input { flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 1rem; }
.add-btn { background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; padding: 0 16px; font-size: 1.5rem; line-height: 1; transition: background 0.2s; }

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
.empty-hint { text-align: center; color: #9ca3af; padding: 40px; font-size: 1.1rem; }

/* ================= 移动端原生级瀑布流适配 ================= */
@media (max-width: 768px) {
  /* 让日历外层 100% 贴合 App.vue 的容器，不产生任何溢出 */
  .calendar-wrapper {
    height: 100%;
    box-sizing: border-box; /* 保证这 12px 的 padding 也向内挤压 */
    padding: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden !important; /* 死死锁住月历外层，绝不滚动 */
  }

  /* 2. 内层瀑布流：加上 relative 确保 offsetTop 计算精准 */
  .mobile-scroll-body {
    position: relative; 
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: auto;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    /* 取消之前所有强制 height 控制，完全交给 Flexbox 分配 */
  }

  /* 3. 为全局待办列表也开启内部滚动（防止固定高度后待办列表无法滚动） */
  .todos-list-view {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 20px;
  }
  

  /* 2. 修复头部拥挤换行：彻底隐藏左侧空白，让年月标题靠左舒展 */
  .mobile-hide, .header-left { display: none !important; }
  .calendar-header { height: auto; margin-bottom: 8px; }
  .header-center { flex: 1; justify-content: flex-start; text-align: left; }
  .header-right { flex: 0; min-width: 40px; }
  .date-display { padding: 4px 0; }
  .date-display h2 { font-size: 1.5rem; white-space: nowrap; margin: 0; }


  /* 星期表头巧妙吸顶 */
  .sticky-weekdays {
    position: sticky;
    top: 0;
    z-index: 10;
    margin-bottom: 0;
    padding: 10px 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid #e5e7eb;
  }
  .weekday-cell { font-size: 0.8rem; color: #9ca3af; }

  /* 无缝网格，取消内边框与间距 */
  .days-grid { gap: 0; background: transparent; border: none; border-radius: 0; }
  .day-cell {
    border: none; border-radius: 0; border-bottom: 1px solid #f9fafb;
    padding: 4px 2px; aspect-ratio: auto; min-height: 70px;
  }
  .day-cell:hover:not(.empty-cell) { box-shadow: none; border-color: transparent; }

  /* 内联的优雅月份分割栏 */
  .mobile-month-separator {
    padding: 16px 16px 4px; font-size: 1.1rem; font-weight: bold; color: #1f2937; background: #ffffff;
  }

  /* 适配手机端的圆圈大小 */
  .day-text {
    width: 24px; height: 24px; font-size: 0.95rem; margin: 0 auto 4px auto; align-self: center;
  }

  /* 待办预览条平铺拉宽 */
  .todo-preview-item {
    border-radius: 2px; padding: 2px 4px; font-size: 0.65rem; margin-bottom: 2px;
    text-align: center; width: 100%; box-sizing: border-box; background-color: #f3f4f6; color: #4b5563;
  }
  
  .day-cell.has-journal { background-color: transparent; }
}
</style>