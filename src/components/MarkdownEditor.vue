<script setup lang="ts">
import { ref, onMounted, onUnmounted, onBeforeUnmount, watch } from 'vue'
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
    mode: 'ir',
    placeholder: props.placeholder || '开始使用 Markdown 撰写...',
    toolbar: [
      'headings', 'bold', 'italic', 'strike', '|',
      'list', 'ordered-list', 'check', 'link', '|',
      'export','fullscreen'
    ],
    toolbarConfig: { pin: true },
    cache: { enable: false }, // 由 Pinia 接管缓存
    outline: {
      enable: false,
      position: 'left', 
    },
    after: () => {
      if (props.modelValue) {
        vditorInstance!.setValue(props.modelValue)
      }
    },
    input: (value) => {
      emit('update:modelValue', value)
    },
    // 【终极保险 1】监听失去焦点事件，立即保存
    blur: (value) => {
      emit('update:modelValue', value)
    }
  })
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (!vditorInstance) return
    const currentVal = vditorInstance.getValue()
    if (newVal !== currentVal && newVal + '\n' !== currentVal) {
      vditorInstance.setValue(newVal, true)
    }
  }
)

// 【终极保险 2】在路由跳转、组件销毁前的一瞬间，强行提取并保存最后的值
onBeforeUnmount(() => {
  if (vditorInstance) {
    const finalValue = vditorInstance.getValue()
    // 只有当真正发生改变时才触发更新，避免多余性能消耗
    if (finalValue !== props.modelValue && finalValue + '\n' !== props.modelValue) {
      emit('update:modelValue', finalValue)
    }
  }
})

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
}

:deep(.vditor-reset) {
  font-size: 1.05rem;
  line-height: 1.8;
  color: #374151;
  padding: 20px 24px !important;
}

/* 【修复 3】将横向滚动的 CSS 魔法严格限制在移动端 */
@media (max-width: 768px) {
  :deep(.vditor-toolbar) {
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch; 
    scrollbar-width: none; 
  }

  :deep(.vditor-toolbar::-webkit-scrollbar) {
    display: none;
  }

  :deep(.vditor-toolbar__item) {
    flex-shrink: 0 !important;
  }
}
</style>

<style scoped>
/* 深度接管 Vditor 工具栏样式，解决左侧空白并均匀分布按钮 */
:deep(.vditor-toolbar) {
  display: flex !important;
  justify-content: space-evenly !important; /* 核心：让所有按钮均匀平铺 */
  align-items: center;
  padding: 8px 0 !important; /* 强行抹除它默认的诡异左右 Padding */
  width: 100%;
}

/* 消除个别图标自带的边距干扰 */
:deep(.vditor-toolbar__item) {
  margin: 0 !important;
  display: inline-flex;
  justify-content: center;
}

/* 调整竖线分割符，使其在均匀分布中显得协调 */
:deep(.vditor-toolbar__divider) {
  margin: 0 !important;
}

/* 消除全屏模式下的层级遮挡隐患 */
:deep(.vditor--fullscreen) {
  z-index: 9999 !important;
}
</style>