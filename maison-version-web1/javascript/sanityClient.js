import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: 'o2d2e3s0',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
})
