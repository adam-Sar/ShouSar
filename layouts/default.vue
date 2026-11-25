<script setup lang="ts">
const route = useRoute()
const isCompactLogo = computed(() => route.path !== '/')
</script>

<template>
  <div>
    <div class="fixed-backdrop" aria-hidden="true" />
    <TopUtilityBar />
    <FloatingLogoHeader :compact="isCompactLogo" />
    <StickyGlassNav />

    <main class="main-wrapper">
      <slot />
    </main>

    <GlassFooter />
    <GlassToast />
  </div>
</template>
