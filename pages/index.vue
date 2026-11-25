<script setup lang="ts">
import type { ArticleItem, LiveUpdateItem } from '~/types/news'

const { user } = useAuth()

const [{ data: articleData }, { data: liveData }] = await Promise.all([
  useFetch<{ articles: ArticleItem[] }>('/api/articles?limit=12', { key: 'home-articles' }),
  useFetch<{ updates: LiveUpdateItem[] }>('/api/live?limit=12', { key: 'home-live' })
])

const articles = computed(() => articleData.value?.articles ?? [])
const updates = computed(() => liveData.value?.updates ?? [])

const leadStory = computed(() => articles.value.find((a) => a.isFeatured) ?? articles.value[0] ?? null)
const secondaryStories = computed(() =>
  articles.value.filter((a) => a.id !== leadStory.value?.id).slice(0, 6)
)
const breakingArticles = computed(() => {
  const breaking = articles.value.filter((a) => a.isBreaking)
  return breaking.length > 0 ? breaking : articles.value.slice(0, 3)
})
</script>

<template>
  <div>
    <BreakingTicker :articles="breakingArticles" />

    <div class="top-news-grid">
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
