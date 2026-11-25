<script setup lang="ts">
import type { ArticleItem, PublicAuthor } from '~/types/news'

const route = useRoute()
const username = computed(() => String(route.params.username || ''))

const { data, error } = await useFetch<{ author: PublicAuthor; articles: ArticleItem[] }>(
  () => `/api/authors/${encodeURIComponent(username.value)}`,
  { key: () => `author-${username.value}` }
)

const author = computed(() => data.value?.author ?? null)
const articles = computed(() => data.value?.articles ?? [])

useHead(() => ({
  title: author.value ? `${author.value.name} | كتّاب شو صار` : 'صفحة الكاتب | شو صار'
}))
</script>

<template>
  <div>
    <div v-if="error || !author" class="glass-section-banner crystal-glass">
      <div>
        <h1>الكاتب غير موجود</h1>
        <p>تعذر العثور على ملف هذا الكاتب.</p>
      </div>
      <NuxtLink to="/" class="btn-primary-red">العودة إلى الرئيسية</NuxtLink>
    </div>

    <template v-else>
      <section class="author-bio-card crystal-glass" style="margin-top: 0; margin-bottom: 28px; border-radius: var(--radius-lg);">
        <img
          :src="author.avatarUrl || 'https://ui-avatars.com/api/?name=ShouSar&background=008751&color=fff'"
          :alt="author.name"
          class="author-bio-photo"
          style="width: 92px; height: 92px;"
        />
        <div class="author-bio-details" style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px;">
            <h1 style="font-size: 1.6rem; font-weight: 900; color: #fff;">{{ author.name }}</h1>
            <span class="status-badge status-published">
              {{ author.roleTitle || 'كاتب ومساهم' }}
            </span>
          </div>
          <p style="margin-bottom: 8px;">{{ author.bio || 'كاتب ومساهم في منصة شو صار الإخبارية.' }}</p>
          <span style="font-size: 0.82rem; color: var(--text-muted);">
            @{{ author.username }} • {{ articles.length }} مقال منشور
          </span>
        </div>
      </section>

      <h2 class="section-headline">مقالات {{ author.name }}</h2>

      <section v-if="articles.length" class="bottom-cards-row">
        <NewsCard v-for="story in articles" :key="story.id" :article="story" />
      </section>

      <div v-else class="glass-section-banner crystal-glass">
        <p>لم ينشر هذا الكاتب أي مقالات بعد.</p>
      </div>
    </template>
  </div>
</template>
