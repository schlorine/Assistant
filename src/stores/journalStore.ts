import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// 规范单日数据结构
interface DayRecord {
  content: string
  todos: { id: number; text: string; done: boolean }[]
}

export const useJournalStore = defineStore('journal', () => {
  // 从本地读取历史记录
  const savedData = localStorage.getItem('journalRecords')
  const records = ref<Record<string, DayRecord>>(
    savedData ? JSON.parse(savedData) : {}
  )

  // 深度监听所有日期的变动，实时覆写本地存储
  watch(records, (newVal) => {
    localStorage.setItem('journalRecords', JSON.stringify(newVal))
  }, { deep: true })

  // 获取指定日期的数据，若该日期首次被访问则初始化空结构
  const getRecord = (date: string) => {
    if (!records.value[date]) {
      records.value[date] = { content: '', todos: [] }
    }
    return records.value[date]
  }

  // 更新对应日期的日志文本
  const updateContent = (date: string, content: string) => {
    const record = getRecord(date)
    record.content = content
  }

  // 增加对应日期的待办任务
  const addTodo = (date: string, text: string) => {
    const record = getRecord(date)
    record.todos.push({
      id: Date.now(),
      text,
      done: false
    })
  }

  return { records, getRecord, updateContent, addTodo }
})