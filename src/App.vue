<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from './stores/userStore'
import IntroScreen from './components/IntroScreen.vue'
import SidebarIcon from './components/icons/SidebarIcon.vue'

// 🌟 引入刚刚建立的配置中心
import { RELEASE_NOTES } from './config/changelog'

const route = useRoute()
const userStore = useUserStore()

const isLoginRoute = computed(() => route.name === 'login')
const isCollapsed = ref(false)
const toggleSidebar = () => { isCollapsed.value = !isCollapsed.value }

const showWelcomeModal = ref(false)
const dontShowAgain = ref(false)

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // 阻止浏览器默认的顶部横幅
    ;(window as any).deferredPWAInstallPrompt = e // 挂载到全局
  })
})

watch(() => userStore.currentUser?.id, (userId) => {
  if (userId && !isLoginRoute.value) {
    // 获取用户最后一次确认“不再显示”的版本号
    const acknowledgedVersion = localStorage.getItem(`welcomeVersion_${userId}`)
    
    // 🌟 核心修改：直接比对配置文件里的最新版本号
    if (acknowledgedVersion !== RELEASE_NOTES.version) {
      setTimeout(() => {
        showWelcomeModal.value = true
        // 每次弹出时，重置 checkbox 状态
        dontShowAgain.value = false 
      }, 1000)
    }
  } else {
    showWelcomeModal.value = false
  }
}, { immediate: true })

const closeWelcomeModal = () => {
  if (dontShowAgain.value && userStore.currentUser) {
    // 🌟 核心修改：如果勾选了不再显示，把配置里的最新版本号存入本地
    localStorage.setItem(`welcomeVersion_${userStore.currentUser.id}`, RELEASE_NOTES.version)
  }
  showWelcomeModal.value = false
}
</script>

<template>
  <div v-if="userStore.isLoading" class="global-init-mask"></div>

  <router-view v-else-if="isLoginRoute"></router-view>

  <template v-else>
    <IntroScreen />
    
    <div class="app-layout">
      <aside class="sidebar" :class="{ 'collapsed': isCollapsed }">
        <div class="sidebar-header">
          <h1 class="logo-text" v-show="!isCollapsed">私人助理</h1>
          <button class="toggle-btn" @click="toggleSidebar">
            <span class="icon">{{ isCollapsed ? '▶' : '◀' }}</span>
          </button>
        </div>
        <nav class="sidebar-nav">
          <router-link to="/" class="nav-item" exact-active-class="router-link-active">
            <SidebarIcon name="calendar" />
            <span class="text" v-show="!isCollapsed">月历</span>
          </router-link>
          <router-link to="/projects" class="nav-item" active-class="router-link-active">
            <SidebarIcon name="project" />
            <span class="text" v-show="!isCollapsed">项目</span>
          </router-link>
          <router-link to="/blog" class="nav-item" active-class="router-link-active">
            <SidebarIcon name="blog" />
            <span class="text" v-show="!isCollapsed">博客</span>
          </router-link>
          <router-link to="/whiteboard" class="nav-item" active-class="router-link-active">
            <SidebarIcon name="whiteboard" />
            <span class="text" v-show="!isCollapsed">白板</span>
          </router-link>
          <div class="divider"></div>
          <router-link to="/settings" class="nav-item" active-class="router-link-active">
            <SidebarIcon name="settings" />
            <span class="text" v-show="!isCollapsed">设置</span>
          </router-link>
        </nav>
      </aside>

      <main class="main-content">
        <router-view></router-view>
      </main>

      <div class="welcome-overlay" v-if="showWelcomeModal">
        <div class="welcome-modal">
          <div class="welcome-header">
            <h2>{{ RELEASE_NOTES.title }}</h2>
          </div>
          
          <div class="welcome-body" style="padding-bottom: 24px;">
            <p v-for="(text, index) in RELEASE_NOTES.paragraphs" :key="index" style="margin-bottom: 12px;" v-html="text">
            </p>
          </div>
          
          <div class="welcome-footer">
            <label class="checkbox-label">
              <input type="checkbox" v-model="dontShowAgain" />
              <span>我已了解，本版本不再提示</span>
            </label>
            <button class="start-btn" @click="closeWelcomeModal">开始探索</button>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<style>
