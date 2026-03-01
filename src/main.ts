import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/common.css' // 引入全局基础样式

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')