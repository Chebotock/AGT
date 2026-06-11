const BASE = import.meta.env.VITE_API_URL || ''

let isRefreshing = false
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

async function request<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  // Если 401 — попробовать обновить токен
  if (res.status === 401 && retry) {
    if (isRefreshing) {
      // Подождать пока другой запрос обновит токен
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => request<T>(path, options, false))
    }

    isRefreshing = true

    try {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (refreshRes.ok) {
        processQueue(null)
        isRefreshing = false
        // Повторить оригинальный запрос
        return request<T>(path, options, false)
      } else {
        // Refresh не удался — редирект на логин
        processQueue(new Error('Unauthorized'))
        isRefreshing = false
        window.location.href = '/agt/adm'
        throw new Error('Unauthorized')
      }
    } catch (err) {
      processQueue(err)
      isRefreshing = false
      window.location.href = '/agt/adm'
      throw err
    }
  }

  if (!res.ok) throw await res.json()
  return res.json()
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',  body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
