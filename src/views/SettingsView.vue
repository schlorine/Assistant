<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useJournalStore } from '../stores/journalStore'
import { useProjectStore } from '../stores/projectStore'
import { useBlogStore } from '../stores/blogStore'
import { useUserStore } from '../stores/userStore'
import { ref, onMounted, onUnmounted } from 'vue'

// 添加到主屏幕功能

// PWA 安装逻辑
const showInstallGuide = ref(false)
const isIOS = ref(false)

onMounted(() => {
  // 只保留 iOS 判断逻辑，移除原来的 beforeinstallprompt 监听
  const userAgent = window.navigator.userAgent.toLowerCase()
  isIOS.value = /iphone|ipad|ipod/.test(userAgent)
})

const handleInstallClick = async () => {
  // 去全局 window 对象里拿刚才拦截到的事件
  const promptEvent = (window as any).deferredPWAInstallPrompt
  
  if (promptEvent) {
    // 触发系统原生的安装弹窗
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      // 用户同意安装后，清空这个事件
      ;(window as any).deferredPWAInstallPrompt = null 
    }
  } else {
    // 如果没拦截到（比如是 iOS，或者已经安装过了，或者是不支持的浏览器）
    showInstallGuide.value = true
  }
}
///////////////////////////////////////////////////

const journalStore = useJournalStore()
const projectStore = useProjectStore()
const blogStore = useBlogStore()
const userStore = useUserStore()
const router = useRouter()

// 修复登出核心逻辑
const showLogoutModal = ref(false)

const executeLogout = async () => {
  try {
    await userStore.signOut()
    showLogoutModal.value = false
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    alert('退出失败，请检查网络')
  }
}

