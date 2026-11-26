<script setup lang="ts">
import type { ArticleItem, CategoryItem, PaginationMeta } from '~/types/news'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const page = ref(1)

watch(slug, () => {
  page.value = 1
})

const [{ data: categoriesData }, { data: articlesData }] = await Promise.all([
  useFetch<{ categories: CategoryItem[] }>('/api/categories', { key: 'cat-hub-list' }),
  useFetch<{ articles: ArticleItem[]; pagination: PaginationMeta }>(
    () => `/api/articles?category=${encodeURIComponent(slug.value)}&page=${page.value}&limit=10`,
    { key: () => `cat-articles-${slug.value}-p${page.value}`, watch: [slug, page] }
  )
])

const currentCategory = computed(() =>
  categoriesData.value?.categories.find((c) => c.slug === slug.value) ?? null
)
const articles = computed(() => articlesData.value?.articles ?? [])
const pagination = computed(() => articlesData.value?.pagination ?? null)
const leadArticle = computed(() => (page.value === 1 ? articles.value[0] ?? null : null))
const remainingArticles = computed(() => (page.value === 1 ? articles.value.slice(1) : articles.value))

useHead(() => ({
  title: currentCategory.value ? `${currentCategory.value.nameAr} | شو صار` : 'القسم | شو صار'
}))
</script>

<template>
  <div>
    <section class="glass-section-banner crystal-glass">
      <div>
        <h1>{{ currentCategory ? currentCategory.nameAr : 'قسم الأخبار' }}</h1>
        <p>أحدث الأخبار والتقارير المنشورة في هذا القسم ({{ pagination?.total ?? articles.length }} مقال)</p>
      </div>
      <NuxtLink to="/studio/editor" class="btn-primary-green">
        انشر في هذا القسم
      </NuxtLink>
    </section>

    <template v-if="articles.length">
      <div v-if="leadArticle" style="margin-bottom: 26px;">
        <LeadStoryCard :article="leadArticle" />
      </div>

      <section v-if="remainingArticles.length" class="bottom-cards-row">
        <NewsCard v-for="story in remainingArticles" :key="story.id" :article="story" />
      </section>

      <div v-if="pagination && pagination.totalPages > 1" class="pagination-bar">
        <button type="button" class="glass-action-btn" :disabled="page <= 1" @click="page--">
          السابق
        </button>
        <span style="font-size: 0.88rem; color: var(--text-secondary);">
          صفحة {{ pagination.page }} من {{ pagination.totalPages }}
        </span>
        <button type="button" class="glass-action-btn" :disabled="!pagination.hasMore" @click="page++">
          التالي
        </button>
      </div>
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
