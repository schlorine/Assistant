import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { usePersistedRef } from '../utils/storage'
import { getTodayYMD } from '../utils/timeFormat'
  
export interface BlogPost {
  id: number
  title: string
  content: string
  date: string
  summary: string
}

export const useBlogStore = defineStore('blog', () => {
  const blogs = usePersistedRef<BlogPost[]>('blogs', [])
  const pinnedBlogId = usePersistedRef<number | null>('pinnedBlogId', null)

  // 首次访问初始化示例博客
  if (blogs.value.length === 0) {
    blogs.value.push({
      id: Date.now(),
      title: "第一篇博客：一个纯粹的写作空间",
      content: "<p>欢迎来到博客版面。由于部分内容在逻辑上既不属于特定的工程项目，也不适合作为某天的简短日志，因此独立建立了这个版面。</p><p>这里的排版经过了去干扰化处理，您可以在此沉淀深度思考、编写学习笔记或留存长篇幅的文章。文章修改后的摘要会自动提取并展示在概览列表中。</p>",
      date: getTodayYMD(),
      summary: "欢迎来到博客版面。由于部分内容在逻辑上既不属于特定的工程项目，也不适合作为某天的简短日志，因此独立建立了这个版面。",
    });
  }

  const addBlog = () => {
    const newId = Date.now();
    blogs.value.unshift({
      id: newId,
      title: "",
      content: "",
      date: getTodayYMD(),
      summary: "",
    });
    return newId;
  };

  const generateSummary = (htmlContent: string) => {
    const plainText = htmlContent.replace(/<[^>]+>/g, "").trim();
    return plainText.length > 60 ? plainText.slice(0, 60) + "..." : plainText;
  };

  const updateBlog = (id: number, title: string, content: string) => {
    const blog = blogs.value.find((b) => b.id === id);
    if (blog) {
      blog.title = title;
      blog.content = content;
      blog.summary = generateSummary(content);
    }
  };

  const deleteBlog = (id: number) => {
    blogs.value = blogs.value.filter((b) => b.id !== id);
    // 如果删除的文章刚好是被置顶的文章，则清空置顶状态
    if (pinnedBlogId.value === id) {
      pinnedBlogId.value = null;
    }
  };

  // 切换置顶状态
  const togglePin = (id: number) => {
    // 如果点击的是当前已置顶的，则取消置顶；否则替换置顶对象
    pinnedBlogId.value = pinnedBlogId.value === id ? null : id;
  };

  return { blogs, pinnedBlogId, addBlog, updateBlog, deleteBlog, togglePin };
})