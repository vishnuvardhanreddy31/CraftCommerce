import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
})

/* ─── Request interceptor ─────────────────────────────────────────────── */
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cc_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const tenantId =
      localStorage.getItem('cc_tenant_id') ||
      import.meta.env.VITE_TENANT_ID ||
      'default'
    config.headers['X-Tenant-ID'] = tenantId

    return config
  },
  (error) => Promise.reject(error)
)

/* ─── Response interceptor ────────────────────────────────────────────── */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cc_token')
      localStorage.removeItem('cc_user')
      // Avoid redirect loop on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client
