<script setup lang="ts">
import { ref } from 'vue'
import { useWhiteboardStore } from '../stores/whiteboardStore'
import IconDelete from '../components/icons/IconDelete.vue'

const store = useWhiteboardStore()

// 自动对焦指令，确保刚生成的文本框直接可以打字
const vFocus = {
  mounted: (el: HTMLTextAreaElement) => el.focus()
}

// 点击空白处生成新文本框
const handleBoardClick = (e: MouseEvent) => {
  store.addItem(e.offsetX, e.offsetY)
}

// 失去焦点时：如果没打字就删掉，打了字就变成展示状态
const handleBlur = (item: any) => {
  if (!item.text.trim()) {
    store.removeItem(item.id)
  } else {
    item.isEditing = false
  }
}

// 双击已有的文字，重新进入编辑状态
const handleDoubleClick = (item: any) => {
  item.isEditing = true
}

// --- 自由拖拽逻辑 ---
const draggingId = ref<number | null>(null)
let startMouseX = 0
let startMouseY = 0
let startItemX = 0
let startItemY = 0

const startDrag = (e: MouseEvent, item: any) => {
  if (item.isEditing) return // 正在打字时不允许拖拽
  draggingId.value = item.id
  startMouseX = e.clientX
  startMouseY = e.clientY
  startItemX = item.x
  startItemY = item.y
  
  // 绑定在全局 window 上，即使鼠标甩出框外也不会丢失焦点
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (draggingId.value === null) return
  const dx = e.clientX - startMouseX
  const dy = e.clientY - startMouseY
  store.updatePosition(draggingId.value, startItemX + dx, startItemY + dy)
}

const stopDrag = () => {
  draggingId.value = null
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

// 一键清空
const clearBoard = () => {
  if (window.confirm('确定要清空整块白板吗？此操作不可恢复。')) {
    store.clearAll()
  }
}
</script>

<template>
  <div class="layout-wrapper">
    <div class="page-header">
      <h2 style="margin: 0; color: #1f2937;">灵感白板</h2>
      <button class="icon-btn delete-btn" @click="clearBoard" title="清空白板">
        <IconDelete style="font-size: 20px;" />
      </button>
    </div>
    
    <div class="board-area" @click.self="handleBoardClick">
      <div v-if="store.items.length === 0" class="empty-hint" @click.self="handleBoardClick">
        在任意带有网格的空白处点击，即可开始记录...
      </div>

      <div 
        v-for="item in store.items" 
        :key="item.id"
        class="board-item"
        :class="{ 'is-dragging': draggingId === item.id }"
        :style="{ left: item.x + 'px', top: item.y + 'px' }"
        @mousedown="startDrag($event, item)"
        @dblclick="handleDoubleClick(item)"
      >
        <textarea 
          v-if="item.isEditing"
          v-model="item.text"
          class="board-input"
          v-focus
          @blur="handleBlur(item)"
          @mousedown.stop
        ></textarea>
        <div v-else class="board-text">{{ item.text }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 点阵底图设计 */
.board-area {
  flex: 1;
  width: 100%;
  min-height: 500px; /* 给一个最小高度兜底 */
  background-image: radial-gradient(#d1d5db 1px, transparent 1px);
  background-size: 24px 24px;
  background-color: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;
  cursor: crosshair;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.empty-hint {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  color: #9ca3af; pointer-events: none; user-select: none; font-size: 1.1rem;
}

.board-item {
  position: absolute; cursor: grab; user-select: none;
  transform: translate(-10px, -10px); 
}
.board-item.is-dragging { cursor: grabbing; opacity: 0.8; z-index: 100; }

.board-text {
  padding: 8px 12px; background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px); border: 1px solid transparent; border-radius: 8px;
  color: #1f2937; font-size: 1rem; white-space: pre-wrap; word-break: break-all;
  max-width: 300px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  transition: border-color 0.2s; cursor: pointer; line-height: 1.5;
}
.board-item:hover .board-text { border-color: #93c5fd; }

.board-input {
  padding: 8px 12px; font-size: 1rem; color: #1f2937; line-height: 1.5;
  background: #ffffff; border: 2px dashed #3b82f6; border-radius: 8px;
  outline: none; resize: both; min-width: 150px; min-height: 50px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); font-family: inherit;
}
</style>