// 纯净 Markdown 导出逻辑
const exportToMarkdown = () => {
  let mdContent = '# 个人数字空间导出备份\n\n'
  mdContent += `导出时间：${new Date().toLocaleString()}\n\n`

  mdContent += '---\n\n## 📅 月历日志\n\n'
  const journalKeys = Object.keys(journalStore.records).sort((a, b) => b.localeCompare(a))
  if (journalKeys.length === 0) mdContent += '暂无日志记录。\n\n'
  
  journalKeys.forEach(date => {
    const record = journalStore.records[date]!
    mdContent += `### ${date}\n\n`
    mdContent += `${record.content || '无正文'}\n\n`
    
    if (record.todos.length > 0) {
      mdContent += '**待办事项：**\n'
      record.todos.forEach(todo => {
        mdContent += `- [${todo.done ? 'x' : ' '}] ${todo.text}\n`
      })
      mdContent += '\n'
    }
  })

  mdContent += '---\n\n## 📁 项目看板\n\n'
  if (projectStore.projects.length === 0) mdContent += '暂无项目记录。\n\n'
  
  projectStore.projects.forEach(project => {
    mdContent += `### ${project.title} (创建于 ${project.createDate})\n\n`
    mdContent += `${project.content || '无正文'}\n\n`
    
    const projTimers = projectStore.timers[project.id] || []
    if (projTimers.length > 0) {
      mdContent += '**专属计时器记录：**\n'
      projTimers.forEach(timer => {
        const totalSeconds = Math.floor(timer.elapsed / 1000)
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
        const s = String(totalSeconds % 60).padStart(2, '0')
        mdContent += `- ${timer.name}: ${h}:${m}:${s}\n`
      })
      mdContent += '\n'
    }
  })

  mdContent += '---\n\n## 📝 博客文章\n\n'
  if (blogStore.blogs.length === 0) mdContent += '暂无博客记录。\n\n'
  
  blogStore.blogs.forEach(blog => {
    mdContent += `### ${blog.title}\n\n`
    mdContent += `> 发布时间：${blog.date}\n> 摘要：${blog.summary}\n\n`
    mdContent += `${blog.content || '无正文'}\n\n`
  })

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Workspace_Export_${new Date().toISOString().split('T')[0]}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="settings-container layout-wrapper">
    <header class="page-header">
      <h2>设置与账号</h2>
    </header>
    
    <div class="settings-list">
      
      <div class="settings-card profile-card">
        <div class="profile-info">
          <div class="avatar-placeholder">
            {{ userStore.currentProfile?.username?.charAt(0).toUpperCase() || 'U' }}
          </div>
          <div class="profile-details">
            <h3>{{ userStore.currentProfile?.username || '获取中...' }}</h3>
            <p>{{ userStore.currentProfile?.email || '云端邮箱同步中' }}</p>
            <span class="status-badge">已连接云端同步</span>
          </div>
        </div>
        <button class="action-btn danger-btn" @click="showLogoutModal = true">退出当前账号</button>
      </div>

      <div class="settings-card">
        <div class="setting-item">
          <div class="setting-info">
            <h3>📱 添加到主屏幕 (PWA)</h3>
            <p>将工作台作为独立 App 安装到手机桌面，隐藏浏览器工具栏，体验纯净的沉浸式全屏视图。</p>
          </div>
          <button 
            class="action-btn" 
            @click="handleInstallClick" 
          >
            添加到主屏幕
          </button>
        </div>
      </div>

      <div class="settings-card">
        <div class="setting-item">
          <div class="setting-info">
            <h3>数据导出 (阅读版)</h3>
            <p>将月历、项目和博客中的关键文本提取为原生 Markdown 文档。格式经过排版优化，适合日常脱机查阅或导入其他知识库。</p>
          </div>
          <button class="action-btn" @click="exportToMarkdown">生成 .md 文件</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showLogoutModal">
      <div class="modal-content">
        <h3>确认退出登录？</h3>
        <p>退出后，您需要重新输入账号密码才能访问您的云端数据。</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showLogoutModal = false">取消</button>
          <button class="confirm-danger-btn" @click="executeLogout">确认退出</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showInstallGuide" @click="showInstallGuide = false">
      <div class="modal-content" @click.stop>
        <h3>如何安装到桌面？</h3>
        <div class="guide-content" style="margin-top: 16px; color: #4b5563; font-size: 0.95rem; line-height: 1.6;">
          <template v-if="isIOS">
            <p>由于苹果 iOS 的安全限制，请按照以下步骤手动添加：</p>
            <ol style="padding-left: 20px; margin-top: 12px;">
              <li style="margin-bottom: 8px;">点击浏览器底部的 <strong>「分享」</strong> 图标 <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></li>
              <li style="margin-bottom: 8px;">在菜单中下滑，点击 <strong>「添加到主屏幕」</strong> <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></li>
              <li>点击右上角的「添加」即可。</li>
            </ol>
          </template>
          <template v-else>
            <p>您的浏览器暂不支持一键安装，或您已通过此方式运行。</p>
            <p>您可以尝试点击浏览器右上角菜单，选择<strong>「安装应用」</strong>或<strong>「添加到主屏幕」</strong>。</p>
          </template>
        </div>
        <div class="modal-actions" style="margin-top: 24px;">
          <button class="action-btn" @click="showInstallGuide = false" style="width: 100%; justify-content: center;">我知道了</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.settings-list { display: flex; flex-direction: column; gap: 24px; }
.settings-card { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; transition: transform 0.2s, box-shadow 0.2s; }
.settings-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #93c5fd; }

.setting-item { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.setting-info h3 { margin: 0 0 8px 0; color: #111827; font-size: 1.2rem; }
.setting-info p { margin: 0; color: #4b5563; font-size: 0.95rem; line-height: 1.5; }

.action-btn { 
  padding: 10px 20px; background-color: #3b82f6; color: white; 
  border: none; border-radius: 6px; font-weight: 600; 
  cursor: pointer; transition: background-color 0.2s; white-space: nowrap; 
}
.action-btn:hover { background-color: #2563eb; }

/* 资料卡片专属样式 */
.profile-card { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.profile-info { display: flex; align-items: center; gap: 20px; }
.avatar-placeholder { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2); }
.profile-details h3 { margin: 0 0 6px 0; font-size: 1.4rem; color: #111827; }
.profile-details p { margin: 0 0 10px 0; color: #6b7280; font-size: 0.95rem; }
.status-badge { display: inline-block; padding: 4px 12px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }

.danger-btn { background-color: #ef4444; border: none; }
.danger-btn:hover { background-color: #dc2626; }

@media (max-width: 768px) {
  .settings-card { padding: 16px; border-radius: 12px; }
  .setting-item { flex-direction: column; align-items: flex-start; }
  .setting-info p { font-size: 0.85rem; line-height: 1.6; margin-bottom: 16px; }
  .action-btn { width: 100%; box-sizing: border-box; display: flex; justify-content: center; padding: 12px; font-size: 1.05rem; }
  
  .profile-card { flex-direction: column; align-items: flex-start; padding: 20px; }
  .profile-info { width: 100%; border-bottom: 1px solid #f3f4f6; padding-bottom: 20px; }
  .profile-card .danger-btn { width: 100%; margin-top: 8px; }
}

/* 引导弹窗样式补充 */
.guide-content { margin-top: 16px; color: #4b5563; font-size: 0.95rem; line-height: 1.6; }
.guide-content ol { padding-left: 20px; margin-top: 12px; }
.guide-content li { margin-bottom: 8px; }
</style>