<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])

const vditorRef = ref<HTMLElement | null>(null)
let vditorInstance: Vditor | null = null

onMounted(() => {
  if (!vditorRef.value) return

  vditorInstance = new Vditor(vditorRef.value, {
    height: '100%',
    mode: 'ir', // 即时渲染模式
    placeholder: props.placeholder || '开始使用 Markdown 撰写...',
    // 【新增】精简版工具栏配置
    toolbar: [
      'headings', 'bold', 'italic', 'strike', '|',
      'list', 'ordered-list', 'check', 'link', '|',
      'upload','export','fullscreen'
    ],
    toolbarConfig: { pin: true },
    cache: { enable: false },
    outline: {
      enable: false,
      position: 'left',
    },
    input: (value) => {
      emit('update:modelValue', value)
    }
  })
})

// 监听外部数据回显（例如从列表点进详情页）
watch(
  () => props.modelValue,
  (newVal) => {
    if (vditorInstance && newVal !== vditorInstance.getValue()) {
      vditorInstance.setValue(newVal, true)
    }
  }
)

onUnmounted(() => {
  if (vditorInstance) {
    vditorInstance.destroy()
    vditorInstance = null
  }
})
</script>

<template>
  <div class="vditor-wrapper">
    <div ref="vditorRef"></div>
  </div>
</template>

<style scoped>
.vditor-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 覆盖 Vditor 默认的丑陋边框，使其融入我们的科技极简风 */
:deep(.vditor) {
  border: none !important;
  border-radius: 0 0 8px 8px;
  flex: 1;
}

:deep(.vditor-toolbar) {
  border-bottom: 1px solid #e5e7eb !important;
  background-color: #f9fafb;
  border-radius: 8px 8px 0 0;
  padding: 8px 16px;
  
  display: flex !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch; /* 提升 iOS 上的滑动流畅度 */
  scrollbar-width: none; 
}
/* 隐藏 Chrome/Safari/Edge 的滚动条，保持界面清爽 */
:deep(.vditor-toolbar::-webkit-scrollbar) {
  display: none;
}

/* 确保每个图标按钮不会被强行挤压变形 */
:deep(.vditor-toolbar__item) {
  flex-shrink: 0 !important;
}

:deep(.vditor-reset) {
  font-size: 1.05rem;
  line-height: 1.8;
  color: #374151;
  padding: 20px 24px !important;
}
</style>