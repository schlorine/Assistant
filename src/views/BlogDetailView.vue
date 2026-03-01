<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '../stores/blogStore'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const route = useRoute()
const router = useRouter()
const store = useBlogStore()

const blogId = Number(route.params.id)
const blog = store.blogs.find(b => b.id === blogId)

const editorContent = ref(blog?.content || '')
const blogTitle = ref(blog?.title || '')

// 内容与标题的实时保存链路
watch([blogTitle, editorContent], ([newTitle, newContent]) => {
  store.updateBlog(blogId, newTitle, newContent)
})

const goBack = () => {
  router.push('/blog')
}
</script>

<template>
  <div class="layout-wrapper" v-if="blog">
    <header class="page-header">
      <button class="back-btn" @click="goBack" title="返回列表">&lt;</button>
      <span class="date-display">编辑于 {{ blog.date }}</span>
    </header>

    <div class="editor-container">
      <input 
        v-model="blogTitle" 
        class="title-input" 
        placeholder="输入文章标题..."
      />
      <div class="quill-wrapper">
        <QuillEditor 
          theme="snow" 
          v-model:content="editorContent" 
          contentType="html" 
          placeholder="开始撰写..." 
        />
      </div>
    </div>
  </div>
  <div v-else class="not-found">文章不存在或已被删除</div>
</template>

<style scoped>
.date-display { color: #9ca3af; font-size: 0.9rem; }

.editor-container { flex: 1; display: flex; flex-direction: column; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e5e7eb; }
.title-input { font-size: 2rem; font-weight: bold; border: none; border-bottom: 1px solid #e5e7eb; padding: 24px 32px; outline: none; color: #111827; }
.title-input::placeholder { color: #d1d5db; }

.quill-wrapper { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.not-found { text-align: center; margin-top: 100px; color: #6b7280; font-size: 1.2rem; }
</style>