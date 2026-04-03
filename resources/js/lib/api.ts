import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

function getCustomerToken(): string | null {
  try {
    const raw = localStorage.getItem('cheesemania-customer')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } }
    return parsed?.state?.token ?? null
  } catch {
    return null
  }
}

api.interceptors.request.use((config) => {
  const url = config.url ?? ''
  const isAdminRequest = url.startsWith('/admin')

  if (!isAdminRequest && !config.headers?.Authorization) {
    const token = getCustomerToken()
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? ''
    if (error.response?.status === 401 && url.startsWith('/admin')) {
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  },
)
