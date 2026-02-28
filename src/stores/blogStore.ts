import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface BlogPost {
  id: number
  title: string
  content: string
  date: string
  summary: string
}

export const useBlogStore = defineStore('blog', () => {
  const savedBlogs = localStorage.getItem('blogs')
  
  const blogs = ref<BlogPost[]>(
    savedBlogs ? JSON.parse(savedBlogs) : []
  )

  // 首次访问初始化示例博客
  if (!savedBlogs) {
    blogs.value.push({
      id: Date.now(),
      title: '第一篇博客：一个纯粹的写作空间',
      content: '<p>欢迎来到博客版面。由于部分内容在逻辑上既不属于特定的工程项目，也不适合作为某天的简短日志，因此独立建立了这个版面。</p><p>这里的排版经过了去干扰化处理，您可以在此沉淀深度思考、编写学习笔记或留存长篇幅的文章。文章修改后的摘要会自动提取并展示在概览列表中。</p>',
      date: new Date().toISOString().split('T')[0]!,
      summary: '欢迎来到博客版面。由于部分内容在逻辑上既不属于特定的工程项目，也不适合作为某天的简短日志，因此独立建立了这个版面。'
    })
    localStorage.setItem('blogs', JSON.stringify(blogs.value))
  }

  watch(blogs, (newVal) => {
    localStorage.setItem('blogs', JSON.stringify(newVal))
  }, { deep: true })

  const addBlog = () => {
    const newId = Date.now()
    blogs.value.unshift({
      id: newId,
      title: '无标题文章',
      content: '',
      date: new Date().toISOString().split('T')[0]!,
      summary: ''
    })
    return newId
  }

  const generateSummary = (htmlContent: string) => {
    const plainText = htmlContent.replace(/<[^>]+>/g, '').trim()
    return plainText.length > 60 ? plainText.slice(0, 60) + '...' : plainText
  }

  const updateBlog = (id: number, title: string, content: string) => {
    const blog = blogs.value.find(b => b.id === id)
    if (blog) {
      blog.title = title
      blog.content = content
      blog.summary = generateSummary(content)
    }
  }

  const deleteBlog = (id: number) => {
    blogs.value = blogs.value.filter(b => b.id !== id)
  }

  return { blogs, addBlog, updateBlog, deleteBlog }
})