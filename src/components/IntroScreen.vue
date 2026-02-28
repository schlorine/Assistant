<script setup lang="ts">
import { ref, onMounted } from 'vue'

const show = ref(true)
const username = 'schlorine'

onMounted(() => {
  // 总闸门定在 2.5 秒，加上 0.4 秒的离场过渡，整体控制在 3 秒内
  setTimeout(() => {
    show.value = false
  }, 2500)
})
</script>

<template>
  <Transition name="fade-scale">
    <div class="intro-overlay" v-if="show">
      <div class="intro-content">
        <div class="tech-line top-line"></div>

        <div class="text-group">
          <div class="status-text">SYSTEM ONLINE // TERMINAL CONNECTED</div>
          
          <h1 class="greeting">
            <span class="prefix">Welcome back,</span>
            <span class="user">{{ username }}</span>
            <span class="cursor">_</span>
          </h1>
        </div>

        <div class="progress-container">
          <div class="progress-bar"></div>
        </div>
        <div class="tech-line bottom-line"></div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.intro-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #c7e5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  font-family: 'Courier New', Courier, monospace, system-ui;
}

.intro-content {
  position: relative;
  width: 80%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tech-line {
  height: 1px;
  background-color: #3b82f6;
  width: 0;
  opacity: 0.6;
}
/* 线条展开速度加快到 0.6 秒 */
.top-line { animation: expandLine 0.6s cubic-bezier(0.8, 0, 0.2, 1) forwards; }
.bottom-line { animation: expandLine 0.6s cubic-bezier(0.8, 0, 0.2, 1) 0.1s forwards; }

@keyframes expandLine {
  0% { width: 0; }
  100% { width: 100%; }
}

/* 文字组出现时机大幅提前到 0.4 秒 */
.text-group {
  opacity: 0;
  animation: snapIn 0.1s ease-out 0.4s forwards;
  padding: 10px 0;
}

@keyframes snapIn {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.status-text {
  font-size: 0.8rem;
  color: #6b7280;
  letter-spacing: 2px;
  margin-bottom: 8px;
  animation: glitch 2s linear infinite;
}

@keyframes glitch {
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  94% { opacity: 0.4; }
  96% { opacity: 1; }
  98% { opacity: 0.4; }
}

.greeting {
  margin: 0;
  color: #ffffff;
  font-size: 2.2rem;
  font-weight: normal;
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.prefix { color: #9ca3af; font-size: 1.5rem; }
.user { color: #3b82f6; font-weight: bold; font-family: system-ui, sans-serif; letter-spacing: 1px; }

.cursor {
  color: #3b82f6;
  animation: blink 1s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }

.progress-container {
  height: 2px;
  background-color: #1f2937;
  width: 100%;
  position: relative;
  overflow: hidden;
  margin-top: 20px;
}

/* 进度条动画缩短至 1 秒，抹掉大停顿 */
.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #ffffff;
  width: 0%;
  animation: loadProgress 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
}

@keyframes loadProgress {
  0% { width: 0%; }
  50% { width: 60%; } /* 平滑过渡，不硬卡 */
  100% { width: 100%; }
}

/* 离场动画稍微调快到 0.4 秒 */
.fade-scale-leave-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-scale-leave-to { opacity: 0; transform: scale(1.05); }
</style>