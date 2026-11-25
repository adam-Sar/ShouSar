<script setup lang="ts">
useHead({ title: 'تسجيل الدخول | شو صار' })

const { login } = useAuth()
const { showToast } = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

function fillDemo(type: 'admin' | 'writer') {
  if (type === 'admin') {
    email.value = 'admin@shousar.lb'
    password.value = 'ShouSarAdmin2026!'
  } else {
    email.value = 'fouad@shousar.lb'
    password.value = 'ShouSarWriter2026!'
  }
}

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    showToast('أهلاً بعودتك إلى شو صار')
    await navigateTo('/studio')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'تعذر تسجيل الدخول'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container crystal-glass">
    <h1 style="font-size: 1.75rem; font-weight: 900; margin-bottom: 6px; text-align: center;">
      تسجيل الدخول
    </h1>
    <p style="color: var(--text-muted); font-size: 0.92rem; text-align: center; margin-bottom: 24px;">
      ادخل إلى حسابك لكتابة المقالات وإدارتها والتفاعل مع الأخبار
    </p>

    <form class="glass-form" @submit.prevent="handleLogin">
      <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>

      <div class="form-group">
        <label class="form-label" for="login-email">البريد الإلكتروني</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          class="glass-input"
          placeholder="name@example.com"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="login-pass">كلمة المرور</label>
        <input
          id="login-pass"
          v-model="password"
          type="password"
          class="glass-input"
          placeholder="••••••••"
          required
        />
      </div>

      <button type="submit" class="btn-primary-red" :disabled="loading">
        {{ loading ? 'جارٍ التحقق...' : 'دخول إلى الاستوديو' }}
      </button>
    </form>

    <div style="margin-top: 22px; padding-top: 18px; border-top: 1px dashed rgba(255,255,255,0.18);">
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 10px;">
        حسابات جاهزة للتجربة السريعة:
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button type="button" class="glass-action-btn" @click="fillDemo('admin')">
          تعبئة حساب رئيس التحرير (Admin)
        </button>
        <button type="button" class="glass-action-btn" @click="fillDemo('writer')">
          تعبئة حساب كاتب (د. فؤاد)
        </button>
      </div>
    </div>

    <p style="text-align: center; margin-top: 22px; font-size: 0.9rem; color: var(--text-secondary);">
      ليس لديك حساب؟
      <NuxtLink to="/register" style="color: #38ef7d; font-weight: 800; text-decoration: none;">
        أنشئ حساباً الآن
      </NuxtLink>
    </p>
  </div>
</template>
