<script setup lang="ts">
import type { ArticleItem, LiveUpdateItem } from '~/types/news'
import { formatFullArabic, formatRelativeArabic } from '~/utils/formatDate'
import { renderArticleBody } from '~/utils/renderArticleHtml'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const { user, isStaff } = useAuth()
const { showToast } = useToast()

const { data, error, refresh, pending } = await useLazyFetch<{
  article: ArticleItem
  related: ArticleItem[]
}>(() => `/api/articles/${encodeURIComponent(slug.value)}`, {
  watch: [slug]
})

const { data: liveData } = await useLazyFetch<{ updates: LiveUpdateItem[] }>('/api/live?limit=8', {
  key: 'article-sidebar-live'
})

const article = computed(() => data.value?.article ?? null)
const related = computed(() => data.value?.related ?? [])
const updates = computed(() => liveData.value?.updates ?? [])

const renderedBodyHtml = computed(() => {
  if (!article.value) return ''
  return renderArticleBody(
    article.value.content,
    article.value.pullQuote,
    article.value.pullQuoteAuthor
  )
})

const tagsList = computed(() =>
  (article.value?.tags || '')
    .split(',')
    .map((t) => t.trim().replace(/^#/, ''))
    .filter(Boolean)
)

useHead(() => ({
  title: article.value ? `${article.value.title} | شو صار` : 'المقال غير موجود | شو صار'
}))

useSeoMeta({
  title: () => (article.value ? `${article.value.title} | شو صار` : 'شو صار'),
  description: () => article.value?.lead || 'منصة شو صار الإخبارية',
  ogTitle: () => article.value?.title || 'شو صار',
  ogDescription: () => article.value?.lead || 'منصة شو صار الإخبارية',
  ogImage: () => article.value?.heroImage || '/lebanon_bg.jpg',
  twitterCard: 'summary_large_image'
})

const fontSize = ref(1.18)
const readingPercent = ref(0)
const commentText = ref('')
const commentError = ref('')
const postingComment = ref(false)
const reacting = ref(false)
const bookmarking = ref(false)

const reacted = ref(false)
const reactionsCount = ref(0)
const bookmarked = ref(false)

watch(
  article,
  (val) => {
    if (val) {
      reacted.value = Boolean(val.userReacted)
      reactionsCount.value = val._count?.reactions ?? 0
      bookmarked.value = Boolean(val.userBookmarked)
    }
  },
  { immediate: true }
)

function changeFontSize(delta: number) {
  fontSize.value = Math.min(1.6, Math.max(0.95, Number((fontSize.value + delta * 0.1).toFixed(2))))
}

function copyLink() {
  if (import.meta.client) {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('تم نسخ رابط المقال بنجاح')
    })
  }
}

function shareArticle() {
  if (import.meta.client && navigator.share && article.value) {
    navigator.share({ title: article.value.title, url: window.location.href }).catch(() => {})
  } else {
    copyLink()
  }
}

const whatsappUrl = computed(() => {
  if (!article.value) return '#'
  return `https://wa.me/?text=${encodeURIComponent(article.value.title)}`
})

async function toggleReaction() {
  if (!article.value) return
  if (!user.value) {
    await navigateTo('/login')
    return
  }
  reacting.value = true
  try {
    const res = await $fetch<{ reacted: boolean; count: number }>(
      `/api/articles/${encodeURIComponent(article.value.slug)}/react`,
      { method: 'POST' }
    )
    reacted.value = res.reacted
    reactionsCount.value = res.count
  } catch {
    showToast('تعذر تسجيل التفاعل')
  } finally {
    reacting.value = false
  }
}

async function toggleBookmark() {
  if (!article.value) return
  if (!user.value) {
    await navigateTo('/login')
    return
  }
  bookmarking.value = true
  try {
    const res = await $fetch<{ bookmarked: boolean }>(
      `/api/articles/${encodeURIComponent(article.value.slug)}/bookmark`,
      { method: 'POST' }
    )
    bookmarked.value = res.bookmarked
    showToast(res.bookmarked ? 'تم حفظ المقال في استوديو القراءة' : 'تمت إزالة المقال من المحفوظات')
  } catch {
    showToast('تعذر تحديث المحفوظات')
  } finally {
    bookmarking.value = false
  }
}

