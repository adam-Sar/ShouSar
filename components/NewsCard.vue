<script setup lang="ts">
import type { ArticleItem } from '~/types/news'
import { formatRelativeArabic } from '~/utils/formatDate'

defineProps<{
  article: ArticleItem
}>()
</script>

<template>
  <article class="bottom-news-card crystal-glass crystal-interactive">
    <div class="bottom-card-thumb">
      <NuxtLink :to="`/articles/${article.slug}`">
        <img :src="article.heroImage" :alt="article.title" />
      </NuxtLink>
    </div>

    <div class="bottom-card-body">
      <span class="card-topic" :class="{ 'red-topic': article.category.accent === 'red' }">
        {{ article.category.nameAr }}
      </span>

      <h3 class="bottom-card-title">
        <NuxtLink :to="`/articles/${article.slug}`">
          {{ article.title }}
        </NuxtLink>
      </h3>

      <div class="bottom-card-meta">
        <span>{{ formatRelativeArabic(article.publishedAt) }} • قراءة {{ article.readTimeMinutes }} د</span>
        <NuxtLink :to="`/author/${article.author.username}`">
          {{ article.author.name }}
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
