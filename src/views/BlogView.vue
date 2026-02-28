<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '../stores/blogStore'

const router = useRouter()
const store = useBlogStore()

// 绑定搜索输入框的响应式变量
const searchQuery = ref('')

// 计算属性：根据搜索词动态过滤博客列表
const filteredBlogs = computed(() => {
  if (!searchQuery.value.trim()) {
    return store.blogs
  }
  const query = searchQuery.value.toLowerCase()
  return store.blogs.filter(blog => blog.title.toLowerCase().includes(query))
})

const handleCreate = () => {
  const newId = store.addBlog()
  router.push({ name: 'blogDetail', params: { id: newId } })
}

const openBlog = (id: number) => {
  router.push({ name: 'blogDetail', params: { id } })
}

const handleDelete = (id: number) => {
  if (window.confirm('确定要删除这篇博客吗？该操作不可恢复。')) {
    store.deleteBlog(id)
  }
}
</script>

<template>
  <div class="blog-container">
    <div class="header-section">
      <h2>我的博客</h2>
      <div class="action-group">
        <input 
          v-model="searchQuery" 
          class="search-input" 
          placeholder="搜索博客标题..." 
        />
        <button class="create-btn" @click="handleCreate">开始写作</button>
      </div>
    </div>

    <div class="blog-list">
      <div v-if="filteredBlogs.length === 0" class="empty-state">
        没有找到与搜索词匹配的文章...
      </div>
      
      <div v-for="blog in filteredBlogs" :key="blog.id" class="blog-card" @click="openBlog(blog.id)">
        <div class="card-main">
          <h3 class="blog-title">{{ blog.title }}</h3>
          <p class="blog-summary">{{ blog.summary || '这里空空如也，还没有摘要...' }}</p>
          <span class="blog-date">{{ blog.date }}</span>
        </div>
        
        <button class="icon-btn delete-btn" @click.stop="handleDelete(blog.id)" title="删除文章">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-container { max-width: 800px; margin: 0 auto; padding: 20px 40px; font-family: system-ui, -apple-system, sans-serif; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #f3f4f6; }
.header-section h2 { margin: 0; color: #1f2937; font-size: 1.8rem; }

/* 搜索框相关的布局与样式 */
.action-group { display: flex; gap: 12px; align-items: center; }
.search-input { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 6px; outline: none; font-size: 0.95rem; width: 220px; transition: border-color 0.2s, box-shadow 0.2s; }
.search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

.create-btn { padding: 10px 24px; background-color: #10b981; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
.create-btn:hover { background-color: #059669; }

.blog-list { display: flex; flex-direction: column; gap: 16px; }
.blog-card { display: flex; justify-content: space-between; align-items: flex-start; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.blog-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border-color: #d1d5db; }
.card-main { flex: 1; min-width: 0; padding-right: 20px; }

.blog-title { margin: 0 0 12px 0; font-size: 1.4rem; color: #111827; }
.blog-summary { margin: 0 0 16px 0; color: #4b5563; font-size: 1rem; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.blog-date { font-size: 0.875rem; color: #9ca3af; }

.icon-btn.delete-btn { background: transparent; color: #9ca3af; border: none; padding: 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; margin-top: -4px; opacity: 0; }
.blog-card:hover .delete-btn { opacity: 1; }
.icon-btn.delete-btn:hover { background: #fee2e2; color: #ef4444; }

.empty-state { text-align: center; color: #6b7280; padding: 40px 0; font-size: 1.1rem; }
</style>