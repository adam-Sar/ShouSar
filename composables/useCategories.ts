import type { CategoryItem } from '~/types/news'

export function useCategories() {
  return useFetch<{ categories: CategoryItem[] }>('/api/categories', {
    key: 'nav-categories',
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key]
  })
}
