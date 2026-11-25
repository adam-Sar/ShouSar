import type { PublicAuthor } from '~/types/news'

export interface SessionUser extends PublicAuthor {
  email: string
}

export function useAuth() {
  const user = useState<SessionUser | null>('shousar_user', () => null)
  const fetched = useState<boolean>('shousar_auth_fetched', () => false)

  async function fetchUser(force = false) {
    if (fetched.value && !force) return user.value
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const data = await $fetch<{ user: SessionUser | null }>('/api/auth/me', { headers })
      user.value = data.user
    } catch {
      user.value = null
    } finally {
      fetched.value = true
    }
    return user.value
  }

  async function login(email: string, password: string) {
    const data = await $fetch<{ user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = data.user
    fetched.value = true
    return data.user
  }

  async function register(payload: {
    name: string
    username: string
    email: string
    password: string
    roleTitle?: string
    bio?: string
  }) {
    const data = await $fetch<{ user: SessionUser }>('/api/auth/register', {
      method: 'POST',
      body: payload
    })
    user.value = data.user
    fetched.value = true
    return data.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/')
  }

  const isStaff = computed(() => user.value?.role === 'ADMIN' || user.value?.role === 'EDITOR')

  return {
    user,
    isStaff,
    fetchUser,
    login,
    register,
    logout
  }
}
