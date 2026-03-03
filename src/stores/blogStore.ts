import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { supabase } from '../utils/supabase'
import { useUserStore } from './userStore'
import { getTodayYMD } from '../utils/timeFormat'

export interface BlogPost {
  id: number
  title: string
  content: string
  date: string
  summary: string
  is_pinned?: boolean
}

export const useBlogStore = defineStore('blog', () => {
  const blogs = ref<BlogPost[]>([])
  const pinnedBlogId = ref<number | null>(null)
  
  const userStore = useUserStore()

  const fetchBlogs = async () => {
    if (!userStore.currentUser) return
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('user_id', userStore.currentUser.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('拉取博客失败:', error.message)
    } else if (data) {
      blogs.value = data
      const pinned = data.find(b => b.is_pinned)
      pinnedBlogId.value = pinned ? pinned.id : null
    }
  }

  watch(() => userStore.currentUser?.id, (userId) => {
    if (userId) {
      fetchBlogs()
    } else {
      blogs.value = []
      pinnedBlogId.value = null
    }
  }, { immediate: true })

  const addBlog = () => {
    if (!userStore.currentUser) {
      alert('请先连接云端账号')
      return null
    }
    const newId = Date.now()
    const newBlog: BlogPost = { id: newId, title: '', content: '', date: getTodayYMD(), summary: '', is_pinned: false }
    
    blogs.value.unshift(newBlog)

    supabase.from('blogs').insert([{
      ...newBlog,
      user_id: userStore.currentUser.id
    }]).then(({ error }) => {
      if (error) console.error('云端新建失败:', error.message)
    })
    
    return newId
  }

  const updateBlog = (id: number, title: string, content: string) => {
    const blog = blogs.value.find(b => b.id === id)
    if (!blog) return
    
    blog.title = title
    blog.content = content
    const plainText = content.replace(/[#*`_>\[\]\n]/g, ' ').replace(/\s+/g, ' ').trim()
    blog.summary = plainText.length > 60 ? plainText.slice(0, 60) + '...' : plainText

    if (userStore.currentUser) {
      // 【修复】：补上 .then()，强制触发网络请求
      supabase.from('blogs').update({
        title: blog.title,
        content: blog.content,
        summary: blog.summary
      }).eq('id', id).eq('user_id', userStore.currentUser.id)
      .then(({ error }) => { if (error) console.error('云端更新失败:', error.message) })
    }
  }

  const deleteBlog = (id: number) => {
    blogs.value = blogs.value.filter(b => b.id !== id)
    if (pinnedBlogId.value === id) pinnedBlogId.value = null

    if (userStore.currentUser) {
      // 【修复】：补上 .then()
      supabase.from('blogs').delete().eq('id', id).eq('user_id', userStore.currentUser.id)
      .then(({ error }) => { if (error) console.error('云端删除失败:', error.message) })
    }
  }

  const togglePin = (id: number) => {
    const isCurrentlyPinned = pinnedBlogId.value === id
    pinnedBlogId.value = isCurrentlyPinned ? null : id
    blogs.value.forEach(b => b.is_pinned = (b.id === pinnedBlogId.value))

    if (userStore.currentUser) {
      // 【修复】：补上 .then()
      supabase.from('blogs').update({ is_pinned: false }).eq('user_id', userStore.currentUser.id)
      .then(() => {
        if (!isCurrentlyPinned) {
          supabase.from('blogs').update({ is_pinned: true }).eq('id', id).eq('user_id', userStore.currentUser.id).then()
        }
      })
    }
  }

  return { blogs, pinnedBlogId, fetchBlogs, addBlog, updateBlog, deleteBlog, togglePin }
})