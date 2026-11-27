<script setup lang="ts">
const { user } = useAuth()
const route = useRoute()
const mobileOpen = ref(false)

const { data } = await useCategories()

const categories = computed(() => data.value?.categories ?? [])

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  }
)
</script>

<template>
  <nav class="sticky-navbar" aria-label="التنقل الرئيسي">
    <div class="navbar-glass">
      <button
        type="button"
        class="mobile-menu-toggle"
        :aria-expanded="mobileOpen"
        aria-label="القائمة"
        @click="mobileOpen = !mobileOpen"
      >
        <span>{{ mobileOpen ? '✕' : '☰' }}</span>
        <span>الأقسام</span>
      </button>

      <ul class="nav-menu desktop-nav-menu">
        <li>
          <NuxtLink to="/" exact-active-class="active">الرئيسية</NuxtLink>
        </li>
        <li v-for="cat in categories" :key="cat.id">
          <NuxtLink :to="`/category/${cat.slug}`" active-class="active">
            {{ cat.nameAr }}
          </NuxtLink>
        </li>
      </ul>

      <div class="nav-actions">
        <NuxtLink to="/search" class="nav-icon-btn" title="بحث في الأخبار">
          بحث
        </NuxtLink>
        <NuxtLink :to="user ? '/studio/editor' : '/login'" class="publish-cta-btn">
          انشر خبراً
        </NuxtLink>
        <NuxtLink to="/live" class="live-pill">
          <span class="pulsing-dot" />
          <span>بث مباشر</span>
        </NuxtLink>
      </div>
    </div>

    <div v-if="mobileOpen" class="mobile-glass-drawer crystal-glass">
      <ul class="mobile-drawer-links">
        <li>
          <NuxtLink to="/" exact-active-class="active">الرئيسية</NuxtLink>
        </li>
        <li v-for="cat in categories" :key="cat.id">
          <NuxtLink :to="`/category/${cat.slug}`" active-class="active">
            {{ cat.nameAr }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
</template>