/* 补充一个全屏白底遮罩，防止网速慢时露出奇怪的底色 */
.global-init-mask {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: #f3f4f6; z-index: 999999;
}
body { margin: 0; padding: 0; background-color: #f3f4f6; }
#app { max-width: none !important; padding: 0 !important; margin: 0 !important; width: 100vw; height: 100vh; display: block !important; }
</style>

<style scoped>
/* 主体与侧边栏样式完全保持不变 */
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
.icon { font-size: 1.25rem; min-width: 24px; display: inline-flex; justify-content: center; }
.text { margin-left: 12px; font-size: 0.95rem; }
.divider { height: 1px; background-color: #e5e7eb; margin: 8px 0; }
.main-content { flex: 1; overflow-y: auto; position: relative; }

/* ================= 全新欢迎弹窗产品级样式 ================= */
.welcome-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(17, 24, 39, 0.65); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); }
.welcome-modal { background: #ffffff; width: 90%; max-width: 540px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; animation: modalFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes modalFadeIn { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

.welcome-header { padding: 32px 32px 16px; }
.welcome-header h2 { margin: 0; color: #111827; font-size: 1.6rem; letter-spacing: -0.5px; }

.welcome-body { padding: 0 32px 24px; color: #4b5563; font-size: 0.95rem; line-height: 1.6; }
.welcome-body p { margin: 0 0 20px 0; font-size: 1rem; color: #374151; }

.feature-grid { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.feature-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6; }
.feature-icon { font-size: 1.2rem; line-height: 1.4; }
.feature-text { color: #4b5563; line-height: 1.5; }
.feature-text strong { color: #111827; }

.notice-box :deep(.notice) { padding: 12px 16px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; color: #1e3a8a; font-size: 0.9rem; }

.welcome-footer { padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; background: #f9fafb; border-top: 1px solid #e5e7eb; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #6b7280; cursor: pointer; user-select: none; }
.checkbox-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #3b82f6; }
.start-btn { padding: 10px 28px; background-color: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3); }
.start-btn:hover { background-color: #2563eb; transform: translateY(-1px); box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.4); }

/* 移动端底部导航适配保持不变 */
@media (max-width: 768px) {
  :global(body) { margin: 0 !important; overflow: hidden !important; }
  .app-layout { flex-direction: column; padding-bottom: 65px; height: 100dvh; box-sizing: border-box; overflow-y: auto; overflow-x: hidden; }
  .sidebar { position: fixed; bottom: 0; left: 0; width: 100vw !important; height: 65px; flex-direction: row; border-right: none; border-top: 1px solid #e5e7eb; z-index: 1000; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05); }
  .sidebar-header { display: none; }
  .sidebar-nav { flex-direction: row; padding: 0; gap: 0; align-items: center; justify-content: space-around; }
  .nav-item { flex-direction: column; padding: 6px 0; gap: 4px; justify-content: center; border-radius: 0; flex: 1; }
  .nav-item:hover:not(.disabled) { background-color: transparent; }
  .router-link-active { background-color: transparent; color: #3b82f6; }
  .icon { font-size: 1.4rem; min-width: auto; margin: 0; }
  .text { margin-left: 0 !important; font-size: 0.65rem; display: block !important; font-weight: 500; }
  .divider, .nav-item.disabled { display: none; }
  
  .welcome-modal { width: 95%; max-height: 90vh; overflow-y: auto; border-radius: 12px; }
  .welcome-header { padding: 24px 20px 12px; }
  .welcome-header h2 { font-size: 1.4rem; }
  .welcome-body { padding: 0 20px 20px; }
  .welcome-footer { padding: 16px 20px; flex-direction: column-reverse; gap: 16px; }
  .start-btn { width: 100%; padding: 12px; }
}
</style>