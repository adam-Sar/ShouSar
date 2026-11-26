<script setup lang="ts">
import type { LiveUpdateItem } from '~/types/news'

useHead({ title: 'البث المباشر والتغطية اللحظية | شو صار' })

const { isStaff } = useAuth()
const { showToast } = useToast()

const { data, refresh } = await useFetch<{ updates: LiveUpdateItem[] }>('/api/live?limit=40', {
  key: 'live-room-feed'
})

const updates = ref<LiveUpdateItem[]>(data.value?.updates ?? [])

watch(data, (val) => {
  if (val?.updates) updates.value = val.updates
})

const newTitle = ref('')
const newSummary = ref('')
const isUrgent = ref(false)
const submitting = ref(false)
const postError = ref('')
const streamConnected = ref(false)

let eventSource: EventSource | null = null

onMounted(() => {
  if (typeof EventSource !== 'undefined') {
    eventSource = new EventSource('/api/live/stream')
    eventSource.onopen = () => {
      streamConnected.value = true
    }
    eventSource.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        if (msg.type === 'created' && msg.update) {
          if (!updates.value.some((u) => u.id === msg.update.id)) {
            updates.value = [msg.update, ...updates.value]
          }
        } else if (msg.type === 'deleted' && msg.id) {
          updates.value = updates.value.filter((u) => u.id !== msg.id)
        }
      } catch {
        // ignore heartbeat / malformed message
      }
    }
    eventSource.onerror = () => {
      streamConnected.value = false
    }
  }
})

onUnmounted(() => {
  eventSource?.close()
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

async function deleteLiveUpdate(id: string) {
  try {
    await $fetch(`/api/live/${encodeURIComponent(id)}`, { method: 'DELETE' })
    updates.value = updates.value.filter((u) => u.id !== id)
    showToast('تم حذف التحديث')
  } catch {
    showToast('تعذر حذف التحديث')
  }
}
</script>

<template>
  <div>
    <section class="glass-section-banner crystal-glass">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <span class="urgent-badge">مباشر</span>
          <span style="font-size: 0.82rem; color: var(--text-muted);">
            {{ streamConnected ? 'متصل بالبث الفوري (SSE)' : 'تحديث تلقائي' }}
          </span>
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

    <TimelineFeed
      :updates="updates"
      title="التسلسل الزمني المباشر"
      :expanded="true"
      :can-delete="isStaff"
      @delete="deleteLiveUpdate"
    />
  </div>
</template>
