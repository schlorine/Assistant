<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const isLoginMode = ref(true)
const username = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleSubmit = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    if (isLoginMode.value) {
      if (!username.value || !password.value) throw new Error('请填写账号/邮箱和密码')
      // 登录：把第一个框的内容（账号或邮箱均可）传过去
      await userStore.signIn(username.value.trim(), password.value)
      router.push('/') // 登录成功直接切入主应用
    } else {
      if (!username.value || !email.value || !password.value) throw new Error('请完整填写注册信息')
      if (username.value.includes('@')) throw new Error('账号名不能包含 @ 符号')
      
      await userStore.signUp(username.value.trim(), email.value.trim(), password.value)
      successMessage.value = '注册成功！即将进入系统...'
      setTimeout(() => router.push('/'), 1000)
    }
  } catch (error: any) {
    errorMessage.value = error.message || '操作失败，请重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="auth-card">
      <div class="auth-header">
        <h2 class="auth-title">私人助理</h2>
        <p class="auth-subtitle">
          {{ isLoginMode ? '欢迎回来，请输入您的账号或邮箱' : '创建云端账号，开启极简数据同步' }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <template v-if="!isLoginMode">
          <div class="input-group-vertical">
            <label>专属账号名</label>
            <input type="text" v-model="username" placeholder="设置一个好记的名称 (如 admin)" required class="auth-input" />
          </div>
          <div class="input-group-vertical">
            <label>绑定的邮箱</label>
            <input type="email" v-model="email" placeholder="真实邮箱可用于找回密码" required class="auth-input" />
          </div>
        </template>

        <template v-else>
          <div class="input-group-vertical">
            <label>账号名 / 邮箱</label>
            <input type="text" v-model="username" placeholder="输入您的账号名或邮箱地址" required class="auth-input" />
          </div>
        </template>
        
        <div class="input-group-vertical">
          <label>密码</label>
          <input type="password" v-model="password" placeholder="至少 6 位密码" required minlength="6" class="auth-input" />
        </div>

        <div v-if="errorMessage" class="msg-box error-msg">{{ errorMessage }}</div>
        <div v-if="successMessage" class="msg-box success-msg">{{ successMessage }}</div>

        <button type="submit" class="action-btn auth-submit-btn" :disabled="isLoading">
          {{ isLoading ? '处理中...' : (isLoginMode ? '立即登录' : '创建账号') }}
        </button>
      </form>

      <div class="auth-switch">
        <span class="switch-text" @click="isLoginMode = !isLoginMode; errorMessage = ''; successMessage = ''; username = ''; email = ''; password = ''">
          {{ isLoginMode ? '还没账号？点击这里注册' : '已有账号？点击这里登录' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 20px; box-sizing: border-box; }
.auth-card { width: 100%; max-width: 420px; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
.auth-header { text-align: center; margin-bottom: 32px; }
.auth-title { margin: 0 0 8px 0; font-size: 1.8rem; color: #111827; letter-spacing: 2px; }
.auth-subtitle { margin: 0; color: #6b7280; font-size: 0.95rem; }

.auth-form { display: flex; flex-direction: column; gap: 20px; }
.input-group-vertical { display: flex; flex-direction: column; gap: 8px; }
.input-group-vertical label { font-size: 0.875rem; color: #374151; font-weight: 600; }
.auth-input { padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; outline: none; transition: all 0.2s; background: #f9fafb; }
.auth-input:focus { border-color: #3b82f6; background: #ffffff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }

.auth-submit-btn { margin-top: 8px; padding: 14px; font-size: 1.1rem; border-radius: 8px; width: 100%; background: #3b82f6; color: white; border: none; cursor: pointer; transition: background 0.2s; font-weight: bold; }
.auth-submit-btn:hover:not(:disabled) { background: #2563eb; }
.auth-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.msg-box { padding: 12px; border-radius: 8px; font-size: 0.9rem; text-align: center; }
.error-msg { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.success-msg { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

.auth-switch { margin-top: 32px; text-align: center; }
.switch-text { color: #6b7280; font-size: 0.95rem; cursor: pointer; transition: color 0.2s; }
.switch-text:hover { color: #3b82f6; text-decoration: underline; }
</style>