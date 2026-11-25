<script setup lang="ts">
import type { LiveUpdateItem } from '~/types/news'

useHead({ title: 'البث المباشر والتغطية اللحظية | شو صار' })

const { isStaff } = useAuth()
const { showToast } = useToast()

const { data, refresh } = await useFetch<{ updates: LiveUpdateItem[] }>('/api/live?limit=40', {
  key: 'live-room-feed'
})

const updates = computed(() => data.value?.updates ?? [])

const newTitle = ref('')
const newSummary = ref('')
const isUrgent = ref(false)
const submitting = ref(false)
const postError = ref('')

let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  pollTimer = setInterval(() => {
    refresh()
  }, 30000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

async function publishLiveFlash() {
  postError.value = ''
  submitting.value = true
  try {
    await $fetch('/api/live', {
      method: 'POST',
      body: {
        title: newTitle.value,
        summary: newSummary.value,
        isUrgent: isUrgent.value
      }
    })
    newTitle.value = ''
    newSummary.value = ''
    isUrgent.value = false
    showToast('تم بث التحديث العاجل')
    await refresh()
  } catch (err: any) {
    postError.value = err?.data?.statusMessage || 'تعذر نشر التحديث'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <section class="glass-section-banner crystal-glass">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <span class="urgent-badge">مباشر</span>
          <span style="font-size: 0.82rem; color: var(--text-muted);">يتحدث تلقائياً كل 30 ثانية</span>
        </div>
        <h1>غرفة الأخبار والتغطية اللحظية</h1>
        <p>متابعة متسلسلة للأنباء العاجلة والتطورات الميدانية والاقتصادية فور ورودها.</p>
      </div>
      <button type="button" class="glass-action-btn" @click="refresh()">
        تحديث الآن
      </button>
    </section>

    <div v-if="isStaff" class="studio-container crystal-glass" style="margin-bottom: 24px;">
      <h2 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 14px;">إرسال تحديث مباشر للخط الزمني</h2>
      <form class="glass-form" @submit.prevent="publishLiveFlash">
        <div v-if="postError" class="form-error">{{ postError }}</div>
        <div class="form-group">
          <input
            v-model="newTitle"
            type="text"
            class="glass-input"
            placeholder="عنوان الخبر العاجل أو التحديث..."
            required
          />
        </div>
        <div class="form-group">
          <input
            v-model="newSummary"
            type="text"
            class="glass-input"
            placeholder="تفاصيل مختصرة (اختياري)"
          />
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem;">
            <input v-model="isUrgent" type="checkbox" />
            <span>تمييز كنقطة عاجلة (لون أحمر)</span>
          </label>
          <button type="submit" class="btn-primary-red" :disabled="submitting">
            {{ submitting ? 'جارٍ البث...' : 'بث التحديث' }}
          </button>
        </div>
      </form>
    </div>

    <TimelineFeed :updates="updates" title="التسلسل الزمني المباشر" :expanded="true" />
  </div>
</template>
