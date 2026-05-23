import type { H3Event } from 'h3'
import { createError, getCookie, getHeader, getMethod, getQuery, readBody } from 'h3'

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export function getBackendBase(event: H3Event) {
  const config = useRuntimeConfig(event)
  const apiBase = config.public.apiBase
  if (!apiBase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_PUBLIC_API_BASE belum diset (contoh: https://domain.com/api)'
    })
  }
  return apiBase as string
}

export async function backendRequest<T>(
  event: H3Event,
  path: string,
  init: { method?: string, body?: any, query?: Record<string, any> } = {}
): Promise<T> {
  const base = getBackendBase(event)
  const url = joinUrl(base, path)

  const method = (init.method || getMethod(event) || 'GET').toUpperCase()
  const headerAuthorization = getHeader(event, 'authorization')
  const cookieToken = getCookie(event, 'auth.token')
  const authorization = headerAuthorization || (cookieToken ? (cookieToken.includes(' ') ? cookieToken : `Bearer ${cookieToken}`) : undefined)

  const body = init.body ?? ((method === 'GET' || method === 'HEAD') ? undefined : await readBody(event).catch(() => undefined))
  const query = init.query ?? getQuery(event)

  return await $fetch<T>(url, {
    method: method as any,
    query,
    body,
    headers: {
      ...(authorization ? { Authorization: authorization } : {})
    }
  })
}
