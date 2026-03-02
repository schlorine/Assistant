<script setup lang="ts">
import { ref } from 'vue'
import { useJournalStore } from '../stores/journalStore'
import { useProjectStore } from '../stores/projectStore'
import { useBlogStore } from '../stores/blogStore'
import { useWhiteboardStore } from '../stores/whiteboardStore' // 新增
import { formatMsToTime } from '../utils/timeFormat'

const journalStore = useJournalStore()
const projectStore = useProjectStore()
const blogStore = useBlogStore()
const whiteboardStore = useWhiteboardStore() // 新增

// 保留先前的 Markdown 导出逻辑
const exportToMarkdown = () => {
  let mdContent = '# 个人数字空间导出备份\n\n'
  mdContent += `导出时间：${new Date().toLocaleString()}\n\n`

  mdContent += '---\n\n## 📅 月历日志\n\n'
  const journalKeys = Object.keys(journalStore.records).sort((a, b) => b.localeCompare(a))
  if (journalKeys.length === 0) mdContent += '暂无日志记录。\n\n'
  
  journalKeys.forEach(date => {
    const record = journalStore.records[date]!
    mdContent += `### ${date}\n\n`
    
    let textContent = record.content.replace(/<p><br><\/p>/g, '\n').replace(/<\/p>/g, '\n\n').replace(/<[^>]+>/g, '')
    mdContent += `${textContent || '无正文'}\n\n`
    
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
    let projContent = (project.content || '').replace(/<p><br><\/p>/g, '\n').replace(/<\/p>/g, '\n\n').replace(/<[^>]+>/g, '')
    mdContent += `${projContent || '无正文'}\n\n`
    
    const projTimers = projectStore.timers[project.id] || []
    if (projTimers.length > 0) {
      mdContent += '**专属计时器记录：**\n'
      projTimers.forEach(timer => {
        mdContent += `- ${timer.name}: ${formatMsToTime(timer.elapsed)}\n`
      })
      mdContent += '\n'
    }
  })

  mdContent += '---\n\n## 📝 博客文章\n\n'
  if (blogStore.blogs.length === 0) mdContent += '暂无博客记录。\n\n'
  
  blogStore.blogs.forEach(blog => {
    mdContent += `### ${blog.title}\n\n`
    mdContent += `> 发布时间：${blog.date}\n> 摘要：${blog.summary}\n\n`
    let blogContent = blog.content.replace(/<p><br><\/p>/g, '\n').replace(/<\/p>/g, '\n\n').replace(/<[^>]+>/g, '')
    mdContent += `${blogContent}\n\n`
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

// ---------------- 新增：JSON 备份与恢复逻辑 ----------------

const exportToJson = () => {
  const backupData = {
    journalRecords: journalStore.records,
    projects: projectStore.projects,
    timers: projectStore.timers,
    blogs: blogStore.blogs,
    whiteboardItems: whiteboardStore.items // 补充白板数据
  }
  
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Workspace_SystemBackup_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const fileInputRef = ref<HTMLInputElement | null>(null)

// 触发隐藏的文件选择框
const triggerImport = () => {
  fileInputRef.value?.click()
}

// 处理文件读取与数据覆盖
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const parsedData = JSON.parse(content)

      // 简单嗅探一下文件结构，防止传错文件 (追加对 whiteboardItems 的判断)
      if (parsedData.journalRecords || parsedData.projects || parsedData.blogs || parsedData.whiteboardItems) {
        if (window.confirm('危险操作提示：\n导入备份将不可逆地覆盖当前系统内的所有数据！\n确定要继续吗？')) {
          
          // 将解析出的数据分发写入本地缓存
          if (parsedData.journalRecords) localStorage.setItem('journalRecords', JSON.stringify(parsedData.journalRecords))
          if (parsedData.projects) localStorage.setItem('projects', JSON.stringify(parsedData.projects))
          if (parsedData.timers) localStorage.setItem('timers', JSON.stringify(parsedData.timers))
          if (parsedData.blogs) localStorage.setItem('blogs', JSON.stringify(parsedData.blogs))
          if (parsedData.whiteboardItems) localStorage.setItem('whiteboardItems', JSON.stringify(parsedData.whiteboardItems)) // 补充恢复逻辑
          
          localStorage.setItem('hasVisited', 'true')
          
          alert('数据恢复成功！系统即将重新加载。')
          window.location.reload()
        }
      } else {
        alert('导入失败：未识别到有效的数据备份格式，请检查文件是否正确。')
      }
    } catch (error) {
      alert('导入失败：文件解析异常。请确保上传的是未经修改的系统备份 JSON 文件。')
    }
  }
  
  reader.readAsText(file)
  // 重置文件框，确保重复选择同一个文件也能触发 change 事件
  target.value = ''
}
</script>

<template>
  <div class="settings-container">
    <div class="header-section">
      <h2>系统设置</h2>
    </div>
    
    <div class="settings-list">
      <div class="settings-card">
        <div class="setting-item">
          <div class="setting-info">
            <h3>数据导出 (阅读版)</h3>
            <p>将月历、项目和博客中的关键文本及待办状态提取为 Markdown 文档。格式经过排版优化，适合日常脱机查阅或文本存档。</p>
          </div>
          <button class="action-btn" @click="exportToMarkdown">生成 .md 文件</button>
        </div>
      </div>

      <div class="settings-card danger-zone">
        <div class="setting-item">
          <div class="setting-info">
            <h3>系统级备份与恢复 (JSON)</h3>
            <p>导出包含计时器状态、任务 ID 等在内的全量原始数据。当您需要更换设备或重置浏览器时，可以通过导入此文件将系统 100% 还原至当前状态。</p>
          </div>
          <div class="btn-group">
            <button class="action-btn outline-btn" @click="exportToJson">导出全量备份</button>
            <button class="action-btn danger-btn" @click="triggerImport">导入并覆盖数据</button>
            <input 
              type="file" 
              ref="fileInputRef" 
              accept=".json" 
              @change="handleFileUpload" 
              style="display: none;" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-list { display: flex; flex-direction: column; gap: 24px; }
.settings-card.danger-zone { border-color: #fca5a5; background: #fffcfc; }

.setting-item { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.setting-info h3 { margin: 0 0 8px 0; color: #111827; font-size: 1.2rem; }
.setting-info p { margin: 0; color: #4b5563; font-size: 0.95rem; line-height: 1.5; }

.btn-group { display: flex; gap: 12px; }
.action-btn { padding: 10px 20px; white-space: nowrap; }

.outline-btn { background-color: transparent; color: #3b82f6; border: 1px solid #3b82f6; }
.outline-btn:hover { background-color: #eff6ff; }

.danger-btn { background-color: #ef4444; }
.danger-btn:hover { background-color: #dc2626; }

/* 补充丢失的按钮基础样式 */
.action-btn { 
  padding: 10px 20px; background-color: #3b82f6; color: white; 
  border: none; border-radius: 6px; font-weight: 600; 
  cursor: pointer; transition: background-color 0.2s; white-space: nowrap; 
}
.action-btn:hover { background-color: #2563eb; }

/* 覆盖特定按钮的颜色 */
.outline-btn { background-color: transparent; color: #3b82f6; border: 1px solid #3b82f6; }
.outline-btn:hover { background-color: #eff6ff; }
.danger-btn { background-color: #ef4444; border: 1px solid #ef4444; }
.danger-btn:hover { background-color: #dc2626; border-color: #dc2626; }

/* ================= 移动端细节适配 ================= */
@media (max-width: 768px) {
  /* 1. 设置卡片内边距缩减，适应窄屏 */
  .settings-card, .setting-section {
    padding: 16px;
    border-radius: 12px;
  }
  
  /* 2. 描述文字稍微减小，防止换行过多 */
  .setting-desc {
    font-size: 0.85rem;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  /* 3. 核心：将操作按钮全部改为纵向堆叠的“通栏大按钮” */
  .setting-actions, .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  
  /* 确保所有的按钮、上传框（如果用 label 包裹的 input file）都撑满屏幕 */
  .setting-actions button, 
  .setting-actions .btn,
  .setting-actions label {
    width: 100%;
    box-sizing: border-box;
    margin: 0 !important;
    padding: 12px;
    font-size: 1.05rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>