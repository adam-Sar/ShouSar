<script setup lang="ts">
const { user, logout } = useAuth()
const liveDate = ref('شو صار الآن')

onMounted(() => {
  const update = () => {
    liveDate.value = new Date().toLocaleDateString('ar-LB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  update()
})
</script>

<template>
  <header class="top-bar">
    <div class="top-bar-right">
      <span class="urgent-badge">عاجل</span>
      <span>شو صار • منصة إخبارية لبنانية مفتوحة للخبر والتحليل لحظة بلحظة</span>
    </div>

    <div class="top-bar-left">
      <span>بيروت 24°C • صحو</span>
      <span>|</span>
      <span>USD/LBP: 89,500</span>
      <span>|</span>
      <span>{{ liveDate }}</span>

      <template v-if="user">
        <NuxtLink to="/studio" class="top-bar-link">
          لوحة الكاتب ({{ user.name }})
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
