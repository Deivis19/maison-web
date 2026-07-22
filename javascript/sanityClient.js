import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: 'o2d2e3s0',
  dataset: 'production',
  useCdn: false, // Importante: No usar CDN para evitar caché
  apiVersion: '2024-01-01',
  perspective: 'published',
  stega: {
    enabled: false,
    studioUrl: 'https://maizon-concept.sanity.studio'
  }
})

// Función personalizada para forzar POST y evitar caché
export async function fetchWithPost(query, params = {}) {
  const url = `https://o2d2e3s0.api.sanity.io/v2024-01-01/data/query/production`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    body: JSON.stringify({
      query,
      params
    })
  })

  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.statusText}`)
  }

  const data = await response.json()
  return data.result
}
