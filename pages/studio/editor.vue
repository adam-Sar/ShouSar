<script setup lang="ts">
import type { ArticleItem, CategoryItem } from '~/types/news'

const route = useRoute()
const editSlug = computed(() => (typeof route.query.slug === 'string' ? route.query.slug : ''))

useHead(() => ({
  title: editSlug.value ? 'تعديل المقال | استوديو شو صار' : 'كتابة مقال جديد | استوديو شو صار'
}))

const { user, isStaff } = useAuth()
const { showToast } = useToast()

if (!user.value) {
  await navigateTo('/login')
}

const { data: catData } = await useCategories()
const categories = computed(() => catData.value?.categories ?? [])

const title = ref('')
const lead = ref('')
const content = ref('')
const categoryId = ref('')
const heroImage = ref('https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80')
const imageCaption = ref('')
const pullQuote = ref('')
const pullQuoteAuthor = ref('')
const tags = ref('')
const isFeatured = ref(false)
const isBreaking = ref(false)

const uploading = ref(false)
const uploadingInline = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const unauthorizedEdit = ref(false)
const contentInputRef = ref<HTMLTextAreaElement | null>(null)

if (categories.value.length && !categoryId.value) {
  categoryId.value = categories.value[0].id
}

if (editSlug.value) {
  try {
    const res = await $fetch<{ article: ArticleItem }>(`/api/articles/${encodeURIComponent(editSlug.value)}`)
    const a = res.article
    if (a.author.id !== user.value?.id && !isStaff.value) {
      unauthorizedEdit.value = true
      errorMsg.value = 'غير مسموح لك بتعديل هذا المقال لأنك لست كاتبه.'
    } else {
      title.value = a.title
      lead.value = a.lead
      content.value = a.content
      categoryId.value = a.category.id
      heroImage.value = a.heroImage
      imageCaption.value = a.imageCaption || ''
      pullQuote.value = a.pullQuote || ''
      pullQuoteAuthor.value = a.pullQuoteAuthor || ''
      tags.value = a.tags || ''
      isFeatured.value = a.isFeatured
      isBreaking.value = a.isBreaking
    }
  } catch {
    errorMsg.value = 'تعذر تحميل بيانات المقال المطلوب تعديله'
  }
}

function insertSnippet(snippet: string) {
  const el = contentInputRef.value
  if (!el) {
    content.value = content.value ? `${content.value}\n\n${snippet}` : snippet
    return
  }
  const start = el.selectionStart ?? content.value.length
  const end = el.selectionEnd ?? content.value.length
  const before = content.value.slice(0, start)
  const after = content.value.slice(end)
  content.value = `${before}${snippet}${after}`
  nextTick(() => {
    el.focus()
    const pos = start + snippet.length
    el.setSelectionRange(pos, pos)
  })
}

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  errorMsg.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await $fetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData
    })
    heroImage.value = res.url
    showToast('تم رفع صورة الغلاف بنجاح')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'فشل رفع الصورة'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function handleInlineImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingInline.value = true
  errorMsg.value = ''
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await $fetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData
    })
    insertSnippet(`\n\n![وصف الصورة](${res.url})\n\n`)
    showToast('تم إدراج الصورة داخل النص')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'فشل رفع الصورة'
  } finally {
    uploadingInline.value = false
    input.value = ''
  }
}

