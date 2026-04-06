# Skill: Sanity CMS v3

## Context
Sanity is the single source of truth for all portfolio content: projects, skills, work experience, and bio. The frontend queries Sanity at build time via GROQ. Content editors use Sanity Studio (embedded in the Next.js app at `/studio`, development only).

---

## Schema definitions

```ts
// apps/web/src/sanity/schemas/project.ts
import { defineField, defineType } from 'sanity'

export const projectSchema = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'techStack', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'url', type: 'url' }),
    defineField({ name: 'githubUrl', type: 'url' }),
    defineField({ name: 'featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', type: 'number' }),
  ],
  orderings: [{ title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
})
```

```ts
// apps/web/src/sanity/schemas/workExperience.ts
export const workExperienceSchema = defineType({
  name: 'workExperience',
  title: 'Work Experience',
  type: 'document',
  fields: [
    defineField({ name: 'company', type: 'string', validation: r => r.required() }),
    defineField({ name: 'role', type: 'string', validation: r => r.required() }),
    defineField({ name: 'startDate', type: 'date', validation: r => r.required() }),
    defineField({ name: 'endDate', type: 'date' }),
    defineField({ name: 'current', type: 'boolean', initialValue: false }),
    defineField({ name: 'description', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'techStack', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'logo', type: 'image' }),
  ],
})
```

---

## GROQ queries

```ts
// apps/web/src/lib/sanity/queries.ts
import { sanity } from './client'
import type { Project, WorkExperience, Skill, Bio } from '@portfolio/types'

export const getProjects = () =>
  sanity.fetch<Project[]>(
    `*[_type == "project"] | order(order asc) {
      title,
      "slug": slug.current,
      description,
      tags,
      techStack,
      "image": image.asset->url,
      url,
      githubUrl,
      featured,
      order
    }`
  )

export const getFeaturedProjects = () =>
  sanity.fetch<Project[]>(
    `*[_type == "project" && featured == true] | order(order asc) [0..2] {
      title, "slug": slug.current, description, tags, "image": image.asset->url, url
    }`
  )

export const getWorkExperiences = () =>
  sanity.fetch<WorkExperience[]>(
    `*[_type == "workExperience"] | order(startDate desc) {
      company, role, startDate, endDate, current, description, techStack,
      "logo": logo.asset->url
    }`
  )

export const getSkills = () =>
  sanity.fetch<Skill[]>(`*[_type == "skill"] | order(category asc, name asc)`)

export const getBio = () =>
  sanity.fetch<Bio>(`*[_type == "bio"][0] {
    name, headline, about, "avatar": avatar.asset->url, resumeUrl, socials
  }`)
```

---

## Sanity client

```ts
// apps/web/src/lib/sanity/client.ts
import { createClient } from '@sanity/client'

export const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn:    true,            // cached reads for build-time fetching
  token:     process.env.SANITY_API_TOKEN,  // write access (server only)
})
```

---

## Studio setup (dev only)

```tsx
// apps/web/src/app/studio/[[...tool]]/page.tsx
'use client'
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

```ts
// apps/web/sanity.config.ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { projectSchema } from './src/sanity/schemas/project'
import { workExperienceSchema } from './src/sanity/schemas/workExperience'
import { skillSchema } from './src/sanity/schemas/skill'
import { bioSchema } from './src/sanity/schemas/bio'

export default defineConfig({
  name: 'portfolio',
  title: 'Portfolio CMS',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: 'production',
  plugins: [structureTool()],
  schema: { types: [projectSchema, workExperienceSchema, skillSchema, bioSchema] },
})
```

Exclude `/studio` from the static export — it's a dev-only route:
```ts
// next.config.ts
const config: NextConfig = {
  output: 'export',
  // exclude studio from export
  async exportPathMap() {
    return {
      '/': { page: '/' },
      '/projects': { page: '/projects' },
      '/admin': { page: '/admin' },
    }
  },
}
```

---

## Portable text rendering

```tsx
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'

const components = {
  block: {
    normal: ({ children }: { children: React.ReactNode }) => (
      <p className="text-muted-foreground leading-relaxed">{children}</p>
    ),
  },
}

export function RichText({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={components} />
}
```
