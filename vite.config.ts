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
        name: "私人助理 | Schlorine's Workspace",
        short_name: "私人助理",
        start_url: "/",
        display: "standalone",
        background_color: "#f3f4f6",
        theme_color: "#3b82f6",
        icons: [
          {
            src: "/logo.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "/logo.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      }
    })
  ]
})