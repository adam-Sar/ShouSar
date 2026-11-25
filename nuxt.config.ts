export default defineNuxtConfig({
  compatibilityDate: '2025-02-01',
  devtools: { enabled: true },

  css: ['~/assets/css/glass.css'],

  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET || 'shousar-dev-secret-change-in-production-2026',
    public: {
      siteName: 'شو صار',
      siteNameEn: 'ShouSar'
    }
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'ar',
        dir: 'rtl'
      },
      title: 'شو صار | ShouSar — الأخبار لحظة بلحظة',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'شو صار — منصة إخبارية لبنانية مستقلة ترصد الخبر لحظة بلحظة وتتيح للكتّاب والمساهمين نشر التحليلات والأخبار.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap'
        }
      ]
    }
  }
})
