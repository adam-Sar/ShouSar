<script setup lang="ts">
import type { ArticleItem, CategoryItem, PaginationMeta } from '~/types/news'

useHead({ title: 'البحث والأرشيف | شو صار' })

const route = useRoute()
const router = useRouter()

const q = ref(typeof route.query.q === 'string' ? route.query.q : '')
const tag = ref(typeof route.query.tag === 'string' ? route.query.tag : '')
const selectedCategory = ref(typeof route.query.category === 'string' ? route.query.category : '')
const page = ref(1)

const { data: catData } = await useFetch<{ categories: CategoryItem[] }>('/api/categories', {
  key: 'search-categories'
})
const categories = computed(() => catData.value?.categories ?? [])

const apiUrl = computed(() => {
  const params = new URLSearchParams()
  if (q.value.trim()) params.set('q', q.value.trim())
  if (tag.value.trim()) params.set('tag', tag.value.trim())
  if (selectedCategory.value) params.set('category', selectedCategory.value)
  params.set('page', String(page.value))
  params.set('limit', '12')
  return `/api/articles?${params.toString()}`
})

const { data, pending } = await useFetch<{ articles: ArticleItem[]; pagination: PaginationMeta }>(apiUrl, {
  watch: [apiUrl]
})

const results = computed(() => data.value?.articles ?? [])
const pagination = computed(() => data.value?.pagination ?? null)

function applySearch() {
  page.value = 1
  const query: Record<string, string> = {}
  if (q.value.trim()) query.q = q.value.trim()
  if (tag.value.trim()) query.tag = tag.value.trim()
  if (selectedCategory.value) query.category = selectedCategory.value
  router.replace({ query })
}

function selectCategory(slug: string) {
  selectedCategory.value = selectedCategory.value === slug ? '' : slug
  applySearch()
}

function clearFilters() {
  q.value = ''
  tag.value = ''
  selectedCategory.value = ''
  page.value = 1
  router.replace({ query: {} })
}
</script>

<template>
  <div>
    <section class="studio-container crystal-glass" style="margin-bottom: 26px;">
      <h1 style="font-size: 1.8rem; font-weight: 900; margin-bottom: 14px;">البحث في أرشيف شو صار</h1>

      <form class="glass-form" style="margin-bottom: 16px;" @submit.prevent="applySearch">
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <input
            v-model="q"
            type="search"
            class="glass-input"
            style="flex: 1; min-width: 240px;"
            placeholder="ابحث عن عنوان، كلمة مفتاحية، أو موضوع..."
          />
          <button type="submit" class="btn-primary-red">بحث</button>
          <button
            v-if="q || tag || selectedCategory"
            type="button"
            class="glass-action-btn"
            @click="clearFilters"
          >
            مسح الفلاتر
          </button>
        </div>
      </form>

      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <span style="font-size: 0.85rem; color: var(--text-muted);">التصنيف:</span>
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="glass-action-btn"
          :style="selectedCategory === cat.slug ? 'background: var(--lb-red); border-color: var(--lb-red);' : ''"
          @click="selectCategory(cat.slug)"
        >
          {{ cat.nameAr }}
        </button>
        <span v-if="tag" class="article-tag-pill" style="border-color: #38ef7d; color: #38ef7d;">
          وسم: #{{ tag }}
        </span>
      </div>
    </section>

    <div v-if="pending" class="glass-section-banner crystal-glass">
      <p>جارٍ البحث في المقالات...</p>
    </div>

    <template v-else-if="results.length">
      <section class="bottom-cards-row">
        <NewsCard v-for="item in results" :key="item.id" :article="item" />
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
        <h2 style="font-size: 1.2rem; font-weight: 800;">لا توجد نتائج مطابقة</h2>
        <p>جرّب البحث بكلمات مختلفة أو إزالة بعض الفلاتر.</p>
      </div>
    </div>
  </div>
</template>
