import axios from 'axios'

export const AUTH_TOKEN_STORAGE_KEY = 'nbr_auth_token'

/** Extracts the human-readable message from a backend error response.
 *  NestJS returns { message, error, statusCode } — we surface `message`. */
export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message
    if (typeof msg === 'string' && msg.length > 0) return msg
    if (Array.isArray(msg) && msg.length > 0) return msg.join(', ')
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred.'
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
