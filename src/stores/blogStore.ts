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
  const savedPinnedId = localStorage.getItem("pinnedBlogId");

  const blogs = ref<BlogPost[]>(savedBlogs ? JSON.parse(savedBlogs) : []);

  // 记录当前被置顶的博客 ID（至多一个）
  const pinnedBlogId = ref<number | null>(
    savedPinnedId ? JSON.parse(savedPinnedId) : null,
  );

  // 首次访问初始化示例博客
  if (!savedBlogs) {
    blogs.value.push({
      id: Date.now(),
      title: "第一篇博客：一个纯粹的写作空间",
      content:
        "<p>欢迎来到博客版面。由于部分内容在逻辑上既不属于特定的工程项目，也不适合作为某天的简短日志，因此独立建立了这个版面。</p><p>这里的排版经过了去干扰化处理，您可以在此沉淀深度思考、编写学习笔记或留存长篇幅的文章。文章修改后的摘要会自动提取并展示在概览列表中。</p>",
      date: new Date().toISOString().split("T")[0]!,
      summary:
        "欢迎来到博客版面。由于部分内容在逻辑上既不属于特定的工程项目，也不适合作为某天的简短日志，因此独立建立了这个版面。",
    });
    localStorage.setItem("blogs", JSON.stringify(blogs.value));
  }

  // 持久化监听
  watch(
    blogs,
    (newVal) => {
      localStorage.setItem("blogs", JSON.stringify(newVal));
    },
    { deep: true },
  );
  watch(pinnedBlogId, (newVal) => {
    localStorage.setItem("pinnedBlogId", JSON.stringify(newVal));
  });

  const addBlog = () => {
    const newId = Date.now();
    blogs.value.unshift({
      id: newId,
      title: "",
      content: "",
      date: new Date().toISOString().split("T")[0]!,
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