async function submitComment() {
  if (!article.value || !commentText.value.trim()) return
  commentError.value = ''
  postingComment.value = true
  try {
    await $fetch(`/api/articles/${encodeURIComponent(article.value.slug)}/comments`, {
      method: 'POST',
      body: { body: commentText.value }
    })
    commentText.value = ''
    showToast('تمت إضافة تعليقك')
    await refresh()
  } catch (err: any) {
    commentError.value = err?.data?.statusMessage || 'تعذر إرسال التعليق'
  } finally {
    postingComment.value = false
  }
}

async function deleteComment(id: string) {
  try {
    await $fetch(`/api/comments/${encodeURIComponent(id)}`, { method: 'DELETE' })
    showToast('تم حذف التعليق')
    await refresh()
  } catch {
    showToast('تعذر حذف التعليق')
  }
}

onMounted(() => {
  const onScroll = () => {
    const doc = document.documentElement
    const scrollTop = document.body.scrollTop || doc.scrollTop
    const total = doc.scrollHeight - doc.clientHeight
    readingPercent.value = total > 0 ? Math.min(100, (scrollTop / total) * 100) : 0
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
})
</script>

<template>
  <div>
    <div class="reading-progress-track" aria-hidden="true">
      <div class="reading-progress-bar" :style="{ width: `${readingPercent}%` }" />
    </div>

    <div v-if="pending && !article" class="glass-section-banner crystal-glass">
      <p>جارٍ تحميل المقال...</p>
    </div>

    <div v-else-if="error || !article" class="glass-section-banner crystal-glass">
      <div>
        <h1>المقال غير موجود</h1>
        <p>قد يكون الرابط غير صحيح أو تم حذف المقال من قبل الكاتب.</p>
      </div>
      <NuxtLink to="/" class="btn-primary-red">العودة إلى الرئيسية</NuxtLink>
    </div>

    <template v-else>
      <div class="article-page-layout">
        <article class="article-main-chamber crystal-glass">
          <nav class="breadcrumbs-nav" aria-label="مسار التصفح">
            <NuxtLink to="/">الرئيسية</NuxtLink>
            <span class="breadcrumb-sep">/</span>
            <NuxtLink :to="`/category/${article.category.slug}`">{{ article.category.nameAr }}</NuxtLink>
            <span class="breadcrumb-sep">/</span>
            <span style="color: #FFFFFF;">تفاصيل الخبر</span>
          </nav>

          <header class="article-header">
            <div class="article-kicker-row">
              <span class="article-category-badge">{{ article.category.nameAr }}</span>
              <span style="font-size: 0.82rem; color: var(--text-muted);">
                قراءة {{ article.readTimeMinutes }} دقائق • {{ article.views }} مشاهدة
              </span>
            </div>

            <h1 class="article-headline">{{ article.title }}</h1>
            <p class="article-lead-paragraph">{{ article.lead }}</p>
          </header>

          <div class="article-byline-bar">
            <NuxtLink :to="`/author/${article.author.username}`" class="author-info-group">
              <img
                :src="article.author.avatarUrl || 'https://ui-avatars.com/api/?name=ShouSar&background=008751&color=fff'"
                :alt="article.author.name"
                class="author-avatar"
              />
              <div>
                <div class="author-meta-name">بقلم: {{ article.author.name }}</div>
                <div class="author-meta-role">{{ article.author.roleTitle || 'كاتب ومساهم' }}</div>
              </div>
            </NuxtLink>

            <div class="meta-stats-group">
              <span>{{ formatFullArabic(article.publishedAt) }}</span>
            </div>
          </div>

          <figure class="article-hero-media">
            <img :src="article.heroImage" :alt="article.title" />
            <figcaption v-if="article.imageCaption" class="media-caption">
              {{ article.imageCaption }}
            </figcaption>
          </figure>

          <div class="article-actions-strip crystal-glass">
            <div class="action-buttons-group">
              <button
                type="button"
                class="glass-action-btn"
                :class="{ 'action-active-red': reacted }"
                :disabled="reacting"
                @click="toggleReaction"
              >
                <span>{{ reacted ? 'أعجبني ✓' : 'أعجبني' }}</span>
                <span>({{ reactionsCount }})</span>
              </button>
              <button
                type="button"
                class="glass-action-btn"
                :class="{ 'action-active-green': bookmarked }"
                :disabled="bookmarking"
                @click="toggleBookmark"
              >
                {{ bookmarked ? 'محفوظ ✓' : 'حفظ' }}
              </button>
              <button type="button" class="glass-action-btn share-btn" @click="shareArticle">
                مشاركة
              </button>
              <button type="button" class="glass-action-btn" @click="copyLink">
                نسخ الرابط
              </button>
              <a :href="whatsappUrl" target="_blank" rel="noopener" class="glass-action-btn">
                واتساب
              </a>
              <NuxtLink
                v-if="user && (user.id === article.author.id || isStaff)"
                :to="`/studio/editor?slug=${encodeURIComponent(article.slug)}`"
                class="glass-action-btn"
              >
                تعديل
              </NuxtLink>
            </div>

            <div class="font-size-controls">
              <span style="font-size: 0.82rem; color: var(--text-muted); margin-left: 6px;">حجم الخط:</span>
              <button type="button" class="font-btn" title="تكبير الخط" @click="changeFontSize(1)">A+</button>
              <button type="button" class="font-btn" title="تصغير الخط" @click="changeFontSize(-1)">A-</button>
            </div>
          </div>

          <!-- Safe escaped & structured HTML output -->
          <div class="article-rich-body" :style="{ fontSize: `${fontSize}rem` }" v-html="renderedBodyHtml" />

          <div v-if="tagsList.length" class="article-tags-wrap">
            <span class="tag-label">الكلمات الدالة:</span>
            <NuxtLink
              v-for="tag in tagsList"
              :key="tag"
              :to="`/search?tag=${encodeURIComponent(tag)}`"
              class="article-tag-pill"
            >
              #{{ tag }}
            </NuxtLink>
          </div>

          <NuxtLink :to="`/author/${article.author.username}`" class="author-bio-card crystal-glass crystal-interactive">
            <img
              :src="article.author.avatarUrl || 'https://ui-avatars.com/api/?name=ShouSar&background=008751&color=fff'"
              :alt="article.author.name"
              class="author-bio-photo"
            />
            <div class="author-bio-details">
              <h3>{{ article.author.name }}</h3>
              <p>{{ article.author.bio || 'كاتب ومساهم في منصة شو صار الإخبارية.' }}</p>
            </div>
          </NuxtLink>

          <section style="margin-top: 38px;">
            <h2 class="section-headline">
              آراء القراء ({{ article.comments?.length || 0 }})
            </h2>

            <form v-if="user" class="glass-form" style="margin-bottom: 24px;" @submit.prevent="submitComment">
              <div v-if="commentError" class="form-error">{{ commentError }}</div>
              <textarea
                v-model="commentText"
                class="glass-textarea"
                style="min-height: 90px;"
                placeholder="أضف تعليقك أو رأيك حول الخبر..."
                required
              />
              <div>
                <button type="submit" class="btn-primary-green" :disabled="postingComment">
                  {{ postingComment ? 'جارٍ الإرسال...' : 'إرسال التعليق' }}
                </button>
              </div>
            </form>

            <div v-else class="comment-card" style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span style="color: var(--text-secondary); font-size: 0.92rem;">
                سجّل دخولك للمشاركة في التعليقات والنقاش.
              </span>
              <NuxtLink to="/login" class="glass-action-btn">تسجيل الدخول</NuxtLink>
            </div>

            <div v-for="comment in article.comments || []" :key="comment.id" class="comment-card">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; font-size: 0.85rem;">
                <NuxtLink :to="`/author/${comment.author.username}`" style="color: #38ef7d; font-weight: 800; text-decoration: none;">
                  {{ comment.author.name }}
                </NuxtLink>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="color: var(--text-muted);">{{ formatRelativeArabic(comment.createdAt) }}</span>
                  <button
                    v-if="user && (user.id === comment.author.id || isStaff)"
                    type="button"
                    class="top-bar-btn-logout"
                    @click="deleteComment(comment.id)"
                  >
                    حذف
                  </button>
                </div>
              </div>
              <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6;">
                {{ comment.body }}
              </p>
            </div>
          </section>
        </article>

        <aside class="side-column">
          <TimelineFeed :updates="updates" title="تغطية متزامنة ولحظية" />
          <OpinionCard />
        </aside>
      </div>

      <section v-if="related.length" class="related-stories-section">
        <h2 class="section-headline">أخبار وتقارير ذات صلة</h2>
        <div class="bottom-cards-row">
          <NewsCard v-for="item in related" :key="item.id" :article="item" />
        </div>
      </section>
    </template>
  </div>
</template>
