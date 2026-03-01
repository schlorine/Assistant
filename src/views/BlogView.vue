<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '../stores/blogStore'
import IconDelete from '../components/icons/IconDelete.vue'
import IconPin from '../components/icons/IconPin.vue' // 如果你之前创建了图钉组件

const router = useRouter()
const store = useBlogStore()

// 绑定搜索输入框的响应式变量
const searchQuery = ref('')

// 计算属性：根据搜索词动态过滤博客列表
// 计算属性：根据搜索词过滤，并对置顶项进行排序优先处理
const filteredBlogs = computed(() => {
  let result = store.blogs
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(blog => blog.title.toLowerCase().includes(query))
  }
  
  // 将已置顶的文章排序到数组最首位
  return [...result].sort((a, b) => {
    if (a.id === store.pinnedBlogId) return -1
    if (b.id === store.pinnedBlogId) return 1
    return 0
  })
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
      
      <div v-for="blog in filteredBlogs" :key="blog.id" class="blog-card" :class="{ 'is-pinned': blog.id === store.pinnedBlogId }" @click="openBlog(blog.id)">
        <div class="card-main">
          <h3 class="blog-title">
            <span v-if="blog.id === store.pinnedBlogId" class="pin-badge" title="已置顶">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3h-0a3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
            </span>
            {{ blog.title }}
          </h3>
          <p class="blog-summary">{{ blog.summary || '这里空空如也，还没有摘要...' }}</p>
          <span class="blog-date">{{ blog.date }}</span>
        </div>
        
        <div class="action-buttons">
          <button class="icon-btn pin-btn" :class="{ active: blog.id === store.pinnedBlogId }" @click.stop="store.togglePin(blog.id)" :title="blog.id === store.pinnedBlogId ? '取消置顶' : '置顶这篇'">
            <IconPin style="font-size: 18px;" />
          </button>
          <button class="icon-btn delete-btn" @click.stop="handleDelete(blog.id)" title="删除文章">
            <IconDelete style="font-size: 18px;" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.action-group { display: flex; gap: 12px; align-items: center; }
.search-input { padding: 10px 16px; font-size: 0.95rem; width: 220px; }
.create-btn { padding: 10px 24px; background-color: #10b981; }
.create-btn:hover { background-color: #059669; }

.blog-list { display: flex; flex-direction: column; gap: 16px; }
.blog-card { display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; }
.card-main { flex: 1; min-width: 0; padding-right: 20px; }

.blog-card.is-pinned { border-color: #fde047; background-color: #fefce8; }
.blog-card.is-pinned:hover { border-color: #eab308; box-shadow: 0 10px 15px -3px rgba(253, 224, 71, 0.15); }

.blog-title { margin: 0 0 12px 0; font-size: 1.4rem; color: #111827; display: flex; align-items: center; }
.pin-badge { color: #eab308; margin-right: 8px; display: flex; align-items: center; }
.blog-summary { margin: 0 0 16px 0; color: #4b5563; font-size: 1rem; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.blog-date { font-size: 0.875rem; color: #9ca3af; }

.action-buttons { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; margin-top: -4px; }
.blog-card:hover .action-buttons { opacity: 1; }
.icon-btn.pin-btn:hover { background: #fef08a; color: #ca8a04; }
.icon-btn.pin-btn.active { color: #ca8a04; }

.empty-state { text-align: center; color: #6b7280; padding: 40px 0; font-size: 1.1rem; }
</style>