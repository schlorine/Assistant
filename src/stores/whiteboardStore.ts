import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { supabase } from '../utils/supabase'
import { useUserStore } from './userStore'

export interface WhiteboardItem {
  id: number
  text: string
  x: number
  y: number
  isEditing: boolean
}

export const useWhiteboardStore = defineStore('whiteboard', () => {
  const items = ref<WhiteboardItem[]>([])
  const userStore = useUserStore()

  // 1. 从云端拉取白板数据
  const fetchItems = async () => {
    if (!userStore.currentUser) return
    const { data, error } = await supabase
      .from('whiteboard_items')
      .select('*')
      .eq('user_id', userStore.currentUser.id)
    
    if (error) {
      console.error('拉取白板数据失败:', error.message)
    } else if (data) {
      // 抹平云端字段名 (pos_x) 与前端变量名 (x) 的差异
      items.value = data.map((item: any) => ({
        id: item.id,
        text: item.text || '',
        x: item.pos_x,
        y: item.pos_y,
        isEditing: false
      }))
    }
  }

  watch(() => userStore.currentUser, (user) => {
    if (user) fetchItems()
    else items.value = []
  }, { immediate: true })

  // 2. 新增文本块 (初始为空)
  const addItem = (x: number, y: number) => {
    if (!userStore.currentUser) return
    items.value.forEach(item => item.isEditing = false)
    
    const newItem: WhiteboardItem = { id: Date.now(), text: '', x, y, isEditing: true }
    items.value.push(newItem) // 乐观更新

    supabase.from('whiteboard_items').insert([{
      id: newItem.id,
      user_id: userStore.currentUser.id,
      text: newItem.text,
      pos_x: x,
      pos_y: y
    }]).then(({ error }) => {
      if (error) console.error('云端新建便签失败:', error.message)
    })
  }

  // 3. 更新坐标 (引入 300ms 防抖，防止拖拽时轰炸云端)
  let dragTimeout: any = null
  const updatePosition = (id: number, x: number, y: number) => {
    const item = items.value.find(i => i.id === id)
    if (item) {
      item.x = x
      item.y = y // 前端界面实时顺滑拖动
      
      if (userStore.currentUser) {
        if (dragTimeout) clearTimeout(dragTimeout)
        dragTimeout = setTimeout(() => {
          supabase.from('whiteboard_items').update({
            pos_x: x, pos_y: y
          }).eq('id', id).then(({ error }) => {
            if (error) console.error('云端更新坐标失败:', error.message)
          })
        }, 300)
      }
    }
  }

  // 4. 更新文本内容 (专门为失焦保存准备)
  const updateText = (id: number, text: string) => {
    const item = items.value.find(i => i.id === id)
    if (item && userStore.currentUser) {
      item.text = text
      supabase.from('whiteboard_items').update({ text }).eq('id', id)
        .then(({ error }) => { if (error) console.error('云端保存文本失败:', error.message) })
    }
  }

  // 5. 删除文本块
  const removeItem = (id: number) => {
    items.value = items.value.filter(i => i.id !== id)
    if (userStore.currentUser) {
      supabase.from('whiteboard_items').delete().eq('id', id).then()
    }
  }

  // 6. 一键清空
  const clearAll = () => {
    items.value = []
    if (userStore.currentUser) {
      supabase.from('whiteboard_items').delete().eq('user_id', userStore.currentUser.id).then()
    }
  }

  return { items, fetchItems, addItem, updatePosition, updateText, removeItem, clearAll }
})