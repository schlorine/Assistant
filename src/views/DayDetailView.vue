<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useJournalStore } from '../stores/journalStore'
import { QuillEditor } from '@vueup/vue-quill'
import IconDelete from '../components/icons/IconDelete.vue'
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
      <button class="back-btn" @click="goBack" title="返回月历">&lt;</button>
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
          <button @click="handleAddTodo" class="add-btn" title="添加任务">+</button>
        </div>
        
        <div class="todo-list">
          <div v-for="todo in currentRecord.todos" :key="todo.id" class="todo-item">
            <label class="todo-label">
              <input type="checkbox" v-model="todo.done" />
              <span :class="{ 'is-done': todo.done }">{{ todo.text }}</span>
            </label>
            <button class="icon-btn delete-btn" @click="store.deleteTodo(currentDate, todo.id)" title="删除该任务">
              <IconDelete style="font-size: 16px;" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header { justify-content: flex-start; gap: 20px; }
.date-title { margin: 0; color: #1f2937; }

.content-split { display: flex; gap: 24px; flex: 1; min-height: 0; }
.editor-section { flex: 6.5; display: flex; flex-direction: column; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
:deep(.ql-container) { flex: 1; font-size: 1rem; }

.todo-section { flex: 3.5; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; overflow-y: auto; }
.todo-title { margin-top: 0; margin-bottom: 16px; color: #1f2937; }

.input-group { display: flex; gap: 8px; margin-bottom: 20px; }
.todo-input { flex: 1; padding: 8px 12px; }
.add-btn { padding: 0 16px; font-size: 1.5rem; line-height: 1; }

.todo-list { list-style: none; padding: 0; margin: 0; }
.todo-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }

.todo-label { display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer; color: #374151; margin: 0; }
.todo-checkbox { width: 18px; height: 18px; cursor: pointer; }
.is-done { text-decoration: line-through; color: #9ca3af; }

.todo-item:hover .icon-btn.delete-btn { opacity: 1; }
.icon-btn.delete-btn { opacity: 0; padding: 4px; }
</style>