<script setup lang="ts">
import type { ArticleItem } from '~/types/news'

const { data } = await useFetch<{ articles: ArticleItem[] }>('/api/articles?limit=10', {
  key: 'opinion-spotlight'
})

const spotlight = computed(() => {
  const list = data.value?.articles ?? []
  return list.find((a) => a.pullQuote) ?? list[0] ?? null
})
</script>

<template>
  <div v-if="spotlight" class="side-card crystal-glass opinion-glass crystal-interactive">
    <span class="opinion-tag">افتتاحية شو صار</span>
    <NuxtLink :to="`/articles/${spotlight.slug}`" style="text-decoration: none; display: block;">
      <p class="opinion-text">
        "{{ spotlight.pullQuote || spotlight.lead }}"
      </p>
    </NuxtLink>
    <NuxtLink :to="`/author/${spotlight.author.username}`" class="opinion-by" style="text-decoration: none;">
      {{ spotlight.author.name }}
    </NuxtLink>
  </div>
</template>
