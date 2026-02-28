<script setup lang="ts">
import { ref } from 'vue'

// 控制侧边栏展开与收起的状态
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<template>
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
        
        <div class="divider"></div>
        
        <a href="#" class="nav-item disabled" title="用户页面 (开发中)">
          <span class="icon">👤</span>
          <span class="text" v-show="!isCollapsed">用户页面</span>
        </a>
        
        <a href="#" class="nav-item disabled" title="设置页面 (开发中)">
          <span class="icon">⚙️</span>
          <span class="text" v-show="!isCollapsed">设置页面</span>
        </a>
      </nav>
    </aside>

    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style>
/* 全局重置样式，清除浏览器默认边距 */
body {
  margin: 0;
  padding: 0;
  background-color: #f3f4f6;
}
</style>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
}

.sidebar {
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.sidebar.collapsed {
  width: 68px;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
  overflow: hidden;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
}

.toggle-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.toggle-btn:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.sidebar-nav {
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px;
  text-decoration: none;
  color: #4b5563;
  border-radius: 8px;
  transition: all 0.2s;
  overflow: hidden;
  white-space: nowrap;
}

.nav-item:hover:not(.disabled) {
  background-color: #f3f4f6;
  color: #111827;
}

/* 路由激活状态的高亮显示 */
.router-link-active {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.nav-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  font-size: 1.25rem;
  min-width: 24px;
  display: inline-flex;
  justify-content: center;
}

.text {
  margin-left: 12px;
  font-size: 0.95rem;
}

.divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 8px 0;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
}
</style>