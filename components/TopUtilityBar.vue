<script setup lang="ts">
const { user, logout } = useAuth()
const liveDate = ref('شو صار الآن')

const { data: pulse } = useLazyFetch<{
  weather: { city: string; temp: number; label: string }
  usdRate: string
}>('/api/meta/pulse', { key: 'top-pulse', server: false })

onMounted(() => {
  liveDate.value = new Date().toLocaleDateString('ar-LB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})
</script>

<template>
  <header class="top-bar">
    <div class="top-bar-right">
      <span class="urgent-badge">عاجل</span>
      <span>شو صار • منصة إخبارية لبنانية مفتوحة للخبر والتحليل لحظة بلحظة</span>
    </div>

    <div class="top-bar-left">
      <span>
        {{ pulse?.weather.city || 'بيروت' }} {{ pulse?.weather.temp ?? 24 }}°C • {{ pulse?.weather.label || 'صحو' }}
      </span>
      <span>|</span>
      <span>USD/LBP: {{ pulse?.usdRate || '89,500' }}</span>
      <span>|</span>
      <span>{{ liveDate }}</span>

      <template v-if="user">
        <NuxtLink to="/studio" class="top-bar-link">
          لوحة الكاتب ({{ user.name }})
        </NuxtLink>
        <NuxtLink to="/studio/profile" class="top-bar-link">
          حسابي
        </NuxtLink>
        <button type="button" class="top-bar-btn-logout" @click="logout">
          خروج
        </button>
      </template>
      <template v-else>
        <NuxtLink to="/login" class="top-bar-link">تسجيل الدخول</NuxtLink>
        <NuxtLink to="/register" class="top-bar-link">انضم ككاتب</NuxtLink>
      </template>
    </div>
  </header>
</template>
