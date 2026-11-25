<script setup lang="ts">
useHead({ title: 'إنشاء حساب كاتب | شو صار' })

const { register } = useAuth()
const { showToast } = useToast()

const name = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const roleTitle = ref('')
const bio = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleRegister() {
  errorMsg.value = ''
  loading.value = true
  try {
    await register({
      name: name.value,
      username: username.value,
      email: email.value,
      password: password.value,
      roleTitle: roleTitle.value,
      bio: bio.value
    })
    showToast('تم إنشاء حسابك بنجاح! يمكنك النشر الآن')
    await navigateTo('/studio/editor')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'تعذر إنشاء الحساب'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container crystal-glass" style="max-width: 560px;">
    <h1 style="font-size: 1.75rem; font-weight: 900; margin-bottom: 6px; text-align: center;">
      انضم ككاتب في شو صار
    </h1>
    <p style="color: var(--text-muted); font-size: 0.92rem; text-align: center; margin-bottom: 24px;">
      تسجيل مفتوح يتيح لك نشر الأخبار والتقارير والتعليق فوراً
    </p>

    <form class="glass-form" @submit.prevent="handleRegister">
      <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>

      <div class="form-group">
        <label class="form-label" for="reg-name">الاسم الكامل</label>
        <input id="reg-name" v-model="name" type="text" class="glass-input" placeholder="مثال: كريم خوري" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="reg-user">اسم المستخدم (بالإنجليزية للرابط)</label>
        <input
          id="reg-user"
          v-model="username"
          type="text"
          dir="ltr"
          class="glass-input"
          placeholder="karim_khoury"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="reg-email">البريد الإلكتروني</label>
        <input id="reg-email" v-model="email" type="email" class="glass-input" placeholder="name@example.com" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="reg-pass">كلمة المرور (6 أحرف على الأقل)</label>
        <input id="reg-pass" v-model="password" type="password" class="glass-input" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="reg-title">الصفة التحريرية (اختياري)</label>
        <input
          id="reg-title"
          v-model="roleTitle"
          type="text"
          class="glass-input"
          placeholder="مثال: صحفي مستقل / مهتم بالشأن التكنولوجي"
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="reg-bio">نبذة مختصرة (اختياري)</label>
        <textarea
          id="reg-bio"
          v-model="bio"
          class="glass-textarea"
          style="min-height: 80px;"
          placeholder="تعريف قصير يظهر أسفل مقالاتك..."
        />
      </div>

      <button type="submit" class="btn-primary-green" :disabled="loading">
        {{ loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب والبدء بالنشر' }}
      </button>
    </form>

    <p style="text-align: center; margin-top: 20px; font-size: 0.9rem; color: var(--text-secondary);">
      لديك حساب مسبقاً؟
      <NuxtLink to="/login" style="color: #ff8a93; font-weight: 800; text-decoration: none;">
        سجّل دخولك
      </NuxtLink>
    </p>
  </div>
</template>
