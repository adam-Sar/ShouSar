<script setup lang="ts">
import type { ArticleItem, CategoryItem } from '~/types/news'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const [{ data: categoriesData }, { data: articlesData }] = await Promise.all([
  useFetch<{ categories: CategoryItem[] }>('/api/categories', { key: 'cat-hub-list' }),
  useFetch<{ articles: ArticleItem[] }>(() => `/api/articles?category=${encodeURIComponent(slug.value)}&limit=24`, {
    key: () => `cat-articles-${slug.value}`
  })
])

const currentCategory = computed(() =>
  categoriesData.value?.categories.find((c) => c.slug === slug.value) ?? null
)
const articles = computed(() => articlesData.value?.articles ?? [])
const leadArticle = computed(() => articles.value[0] ?? null)
const remainingArticles = computed(() => articles.value.slice(1))

useHead(() => ({
  title: currentCategory.value ? `${currentCategory.value.nameAr} | شو صار` : 'القسم | شو صار'
}))
</script>

<template>
  <div>
    <section class="glass-section-banner crystal-glass">
      <div>
        <h1>{{ currentCategory ? currentCategory.nameAr : 'قسم الأخبار' }}</h1>
        <p>أحدث الأخبار والتقارير المنشورة في هذا القسم ({{ articles.length }} مقال)</p>
      </div>
      <NuxtLink to="/studio/editor" class="btn-primary-green">
        انشر في هذا القسم
      </NuxtLink>
    </section>

    <template v-if="articles.length">
      <div style="margin-bottom: 26px;">
        <LeadStoryCard v-if="leadArticle" :article="leadArticle" />
      </div>

      <section v-if="remainingArticles.length" class="bottom-cards-row">
        <NewsCard v-for="story in remainingArticles" :key="story.id" :article="story" />
      </section>
    </template>

    <div v-else class="glass-section-banner crystal-glass">
      <div>
        <h2 style="font-size: 1.2rem; font-weight: 800;">لا توجد مقالات منشورة هنا بعد</h2>
        <p>كن أول من يكتب وينشر خبراً في قسم {{ currentCategory?.nameAr || slug }}.</p>
      </div>
      <NuxtLink to="/studio/editor" class="btn-primary-red">كتابة مقال الآن</NuxtLink>
    </div>
  </div>
</template>
