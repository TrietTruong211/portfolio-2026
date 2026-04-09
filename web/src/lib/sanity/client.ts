import { createClient } from '@sanity/client'

export const sanity = createClient({
  projectId: '8kchh4m0',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})
