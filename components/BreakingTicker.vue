<script setup lang="ts">
import type { ArticleItem } from '~/types/news'

const props = defineProps<{
  articles: ArticleItem[]
}>()

const activeIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const currentItem = computed(() => props.articles[activeIndex.value] ?? null)

onMounted(() => {
  if (props.articles.length > 1) {
    timer = setInterval(() => {
      activeIndex.value = (activeIndex.value + 1) % props.articles.length
    }, 6000)
  }
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div v-if="currentItem" class="glass-ticker crystal-glass crystal-interactive">
    <span class="ticker-badge">شريط الأخبار</span>
    <NuxtLink :to="`/articles/${currentItem.slug}`" class="ticker-text">
      {{ currentItem.title }}
    </NuxtLink>
  </div>
</template>
