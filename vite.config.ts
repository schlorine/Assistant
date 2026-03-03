import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    // 🌟 引入 PWA 插件
    VitePWA({
      registerType: 'autoUpdate', // 发现新版本时自动静默更新
      devOptions: {
        enabled: true // 【关键魔法】：允许在 localhost 开发环境下测试 PWA！
      },
      // 这里的配置会完全替代你之前手动创建的 manifest.json
      manifest: {
        name: "数字工作台 | Your Personal Assistant",
        short_name: "数字工作台",
        start_url: "/",
        display: "standalone",
        background_color: "#f3f4f6",
        theme_color: "#3b82f6",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ]
})