<script setup lang="ts">
import type { LiveUpdateItem } from '~/types/news'
import { formatRelativeArabic } from '~/utils/formatDate'

const props = withDefaults(
  defineProps<{
    updates: LiveUpdateItem[]
    title?: string
    expanded?: boolean
    canDelete?: boolean
  }>(),
  {
    title: 'آخر الأخبار والتحديثات',
    expanded: false,
    canDelete: false
  }
)

const emit = defineEmits<{
  delete: [id: string]
}>()
</script>

<template>
  <div class="side-card crystal-glass timeline-widget">
    <h2 class="side-card-title">
      <span>{{ props.title }}</span>
      <NuxtLink
        v-if="!props.expanded"
        to="/live"
        style="font-size: 0.78rem; color: #ff8a93; text-decoration: none; font-weight: 700;"
      >
        البث الكامل
      </NuxtLink>
    </h2>

    <div class="timeline-scroll-container" :class="{ 'timeline-expanded': props.expanded }">
      <div class="timeline-track">
        <div v-for="item in props.updates" :key="item.id" class="timeline-node">
          <span class="timeline-dot" :class="{ 'urgent-dot': item.isUrgent }" />
          <div class="timeline-content">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <NuxtLink
                v-if="item.linkSlug"
                :to="`/articles/${item.linkSlug}`"
                class="timeline-link"
              >
                {{ item.title }}
              </NuxtLink>
              <span v-else class="timeline-link">{{ item.title }}</span>

              <button
                v-if="props.canDelete"
                type="button"
                class="top-bar-btn-logout"
                style="flex-shrink: 0;"
                @click="emit('delete', item.id)"
              >
                حذف
              </button>
            </div>

            <p
              v-if="props.expanded && item.summary"
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
