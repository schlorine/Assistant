<!-- <script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const route = useRoute()
const router = useRouter()
// 提取路由中携带的日期参数
const currentDate = route.params.date as string

// 编辑器内容绑定
const editorContent = ref('')

// 待办事项逻辑
const todoInput = ref('')
const todoList = ref<{ id: number; text: string; done: boolean }[]>([])

const addTodo = () => {
  if (!todoInput.value.trim()) return
  todoList.value.push({
    id: Date.now(),
    text: todoInput.value,
    done: false
  })
  todoInput.value = ''
}

const goBack = () => {
  router.push('/')
}
</script> -->

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useJournalStore } from '../stores/journalStore'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const route = useRoute()
const router = useRouter()
const store = useJournalStore()

// 获取当前路由中的日期并调取对应记录
const currentDate = route.params.date as string
const currentRecord = store.getRecord(currentDate)

// 初始化编辑器内容
const editorContent = ref(currentRecord.content)

// 监控输入框，数据变化时立即推送到 Store
watch(editorContent, (newVal) => {
  store.updateContent(currentDate, newVal)
})

const todoInput = ref('')

const handleAddTodo = () => {
  if (!todoInput.value.trim()) return
  store.addTodo(currentDate, todoInput.value)
  todoInput.value = ''
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="layout-wrapper">
    <header class="page-header">
      <button class="back-btn" @click="goBack">返回月历</button>
      <h2 class="date-title">{{ currentDate }} 日志与任务</h2>
    </header>

    <div class="content-split">
      <div class="editor-section">
        <QuillEditor 
          theme="snow" 
          v-model:content="editorContent" 
          contentType="html" 
          placeholder="记录今天的思考与见闻..." 
        />
      </div>

      <div class="todo-section">
        <h3 class="todo-title">今日待办</h3>
        <div class="input-group">
          <input 
            v-model="todoInput" 
            @keyup.enter="handleAddTodo" 
            placeholder="输入新任务后按回车" 
            class="todo-input"
          />
          <button @click="handleAddTodo" class="add-btn">添加</button>
        </div>
        
        <div class="todo-list">
          <div v-for="todo in currentRecord.todos" :key="todo.id" class="todo-item">
            <label class="todo-label">
              <input type="checkbox" v-model="todo.done" />
              <span :class="{ 'is-done': todo.done }">{{ todo.text }}</span>
            </label>
            <button class="delete-todo-btn" @click="store.deleteTodo(currentDate, todo.id)" title="删除该任务">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-label { display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer; }
.delete-todo-btn { background: transparent; border: none; color: #9ca3af; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.2s; }
.todo-item:hover .delete-todo-btn { opacity: 1; }
.delete-todo-btn:hover { color: #ef4444; background: #fee2e2; }

.layout-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.back-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.date-title {
  margin: 0;
  color: #1f2937;
}

.content-split {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0; /* 确保内部滚动条生效 */
}

.editor-section {
  flex: 6.5;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 强制编辑器撑满剩余高度 */
:deep(.ql-container) {
  flex: 1;
  font-size: 1rem;
}

.todo-section {
  flex: 3.5;
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow-y: auto;
}

.todo-title {
  margin-top: 0;
  margin-bottom: 16px;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.todo-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.add-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
}

.text-strikethrough {
  text-decoration: line-through;
  color: #9ca3af;
}
</style>