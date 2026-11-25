<script setup lang="ts">
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <div class="hero-logo-section" :class="{ 'compact-header': compact }">
    <NuxtLink to="/" class="logo-wrap" title="العودة إلى الرئيسية — شو صار">
      <img src="/logo_transparent.png" alt="شو صار - ShouSar" class="logo-img" />
      <div class="logo-tagline">شو صار؟ • صوت الخبر ومرآة الواقع من بيروت والعالم</div>
    </NuxtLink>
  </div>
</template>