async function saveArticle(status: 'PUBLISHED' | 'DRAFT') {
  errorMsg.value = ''
  saving.value = true

  const payload = {
    title: title.value,
    lead: lead.value,
    content: content.value,
    categoryId: categoryId.value,
    heroImage: heroImage.value,
    imageCaption: imageCaption.value,
    pullQuote: pullQuote.value,
    pullQuoteAuthor: pullQuoteAuthor.value,
    tags: tags.value,
    status,
    isFeatured: isStaff.value ? isFeatured.value : undefined,
    isBreaking: isStaff.value ? isBreaking.value : undefined
  }

  try {
    let savedSlug = editSlug.value
    if (editSlug.value) {
      const res = await $fetch<{ article: ArticleItem }>(`/api/articles/${encodeURIComponent(editSlug.value)}`, {
        method: 'PATCH',
        body: payload
      })
      savedSlug = res.article.slug
    } else {
      const res = await $fetch<{ article: ArticleItem }>('/api/articles', {
        method: 'POST',
        body: payload
      })
      savedSlug = res.article.slug
    }

    showToast(status === 'PUBLISHED' ? 'تم نشر المقال على شو صار!' : 'تم حفظ المسودة')
    await navigateTo(status === 'PUBLISHED' ? `/articles/${savedSlug}` : '/studio')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'تعذر حفظ المقال، تحقق من الحقول'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="user">
    <section class="glass-section-banner crystal-glass">
      <div>
        <h1>{{ editSlug ? 'تعديل المقال' : 'كتابة ونشر خبر جديد' }}</h1>
        <p>أضف العنوان والتفاصيل والصورة الرئيسية — يُنشر فوراً على المنصة عند اختيار النشر.</p>
      </div>
      <NuxtLink to="/studio" class="glass-action-btn">العودة إلى الاستوديو</NuxtLink>
    </section>

    <div v-if="unauthorizedEdit" class="studio-container crystal-glass">
      <div class="form-error" style="margin-bottom: 16px;">{{ errorMsg }}</div>
      <NuxtLink to="/studio" class="btn-primary-red">العودة إلى الاستوديو</NuxtLink>
    </div>

    <div v-else class="studio-container crystal-glass">
      <form class="glass-form" @submit.prevent="saveArticle('PUBLISHED')">
        <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>

        <div class="form-group">
          <label class="form-label" for="art-title">عنوان الخبر أو المقال</label>
          <input
            id="art-title"
            v-model="title"
            type="text"
            class="glass-input"
            placeholder="عنوان جذاب وواضح يعكس جوهر الخبر..."
            required
          />
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div class="form-group">
            <label class="form-label" for="art-cat">التصنيف</label>
            <select id="art-cat" v-model="categoryId" class="glass-select" required>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.nameAr }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="art-tags">الوسوم (مفصولة بفاصلة)</label>
            <input
              id="art-tags"
              v-model="tags"
              type="text"
              class="glass-input"
              placeholder="لبنان, بيروت, اقتصاد"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="art-lead">المقدمة الموجزة (تظهر في البطاقات وأعلى المقال)</label>
          <textarea
            id="art-lead"
            v-model="lead"
            class="glass-textarea"
            style="min-height: 90px;"
            placeholder="ملخص سريع للخبر في سطرين أو ثلاثة..."
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">صورة الغلاف (ارفع ملفاً أو ألصق رابط صورة)</label>
          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <input
              v-model="heroImage"
              type="text"
              dir="ltr"
              class="glass-input"
              style="flex: 1; min-width: 240px;"
              placeholder="https://..."
            />
            <label class="glass-action-btn" style="cursor: pointer;">
              <span>{{ uploading ? 'جارٍ الرفع...' : 'رفع صورة من جهازك' }}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style="display: none;"
                :disabled="uploading"
                @change="handleImageUpload"
              />
            </label>
          </div>
          <div
            v-if="heroImage"
            style="margin-top: 10px; border-radius: 12px; overflow: hidden; max-height: 240px; border: 1px solid rgba(255,255,255,0.2);"
          >
            <img :src="heroImage" alt="معاينة الغلاف" style="width: 100%; height: 220px; object-fit: cover; display: block;" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="art-caption">وصف الصورة (اختياري)</label>
          <input
            id="art-caption"
            v-model="imageCaption"
            type="text"
            class="glass-input"
            placeholder="مثال: واجهة بيروت البحرية صباح اليوم"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="art-content">نص المقال الكامل</label>
          <div class="editor-toolbar">
            <button type="button" class="glass-action-btn" @click="insertSnippet('\n\n## عنوان فرعي\n\n')">
              عنوان فرعي H2
            </button>
            <button type="button" class="glass-action-btn" @click="insertSnippet(' **نص عريض** ')">
              عريض B
            </button>
            <button type="button" class="glass-action-btn" @click="insertSnippet('\n\n> نص الاقتباس المميز هنا\n— قائل الاقتباس\n\n')">
              اقتباس مميز ❝
            </button>
            <button
              v-if="pullQuote.trim()"
              type="button"
              class="glass-action-btn"
              @click="insertSnippet('\n\n[quote]\n\n')"
            >
              تحديد موضع الاقتباس [quote]
            </button>
            <button type="button" class="glass-action-btn" @click="insertSnippet('\n\n- نقطة أولى\n- نقطة ثانية\n\n')">
              قائمة نقطية
            </button>
            <label class="glass-action-btn" style="cursor: pointer;">
              <span>{{ uploadingInline ? 'جارٍ الرفع...' : '+ إدراج صورة داخل النص' }}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style="display: none;"
                :disabled="uploadingInline"
                @change="handleInlineImageUpload"
              />
            </label>
          </div>
          <textarea
            id="art-content"
            ref="contentInputRef"
            v-model="content"
            class="glass-textarea"
            style="min-height: 280px;"
            placeholder="اكتب تفاصيل الخبر هنا... يمكنك استخدام ## للعناوين، > للاقتباس في أي مكان، أو [quote] لتحديد مكان الاقتباس التحريري"
            required
          />
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
          <div class="form-group">
            <label class="form-label" for="art-quote">اقتباس تحريري مميز (اختياري)</label>
            <input
              id="art-quote"
              v-model="pullQuote"
              type="text"
              class="glass-input"
              placeholder="جملة محورية تبرز داخل إطار أخضر..."
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="art-quote-author">قائل الاقتباس (اختياري)</label>
            <input
              id="art-quote-author"
              v-model="pullQuoteAuthor"
              type="text"
              class="glass-input"
              placeholder="مثال: خبير اقتصادي"
            />
          </div>
        </div>

        <div
          v-if="isStaff"
          style="display: flex; gap: 20px; flex-wrap: wrap; padding: 12px 16px; background: rgba(255,255,255,0.06); border-radius: 10px;"
        >
          <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
            <input v-model="isFeatured" type="checkbox" />
            <span>تثبيت كخبر رئيسي في الصفحة الأولى</span>
          </label>
          <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
            <input v-model="isBreaking" type="checkbox" />
            <span>عرض في شريط الأخبار العاجلة</span>
          </label>
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px;">
          <button type="submit" class="btn-primary-green" :disabled="saving || uploading || uploadingInline">
            {{ saving ? 'جارٍ الحفظ...' : editSlug ? 'حفظ ونشر التعديلات' : 'نشر المقال الآن' }}
          </button>
          <button
            type="button"
            class="glass-action-btn"
            :disabled="saving || uploading || uploadingInline"
            @click="saveArticle('DRAFT')"
          >
            حفظ كمسودة
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
