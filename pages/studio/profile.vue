<script setup lang="ts">
useHead({ title: 'إعدادات الحساب والملف الشخصي | شو صار' })

const { user, fetchUser } = useAuth()
const { showToast } = useToast()

if (!user.value) {
  await navigateTo('/login')
}

const name = ref(user.value?.name || '')
const roleTitle = ref(user.value?.roleTitle || '')
const bio = ref(user.value?.bio || '')
const avatarUrl = ref(user.value?.avatarUrl || '')

const currentPassword = ref('')
const newPassword = ref('')
const uploading = ref(false)
const saving = ref(false)
const errorMsg = ref('')

async function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  errorMsg.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
    avatarUrl.value = res.url
    showToast('تم رفع الصورة الشخصية')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'فشل رفع الصورة'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function saveProfile() {
  errorMsg.value = ''
  saving.value = true
  try {
    const res = await $fetch<{ user: any }>('/api/auth/profile', {
      method: 'PATCH',
      body: {
        name: name.value,
        roleTitle: roleTitle.value,
        bio: bio.value,
        avatarUrl: avatarUrl.value,
        ...(newPassword.value
          ? { currentPassword: currentPassword.value, newPassword: newPassword.value }
          : {})
      }
    })
    user.value = res.user
    await fetchUser(true)
    currentPassword.value = ''
    newPassword.value = ''
    showToast('تم حفظ تعديلات الملف الشخصي')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'تعذر حفظ التعديلات'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="user">
    <section class="glass-section-banner crystal-glass">
      <div>
        <h1>إعدادات الحساب والملف الشخصي</h1>
        <p>تعديل بيانات الكاتب الظاهرة أسفل مقالاتك وتحديث كلمة المرور.</p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <NuxtLink :to="`/author/${user.username}`" class="glass-action-btn">عرض صفحتي العامة</NuxtLink>
        <NuxtLink to="/studio" class="glass-action-btn">العودة للاستوديو</NuxtLink>
      </div>
    </section>

    <div class="studio-container crystal-glass" style="max-width: 720px; margin: 0 auto;">
      <form class="glass-form" @submit.prevent="saveProfile">
        <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>

        <div style="display: flex; align-items: center; gap: 18px; flex-wrap: wrap;">
          <img
            :src="avatarUrl || 'https://ui-avatars.com/api/?name=ShouSar&background=008751&color=fff'"
            :alt="name"
            class="author-bio-photo"
          />
          <div style="flex: 1; min-width: 220px;">
            <label class="glass-action-btn" style="cursor: pointer;">
              <span>{{ uploading ? 'جارٍ الرفع...' : 'تغيير الصورة الشخصية' }}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style="display: none;"
                :disabled="uploading"
                @change="handleAvatarUpload"
              />
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="prof-name">الاسم الكامل</label>
          <input id="prof-name" v-model="name" type="text" class="glass-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="prof-role">الصفة التحريرية</label>
          <input id="prof-role" v-model="roleTitle" type="text" class="glass-input" />
        </div>

        <div class="form-group">
          <label class="form-label" for="prof-bio">النبذة التعريفية</label>
          <textarea id="prof-bio" v-model="bio" class="glass-textarea" style="min-height: 100px;" />
        </div>

        <div style="padding-top: 14px; border-top: 1px dashed rgba(255,255,255,0.16);">
          <h2 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 12px;">تغيير كلمة المرور (اختياري)</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
            <div class="form-group">
              <label class="form-label" for="prof-cur-pass">كلمة المرور الحالية</label>
              <input id="prof-cur-pass" v-model="currentPassword" type="password" class="glass-input" />
            </div>
            <div class="form-group">
              <label class="form-label" for="prof-new-pass">كلمة المرور الجديدة</label>
              <input id="prof-new-pass" v-model="newPassword" type="password" class="glass-input" />
            </div>
          </div>
        </div>

        <div>
          <button type="submit" class="btn-primary-green" :disabled="saving || uploading">
            {{ saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
