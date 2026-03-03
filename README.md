<div align="center">
  <img src="public/logo.svg" alt="Logo" width="120" />
  <h1>私人助理 | Schlorine's Workspace</h1>
  <p>一个专为效率极客与创作者打造的云原生个人数字空间。</p>


  <p>
    <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js" alt="Vue"></a>
    <a href="https://pinia.vuejs.org/"><img src="https://img.shields.io/badge/Pinia-State_Management-FFD166?style=flat-square&logo=vue.js" alt="Pinia"></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Database_&_Auth-3ECF8E?style=flat-square&logo=supabase" alt="Supabase"></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel" alt="Vercel"></a>
  </p>

</div>

## 🌐 在线体验 (Live Demo)

**访问地址**：[https://www.schlorine.me](https://www.schlorine.me)  
*(注：项目已完整接入云端并配置全局路由，推荐在移动端浏览器添加到主屏幕，获取媲美原生 App 的极致体验。)*

---

## ✨ 核心特性 (Features)

本项目打破了传统工具栈碎片化的痛点，在一个高度沉浸的 SPA（单页应用）中融合了四大核心高频场景：

### 📅 月历日志 (Calendar & Tasks)

* **原生级瀑布流月历**：移动端支持无缝上下滑动的无限月历，并带有智能吸顶表头。
* **碎片化捕获**：点击任意日期即可拉起富文本日志编辑器。
* **全局待办管理**：集成每日 Todo 列表，支持一键切换至“全局待办视图”进行任务清点。

### 📁 项目看板 (Project & Pomodoro)

* **目标管理**：直观的网格卡片布局，清晰区分“未开始/进行中/已完成”状态。
* **独立后台计时器**：每个项目可挂载多个专属计时器。基于时间戳的底层逻辑，确保无论切换页面还是休眠后台，工时记录都精准无误。

### 📝 博客文章 (Markdown Notes)

* **纯粹写作体验**：深度集成 Vditor 引擎，支持完整 Markdown 语法、代码高亮与沉浸式全屏输入。
* **云端秒级同步**：引入高频操作防抖机制，失去焦点或暂停输入 500ms 后静默落库。

### 💡 灵感白板 (Whiteboard)

* **无边界思考**：打破线性排版束缚的数字点阵墙。
* **多端一致性**：双端完美适配。PC 端支持鼠标拖拽，移动端支持 Touch 触摸拖拽，并带有智能防溢出边缘吸附算法。

---

## 🛠 技术栈与架构 (Tech Stack)

* **前端框架**：Vue 3 (Composition API) + TypeScript
* **状态管理**：Pinia
* **路由管理**：Vue Router 4
* **后端服务**：Supabase (PostgreSQL + Auth)
* **部署方案**：Vercel
* **关键依赖**：Vditor (Markdown 渲染)

---

## 🚀 工程化亮点 (Engineering Highlights)

这不是一个简单的 CRUD 玩具，在通往生产级的道路上，本项目攻克了以下技术挑战：

1. **绝对免疫的“状态防火墙”**：
   重构了传统的 Token 监听逻辑。在面对 PWA / 移动端常见的“休眠唤醒”导致 Supabase 底层权限频繁重置的问题时，通过拦截 ID 震荡，彻底消灭了“数据被吞”、“页面假死冻结”等极端并发 Bug。
2. **乐观更新 (Optimistic UI) 与原子化防抖**：
   摒弃了传统的“点击保存”模式。数据在前端瞬间响应，配合后台 500ms 防抖队列静默推流，并在发生冲突时自动执行 upsert 操作，在保证数据强一致性的同时，实现了“零延迟”的丝滑操作感。
3. **App 级响应式重构**：
   在移动端（< 768px）下，侧边栏无缝变形为底部 Tab 导航。通过底层拦截 Safari 等浏览器的强制缩放机制，并配合 display: contents 与 order 实现弹性重排，在小屏下依然保持完美的视觉张力。

---

## 📦 本地运行 (Local Setup)

1. 克隆项目到本地：

```bash
git clone [https://github.com/YourUsername/your-repo-name.git](https://github.com/YourUsername/your-repo-name.git)
cd your-repo-name
```

2. 安装依赖：

```bash
npm install
```

3. 配置环境变量：

在根目录创建 `.env.local` 文件，填入你的 Supabase 凭证：

```Code snippet
VITE_SUPABASE_URL=你的_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=你的_SUPABASE_ANON_KEY
```

4. 启动开发服务器：

```bash
npm run dev
```

------

## 👨‍💻 关于作者

**Schlorine**

- 上海交通大学浦院在读
- 邮箱： sjtu_peng@sjtu.edu.cn 
- 微信：pxx299792458