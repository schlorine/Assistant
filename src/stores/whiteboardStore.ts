import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { usePersistedRef } from '../utils/storage'

export interface WhiteboardItem {
  id: number
  text: string
  x: number
  y: number
  isEditing: boolean
}

export const useWhiteboardStore = defineStore('whiteboard', () => {
  const items = usePersistedRef<WhiteboardItem[]>('whiteboardItems', [])
  
  // 在指定坐标添加新文本块
  const addItem = (x: number, y: number) => {
    // 将现有的编辑状态全部关闭
    items.value.forEach(item => item.isEditing = false)
    const newItem: WhiteboardItem = { id: Date.now(), text: '', x, y, isEditing: true }
    items.value.push(newItem)
  }

  // 更新坐标（拖拽用）
  const updatePosition = (id: number, x: number, y: number) => {
    const item = items.value.find(i => i.id === id)
    if (item) {
      item.x = x
      item.y = y
    }
  }

  // 删除指定的文本块
  const removeItem = (id: number) => {
    items.value = items.value.filter(i => i.id !== id)
  }

  // 一键清空白板
  const clearAll = () => {
    items.value = []
  }

  return { items, addItem, updatePosition, removeItem, clearAll }
})