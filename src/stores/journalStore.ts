import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { supabase } from '../utils/supabase'
import { useUserStore } from './userStore'

export interface Todo { id: number; text: string; done: boolean }
export interface DayRecord { content: string; todos: Todo[] }

export const useJournalStore = defineStore('journal', () => {
  const records = ref<Record<string, DayRecord>>({})
  const journalIds = ref<Record<string, number>>({}) 
  const userStore = useUserStore()

  const fetchJournals = async () => {
    if (!userStore.currentUser) return
    
    const [jRes, tRes] = await Promise.all([
      supabase.from('journals').select('*').eq('user_id', userStore.currentUser.id),
      supabase.from('todos').select('*').eq('user_id', userStore.currentUser.id)
    ])

    if (jRes.error) console.error('拉取日志失败:', jRes.error.message)
    if (tRes.error) console.error('拉取待办失败:', tRes.error.message)

    const tempRecords: Record<string, DayRecord> = {}
    const tempIds: Record<string, number> = {}

    if (jRes.data) {
      jRes.data.forEach((j: any) => {
        tempRecords[j.record_date] = { content: j.content || '', todos: [] }
        tempIds[j.record_date] = j.id
      })
    }

    if (tRes.data) {
      tRes.data.forEach((t: any) => {
        const j = jRes.data?.find((j: any) => j.id === t.journal_id)
        if (j) {
          tempRecords[j.record_date]!.todos.push({ id: t.id, text: t.text, done: t.done })
        }
      })
    }
    records.value = tempRecords
    journalIds.value = tempIds
  }

  watch(() => userStore.currentUser, (user) => {
    if (user) fetchJournals()
    else { records.value = {}; journalIds.value = {} }
  }, { immediate: true })

  const getRecord = (date: string) => {
    if (!records.value[date]) {
      records.value[date] = { content: '', todos: [] }
    }
    return records.value[date]
  }

  // 【核心修复 1】：终极原子化操作。
  // 直接使用 upsert，并携带内存中的最新 content，一次性解决主键获取与数据覆盖问题。
  const syncJournalRow = async (date: string) => {
    if (!userStore.currentUser) return null
    const record = getRecord(date)

    const { data, error } = await supabase.from('journals')
      .upsert({ 
        user_id: userStore.currentUser.id, 
        record_date: date, 
        content: record.content // 直接使用内存中的最新内容防覆盖
      }, { onConflict: 'user_id,record_date' })
      .select().single()
    
    if (data) {
      journalIds.value[date] = data.id
      return data.id
    }
    if (error) console.error('云端同步日志失败:', error.message)
    return null
  }

  let debounceTimer: any = null
  const updateContent = (date: string, content: string) => {
    const record = getRecord(date)
    record.content = content 
    
    if (!userStore.currentUser) return
    
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      syncJournalRow(date) // 只需要调用这一个原子方法
    }, 500)
  }

  const addTodo = async (date: string, text: string) => {
    if (!userStore.currentUser) return
    const record = getRecord(date)
    const newId = Date.now()
    record.todos.push({ id: newId, text, done: false })

    const jId = await syncJournalRow(date)
    if (jId) {
      supabase.from('todos').insert([{ id: newId, journal_id: jId, user_id: userStore.currentUser.id, text, done: false }])
        .then(({ error }) => { if (error) console.error('云端新建待办失败:', error.message) })
    }
  }

  const deleteTodo = (date: string, todoId: number) => {
    const record = getRecord(date)
    record.todos = record.todos.filter(t => t.id !== todoId)
    if (userStore.currentUser) {
      supabase.from('todos').delete().eq('id', todoId)
        .then(({ error }) => { if (error) console.error('云端删除待办失败:', error.message) })
    }
  }

  const updateTodoText = (date: string, todoId: number, newText: string) => {
    const record = getRecord(date)
    const todo = record.todos.find(t => t.id === todoId)
    if (todo) {
      todo.text = newText
      if (userStore.currentUser) {
        supabase.from('todos').update({ text: newText }).eq('id', todoId)
          .then(({ error }) => { if (error) console.error('更新待办名称失败:', error.message) })
      }
    }
  }

  const updateTodoStatus = (todoId: number, done: boolean) => {
    if (userStore.currentUser) {
      supabase.from('todos').update({ done }).eq('id', todoId)
        .then(({ error }) => { if (error) console.error('更新待办状态失败:', error.message) })
    }
  }

  return { records, fetchJournals, getRecord, updateContent, addTodo, deleteTodo, updateTodoText, updateTodoStatus }
})