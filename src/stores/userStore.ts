import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../utils/supabase'
import { getTodayYMD } from '../utils/timeFormat'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<any>(null)
  const currentProfile = ref<{username: string, email: string} | null>(null)
  const isLoading = ref(true)

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (data) currentProfile.value = data
  }

  const initializeSession = async () => {
    isLoading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    currentUser.value = session?.user || null
    if (currentUser.value) await fetchProfile(currentUser.value.id)

    supabase.auth.onAuthStateChange(async (_event, session) => {
      currentUser.value = session?.user || null
      if (currentUser.value) await fetchProfile(currentUser.value.id)
      else currentProfile.value = null
    })
    isLoading.value = false
  }

  const injectSampleData = async (userId: string) => {
    const today = getTodayYMD()
    const now = Date.now()
    try {
      await supabase.from('blogs').insert([{
        id: now, user_id: userId, date: today, is_pinned: true,
        title: '👋 欢迎来到你的数字空间',
        summary: '这是系统为你自动生成的示例文章。在这里，你可以体验沉浸式的纯文本写作环境...',
        content: '在这里，你可以使用 **Markdown** 语法进行排版。这里非常适合沉淀深度思考、长篇笔记或生活感悟。\n\n- 极致纯净的输入体验\n- 失去焦点即刻云端保存\n- 支持 `代码高亮`、> 引用等丰富格式\n\n你可以随时在左上角修改或删除这篇文章。'
      }])

      const projectId = now + 1
      await supabase.from('projects').insert([{
        id: projectId, user_id: userId, create_date: today, status: 'in-progress',
        title: '🚀 探索工作台核心功能',
        content: '点击右上角的 **“添加计时器”**，你可以为当前项目创建多个专属的时间记录器。无论你切换到系统中的哪个页面，计时器都会在后台精准运行，十分适合番茄工作法或项目工时统计。'
      }])
      await supabase.from('timers').insert([{
        id: now + 2, project_id: projectId, user_id: userId,
        name: '专注体验', is_running: false, start_time: 0, elapsed: 0
      }])

      const { data: jData } = await supabase.from('journals').insert([{
        user_id: userId, record_date: today,
        content: '这是你的第一条每日记录。随手的灵感、碎片化的日记都可以写在这里。右侧可以管理今日的待办事项。'
      }]).select().maybeSingle()

      if (jData) {
        await supabase.from('todos').insert([
          { id: now + 3, journal_id: jData.id, user_id: userId, text: '尝试在“项目”中新建一个计时器', done: false },
          { id: now + 4, journal_id: jData.id, user_id: userId, text: '在“白板”上拖拽一个灵感便签', done: false },
          { id: now + 5, journal_id: jData.id, user_id: userId, text: '阅读博客中的欢迎指南', done: true }
        ])
      }

      await supabase.from('whiteboard_items').insert([
        { id: now + 6, user_id: userId, text: '💡 双击任意空白处即可新建便签', pos_x: 80, pos_y: 100 },
        { id: now + 7, user_id: userId, text: '🖐️ 按住我可以随意拖拽排版', pos_x: 180, pos_y: 260 }
      ])
    } catch (e) {
      console.error('示例数据注入失败:', e)
    }
  }

  const signUp = async (username: string, email: string, password: string) => {
    try {
      // 修复：使用 maybeSingle 防止无数据时报错中断
      const { data: existing, error: checkError } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
      if (checkError) throw new Error('网络连接异常，请检查代理或网络环境')
      if (existing) throw new Error('该账号名已被注册，请更换')

      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { username } } 
      })
      if (error) throw error

      if (data.user) await injectSampleData(data.user.id)
      return data
    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('网络请求超时 (Failed to fetch)，请检查您的科学上网环境是否接管了浏览器流量。')
      }
      throw error
    }
  }

  const signIn = async (accountOrEmail: string, password: string) => {
    try {
      let loginEmail = accountOrEmail
      if (!accountOrEmail.includes('@')) {
        const { data, error } = await supabase.from('profiles').select('email').eq('username', accountOrEmail).maybeSingle()
        if (error || !data) throw new Error('账号名不存在')
        loginEmail = data.email
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
      if (error) throw new Error('密码错误或账号不存在')
      return data
    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('网络请求超时，请检查科学上网环境。')
      }
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { currentUser, currentProfile, isLoading, initializeSession, signUp, signIn, signOut }
})