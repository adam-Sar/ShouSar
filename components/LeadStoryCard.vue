<script setup lang="ts">
import type { ArticleItem } from '~/types/news'
import { formatRelativeArabic } from '~/utils/formatDate'

defineProps<{
  article: ArticleItem
}>()
</script>

<template>
  <article class="lead-glass-card crystal-glass crystal-interactive">
    <div class="lead-media">
      <span class="lead-flag-tag">{{ article.category.nameAr }}</span>
      <NuxtLink :to="`/articles/${article.slug}`">
        <img :src="article.heroImage" :alt="article.title" decoding="async" />
      </NuxtLink>
    </div>

    <div class="lead-glass-body">
      <div class="lead-meta">
        <span class="cedar-highlight">{{ article.isFeatured ? 'تغطية خاصة' : article.category.nameAr }}</span>
        <span>•</span>
        <span>{{ formatRelativeArabic(article.publishedAt) }}</span>
        <span>•</span>
        <NuxtLink :to="`/author/${article.author.username}`">
          بقلم: {{ article.author.name }}
        </NuxtLink>
      </div>

      <h1 class="lead-heading">
        <NuxtLink :to="`/articles/${article.slug}`">
          {{ article.title }}
        </NuxtLink>
      </h1>

      <p class="lead-desc">
        {{ article.lead }}
      </p>
    </div>
  </article>
</template>
