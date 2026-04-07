import { createClient } from '@sanity/client'
import { environment } from '../../environments/environment'

export const sanity = createClient({
  projectId: environment.sanityProjectId,
  dataset: environment.sanityDataset,
  apiVersion: '2024-01-01',
  useCdn: true,
})
