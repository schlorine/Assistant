// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/common.css' // 确保你的全局样式在这里引入

const app = createApp(App)

// 自动对焦指令，确保刚生成的文本框直接可以打字
app.directive('focus', {
  mounted: (el: HTMLElement) => el.focus()
})

app.use(createPinia())
app.use(router)
app.mount('#app')