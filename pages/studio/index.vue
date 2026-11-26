<script setup lang="ts">
import type { ArticleItem } from '~/types/news'
import { formatRelativeArabic } from '~/utils/formatDate'

useHead({ title: 'استوديو الكاتب وإدارة المقالات | شو صار' })

const { user, isStaff } = useAuth()
const { showToast } = useToast()

if (!user.value) {
  await navigateTo('/login')
}

const activeTab = ref<'mine' | 'saved' | 'all'>('mine')

const [{ data: myData, refresh: refreshMine }, { data: savedData, refresh: refreshSaved }, { data: allData, refresh: refreshAll }] =
  await Promise.all([
    useFetch<{ articles: ArticleItem[] }>('/api/articles?mine=1&limit=40', { key: 'studio-my-articles' }),
    useFetch<{ articles: ArticleItem[] }>('/api/articles?bookmarked=1&limit=40', { key: 'studio-saved-articles' }),
    useFetch<{ articles: ArticleItem[] }>(
      () => (isStaff.value ? '/api/articles?all=1&limit=40' : '/api/articles?mine=1&limit=40'),
      { key: 'studio-all-articles' }
    )
  ])

const displayedArticles = computed(() => {
  if (activeTab.value === 'saved') return savedData.value?.articles ?? []
  if (activeTab.value === 'all' && isStaff.value) return allData.value?.articles ?? []
  return myData.value?.articles ?? []
})

async function refreshLists() {
  await Promise.all([refreshMine(), refreshSaved(), refreshAll()])
}

async function toggleStatus(article: ArticleItem) {
  const nextStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
  await $fetch(`/api/articles/${encodeURIComponent(article.slug)}`, {
    method: 'PATCH',
    body: { status: nextStatus }
  })
  showToast(nextStatus === 'PUBLISHED' ? 'تم نشر المقال' : 'تم تحويل المقال إلى مسودة')
  await refreshLists()
}

async function setFeatured(article: ArticleItem) {
  await $fetch(`/api/articles/${encodeURIComponent(article.slug)}`, {
    method: 'PATCH',
    body: { isFeatured: !article.isFeatured }
  })
  showToast(!article.isFeatured ? 'تم تثبيت المقال كخبر رئيسي' : 'تم إلغاء التثبيت')
  await refreshLists()
}

async function toggleBreaking(article: ArticleItem) {
  await $fetch(`/api/articles/${encodeURIComponent(article.slug)}`, {
    method: 'PATCH',
    body: { isBreaking: !article.isBreaking }
  })
  showToast(!article.isBreaking ? 'أضيف إلى شريط الأخبار' : 'أزيل من شريط الأخبار')
  await refreshLists()
}

async function deleteArticle(article: ArticleItem) {
  if (!confirm(`هل أنت متأكد من حذف "${article.title}"؟`)) return
  await $fetch(`/api/articles/${encodeURIComponent(article.slug)}`, { method: 'DELETE' })
  showToast('تم حذف المقال')
  await refreshLists()
}

async function removeBookmark(article: ArticleItem) {
  await $fetch(`/api/articles/${encodeURIComponent(article.slug)}/bookmark`, { method: 'POST' })
  showToast('أزيل من المحفوظات')
  await refreshSaved()
}
</script>

