import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

interface DayRecord {
  content: string
  todos: { id: number; text: string; done: boolean }[]
}

export const useJournalStore = defineStore('journal', () => {
  const savedData = localStorage.getItem('journalRecords')
  const records = ref<Record<string, DayRecord>>(
    savedData ? JSON.parse(savedData) : {}
  )

  // 首次访问初始化当天示例数据
  if (!savedData) {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const localDateString = `${year}-${month}-${day}`

    records.value[localDateString] = {
      content: '<h2>欢迎记录第一篇日志</h2><p>这是一条示例数据。你可以在左侧区域自由地进行文本排版，记录每日的思考与总结。</p><p>右侧的待办事项支持独立勾选，且任务状态会实时映射到外部的日历网格中进行预览。</p>',
      todos: [
        { id: Date.now(), text: '熟悉文本编辑器的基础功能', done: true },
        { id: Date.now() + 1, text: '尝试在项目版面建立新项目', done: false }
      ]
    }
    localStorage.setItem('journalRecords', JSON.stringify(records.value))
  }

  watch(records, (newVal) => {
    localStorage.setItem('journalRecords', JSON.stringify(newVal))
  }, { deep: true })

  const getRecord = (date: string) => {
    if (!records.value[date]) {
      records.value[date] = { content: '', todos: [] }
    }
    return records.value[date]
  }

  const updateContent = (date: string, content: string) => {
    const record = getRecord(date)
    record.content = content
  }

  const addTodo = (date: string, text: string) => {
    const record = getRecord(date)
    record.todos.push({ id: Date.now(), text, done: false })
  }

  const deleteTodo = (date: string, todoId: number) => {
    const record = getRecord(date)
    record.todos = record.todos.filter(t => t.id !== todoId)
  }

  // 新增：重命名待办事项
  const updateTodoText = (date: string, todoId: number, newText: string) => {
    const record = getRecord(date)
    const todo = record.todos.find(t => t.id === todoId)
    if (todo) {
      todo.text = newText
    }
  }

  return { records, getRecord, updateContent, addTodo, deleteTodo, updateTodoText }
})