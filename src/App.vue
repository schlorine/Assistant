<script setup lang="ts">
import { ref, onMounted } from 'vue'
import IntroScreen from './components/IntroScreen.vue' // 新增这一行引入动效组件

const isCollapsed = ref(false)
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

// 新用户引导弹窗状态
const showWelcomeModal = ref(false)

onMounted(() => {
  const hasVisited = localStorage.getItem('hasVisited')
  if (!hasVisited) {
    showWelcomeModal.value = true
    localStorage.setItem('hasVisited', 'true')
  }
})

const closeWelcomeModal = () => {
  showWelcomeModal.value = false
}
</script>

<template>
  <IntroScreen />
  
  <div class="app-layout">
    <aside class="sidebar" :class="{ 'collapsed': isCollapsed }">
      <div class="sidebar-header">
        <h1 class="logo-text" v-show="!isCollapsed">私人助理</h1>
        <button class="toggle-btn" @click="toggleSidebar" :title="isCollapsed ? '展开菜单' : '收起菜单'">
          <span class="icon">{{ isCollapsed ? '▶' : '◀' }}</span>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" title="月历版面">
          <span class="icon">📅</span>
          <span class="text" v-show="!isCollapsed">月历版面</span>
        </router-link>
        
        <router-link to="/projects" class="nav-item" title="项目版面">
          <span class="icon">📁</span>
          <span class="text" v-show="!isCollapsed">项目版面</span>
        </router-link>

        <router-link to="/blog" class="nav-item" title="博客版面">
          <span class="icon">📝</span>
          <span class="text" v-show="!isCollapsed">博客版面</span>
        </router-link>
        
        <router-link to="/whiteboard" class="nav-item" title="灵感白板">
          <span class="icon">💡</span>
          <span class="text" v-show="!isCollapsed">灵感白板</span>
        </router-link>

        <div class="divider"></div>
        
        <a href="#" class="nav-item disabled" title="用户页面 (开发中)">
          <span class="icon">👤</span>
          <span class="text" v-show="!isCollapsed">用户页面</span>
        </a>
        
        <router-link to="/settings" class="nav-item" title="设置页面">
          <span class="icon">⚙️</span>
          <span class="text" v-show="!isCollapsed">设置页面</span>
        </router-link>
      </nav>
    </aside>

    <main class="main-content">
      <router-view></router-view>
    </main>

    <div class="welcome-overlay" v-if="showWelcomeModal">
      <div class="welcome-modal">
        <div class="welcome-header">
          <h2>欢迎使用私人助理</h2>
        </div>
        <div class="welcome-body">
          <p>这是一个专为提升效率与记录生活打造的本地化数字空间。主要包含以下四个核心模块：</p>
          <ul>
            <li><strong>📅 月历版面：</strong>点击日期网格进入详情，支持富文本日志撰写与每日待办。右上角支持切换至“全局待办”一览。</li>
            <li><strong>📁 项目版面：</strong>用于管理长期任务，内置可持久化运行的独立计时器，切换页面不中断。</li>
            <li><strong>📝 博客版面：</strong>提供纯粹的写作环境，支持文章置顶，适合沉淀深度思考与长篇笔记。</li>
            <li><strong>💡 灵感白板：</strong>无边界的数字点阵墙，在空白处点击即可输入，支持自由拖拽排版，随时捕捉灵感。</li>
          </ul>
          <p class="notice-text">注：当前版本所有数据均安全地加密存储于您的浏览器本地缓存中。</p>
        </div>
        <div class="welcome-footer">
          <button class="start-btn" @click="closeWelcomeModal">开始使用</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
body { margin: 0; padding: 0; background-color: #f3f4f6; }
</style>

<style scoped>
/* 保留原有侧边栏样式 */
.app-layout { display: flex; height: 100vh; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }
.sidebar { width: 240px; background-color: #ffffff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05); z-index: 10; }
.sidebar.collapsed { width: 68px; }
.sidebar-header { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid #e5e7eb; overflow: hidden; }
.logo-text { font-size: 1.25rem; font-weight: bold; color: #1f2937; margin: 0; white-space: nowrap; }
.toggle-btn { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 6px; color: #6b7280; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s; }
.toggle-btn:hover { background-color: #f3f4f6; color: #1f2937; }
.sidebar-nav { padding: 16px 8px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.nav-item { display: flex; align-items: center; padding: 12px; text-decoration: none; color: #4b5563; border-radius: 8px; transition: all 0.2s; overflow: hidden; white-space: nowrap; }
.nav-item:hover:not(.disabled) { background-color: #f3f4f6; color: #111827; }
.router-link-active { background-color: #eff6ff; color: #2563eb; font-weight: 600; }
.nav-item.disabled { opacity: 0.5; cursor: not-allowed; }
.icon { font-size: 1.25rem; min-width: 24px; display: inline-flex; justify-content: center; }
.text { margin-left: 12px; font-size: 0.95rem; }
.divider { height: 1px; background-color: #e5e7eb; margin: 8px 0; }
.main-content { flex: 1; overflow-y: auto; position: relative; }

/* 欢迎弹窗样式 */
.welcome-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(17, 24, 39, 0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); }
.welcome-modal { background: #ffffff; width: 90%; max-width: 500px; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; animation: modalSlideUp 0.3s ease-out; }
@keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.welcome-header { padding: 24px 32px 16px; border-bottom: 1px solid #f3f4f6; }
.welcome-header h2 { margin: 0; color: #111827; font-size: 1.5rem; }
.welcome-body { padding: 24px 32px; color: #4b5563; font-size: 1rem; line-height: 1.6; }
.welcome-body p { margin-top: 0; margin-bottom: 16px; }
.welcome-body ul { margin-top: 0; padding-left: 20px; margin-bottom: 24px; }
.welcome-body li { margin-bottom: 8px; }
.notice-text { font-size: 0.875rem; color: #9ca3af; margin-bottom: 0 !important; }
.welcome-footer { padding: 16px 32px 24px; display: flex; justify-content: flex-end; background: #f9fafb; border-top: 1px solid #f3f4f6; }
.start-btn { padding: 10px 24px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s; }
.start-btn:hover { background-color: #2563eb; }
</style>