<template>
  <div v-if="user">
    <section class="glass-section-banner crystal-glass">
      <div>
        <h1>استوديو {{ user.name }}</h1>
        <p>أنشئ مقالاتك وتابع القراءات والمحفوظات، أو حرّر مسوداتك بسهولة.</p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <NuxtLink to="/studio/editor" class="btn-primary-green">
          + مقال جديد
        </NuxtLink>
        <NuxtLink to="/studio/profile" class="glass-action-btn">
          إعدادات الحساب
        </NuxtLink>
        <NuxtLink v-if="isStaff" to="/live" class="btn-primary-red">
          إدارة البث المباشر
        </NuxtLink>
      </div>
    </section>

    <div style="display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap;">
      <button
        type="button"
        class="glass-action-btn"
        :style="activeTab === 'mine' ? 'background: var(--lb-green); border-color: var(--lb-green);' : ''"
        @click="activeTab = 'mine'"
      >
        مقالاتي ({{ myData?.articles.length || 0 }})
      </button>
      <button
        type="button"
        class="glass-action-btn"
        :style="activeTab === 'saved' ? 'background: var(--lb-green); border-color: var(--lb-green);' : ''"
        @click="activeTab = 'saved'"
      >
        المحفوظات ({{ savedData?.articles.length || 0 }})
      </button>
      <button
        v-if="isStaff"
        type="button"
        class="glass-action-btn"
        :style="activeTab === 'all' ? 'background: var(--lb-red); border-color: var(--lb-red);' : ''"
        @click="activeTab = 'all'"
      >
        إدارة جميع المقالات — صلاحية التحرير ({{ allData?.articles.length || 0 }})
      </button>
    </div>

    <section class="studio-container crystal-glass">
      <div v-if="!displayedArticles.length" style="text-align: center; padding: 30px 10px;">
        <p style="color: var(--text-secondary); margin-bottom: 16px;">لا توجد مقالات في هذه القائمة بعد.</p>
        <NuxtLink v-if="activeTab === 'mine'" to="/studio/editor" class="btn-primary-green">
          ابدأ بكتابة أول مقال
        </NuxtLink>
      </div>

      <div v-for="item in displayedArticles" :key="item.id" class="studio-table-row">
        <div style="flex: 1; min-width: 240px;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
            <span
              class="status-badge"
              :class="item.status === 'PUBLISHED' ? 'status-published' : 'status-draft'"
            >
              {{ item.status === 'PUBLISHED' ? 'منشور' : 'مسودة' }}
            </span>
            <span v-if="item.isFeatured" class="urgent-badge">الخبر الرئيسي</span>
            <span v-if="item.isBreaking" class="ticker-badge" style="font-size: 0.72rem; padding: 2px 8px;">شريط الأخبار</span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">{{ item.category.nameAr }}</span>
          </div>

          <NuxtLink
            :to="`/articles/${item.slug}`"
            style="color: #fff; font-weight: 800; font-size: 1.05rem; text-decoration: none; display: block;"
          >
            {{ item.title }}
          </NuxtLink>

          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
            بقلم {{ item.author.name }} • {{ formatRelativeArabic(item.publishedAt) }} • {{ item.views }} مشاهدة • {{ item._count?.reactions || 0 }} إعجاب
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <template v-if="activeTab === 'saved'">
            <NuxtLink :to="`/articles/${item.slug}`" class="glass-action-btn">قراءة</NuxtLink>
            <button type="button" class="glass-action-btn share-btn" @click="removeBookmark(item)">
              إزالة من المحفوظات
            </button>
          </template>
          <template v-else>
            <NuxtLink :to="`/studio/editor?slug=${encodeURIComponent(item.slug)}`" class="glass-action-btn">
              تعديل
            </NuxtLink>
            <button type="button" class="glass-action-btn" @click="toggleStatus(item)">
              {{ item.status === 'PUBLISHED' ? 'إرجاع لمسودة' : 'نشر الآن' }}
            </button>

            <template v-if="isStaff">
              <button type="button" class="glass-action-btn" @click="setFeatured(item)">
                {{ item.isFeatured ? 'إلغاء الرئيسي' : 'تثبيت كرئيسي' }}
              </button>
              <button type="button" class="glass-action-btn" @click="toggleBreaking(item)">
                {{ item.isBreaking ? 'إزالة من الشريط' : 'إضافة للشريط' }}
              </button>
            </template>

            <button type="button" class="glass-action-btn share-btn" @click="deleteArticle(item)">
              حذف
            </button>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>
