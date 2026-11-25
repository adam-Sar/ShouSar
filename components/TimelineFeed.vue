<script setup lang="ts">
import type { LiveUpdateItem } from '~/types/news'
import { formatRelativeArabic } from '~/utils/formatDate'

withDefaults(
  defineProps<{
    updates: LiveUpdateItem[]
    title?: string
    expanded?: boolean
  }>(),
  {
    title: 'آخر الأخبار والتحديثات',
    expanded: false
  }
)
</script>

<template>
  <div class="side-card crystal-glass timeline-widget">
    <h2 class="side-card-title">
      <span>{{ title }}</span>
      <NuxtLink
        v-if="!expanded"
        to="/live"
        style="font-size: 0.78rem; color: #ff8a93; text-decoration: none; font-weight: 700;"
      >
        البث الكامل
      </NuxtLink>
    </h2>

    <div class="timeline-scroll-container" :class="{ 'timeline-expanded': expanded }">
      <div class="timeline-track">
        <div v-for="item in updates" :key="item.id" class="timeline-node">
          <span class="timeline-dot" :class="{ 'urgent-dot': item.isUrgent }" />
          <div class="timeline-content">
            <NuxtLink
              v-if="item.linkSlug"
              :to="`/articles/${item.linkSlug}`"
              class="timeline-link"
            >
              {{ item.title }}
            </NuxtLink>
            <span v-else class="timeline-link">{{ item.title }}</span>

            <p
              v-if="expanded && item.summary"
              style="font-size: 0.86rem; color: var(--text-muted); margin-top: 2px;"
            >
              {{ item.summary }}
            </p>
            <span class="timeline-time">{{ formatRelativeArabic(item.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
