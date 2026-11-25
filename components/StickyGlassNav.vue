<script setup lang="ts">
import type { CategoryItem } from '~/types/news'

const { user } = useAuth()
const { data } = await useFetch<{ categories: CategoryItem[] }>('/api/categories', {
  key: 'nav-categories'
})

const categories = computed(() => data.value?.categories ?? [])
</script>

<template>
  <nav class="sticky-navbar" aria-label="التنقل الرئيسي">
    <div class="navbar-glass">
      <ul class="nav-menu">
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
  </nav>
</template>
