<script setup lang="ts">
import type { ArticleItem, LiveUpdateItem, PaginationMeta } from '~/types/news'

const { user } = useAuth()
const page = ref(1)

const [{ data: articleData }, { data: liveData }] = await Promise.all([
  useFetch<{ articles: ArticleItem[]; pagination: PaginationMeta }>(
    () => `/api/articles?page=${page.value}&limit=7`,
    { key: () => `home-articles-p${page.value}`, watch: [page] }
  ),
  useFetch<{ updates: LiveUpdateItem[] }>('/api/live?limit=12', { key: 'home-live' })
])

const articles = computed(() => articleData.value?.articles ?? [])
const pagination = computed(() => articleData.value?.pagination ?? null)
const updates = computed(() => liveData.value?.updates ?? [])

const leadStory = computed(() =>
  page.value === 1 ? articles.value.find((a) => a.isFeatured) ?? articles.value[0] ?? null : null
)
const secondaryStories = computed(() =>
  page.value === 1
    ? articles.value.filter((a) => a.id !== leadStory.value?.id)
    : articles.value
)
const breakingArticles = computed(() => {
  const breaking = articles.value.filter((a) => a.isBreaking)
  return breaking.length > 0 ? breaking : articles.value.slice(0, 3)
})
</script>

<template>
  <div>
    <BreakingTicker :articles="breakingArticles" />

    <div v-if="page === 1" class="top-news-grid">
      <section>
        <LeadStoryCard v-if="leadStory" :article="leadStory" />
      </section>

      <aside class="side-column">
        <TimelineFeed :updates="updates" />
        <OpinionCard />
      </aside>
    </div>

    <section v-if="secondaryStories.length" class="bottom-cards-row">
      <NewsCard v-for="story in secondaryStories" :key="story.id" :article="story" />
    </section>

    <div v-if="pagination && pagination.totalPages > 1" class="pagination-bar">
      <button
        type="button"
        class="glass-action-btn"
        :disabled="page <= 1"
        @click="page--"
      >
        الصفحة السابقة
      </button>
      <span style="font-size: 0.88rem; color: var(--text-secondary);">
        صفحة {{ pagination.page }} من {{ pagination.totalPages }}
      </span>
      <button
        type="button"
        class="glass-action-btn"
        :disabled="!pagination.hasMore"
        @click="page++"
      >
        الصفحة التالية
      </button>
    </div>

    <section class="glass-section-banner crystal-glass" style="margin-top: 32px;">
      <div>
        <h2 style="font-size: 1.35rem; font-weight: 900; color: #fff; margin-bottom: 4px;">
          عندك خبر أو تحليل؟ شارك صوتك على شو صار
        </h2>
        <p>سجّل حسابك مجاناً وانشر مقالاتك وتغطياتك مباشرة أمام القراء.</p>
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <NuxtLink :to="user ? '/studio/editor' : '/register'" class="btn-primary-green">
          {{ user ? 'اكتب مقالاً جديداً' : 'ابدأ النشر الآن' }}
        </NuxtLink>
        <NuxtLink v-if="user" to="/studio" class="glass-action-btn">
          إدارة مقالاتي
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
