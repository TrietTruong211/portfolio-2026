# Skill: Performance, SEO & Accessibility

## Context
This is a public-facing portfolio — these three pillars directly affect discoverability, user experience, and professional credibility. They are not optional polish; they are enforced in CI and must pass before any PR merges.

---

## Performance

### Change detection: always OnPush

```ts
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,  // mandatory on every component
})
```

With OnPush, Angular only re-renders when:
- An `input()` signal reference changes
- An event originates from the component or its children
- An Observable emits via `async` pipe
- A signal read inside the template changes

Never use `Default` change detection. If something doesn't update, the fix is to use signals correctly — not to drop back to `Default`.

---

### NgOptimizedImage — mandatory for all images

```html
<!-- WRONG — never do this -->
<img src="/assets/me.jpg" alt="Profile photo" />

<!-- RIGHT — always NgOptimizedImage -->
<img
  ngSrc="/assets/me.jpg"
  alt="Profile photo"
  width="400"
  height="400"
  priority          <!-- add for LCP images (hero, above-fold) -->
/>

<!-- For remote images (Sanity CDN), configure loader in app.config.ts -->
<img
  [ngSrc]="project.image"
  [alt]="project.title + ' screenshot'"
  width="600"
  height="340"
  loading="lazy"    <!-- below-fold: lazy. Above-fold: omit (defaults to eager) -->
/>
```

**Sanity image loader:**
```ts
// src/app/core/loaders/sanity-image.loader.ts
import { ImageLoader, ImageLoaderConfig } from '@angular/common'

export const sanityImageLoader: ImageLoader = (config: ImageLoaderConfig): string => {
  const { src, width } = config
  return `${src}?w=${width}&auto=format&q=80`
}

// Register in app.config.ts:
providers: [
  provideImageKitLoader('https://cdn.sanity.io'), // or use custom loader
]
```

---

### Lazy loading and @defer

Every route except the homepage is lazy-loaded (see angular.md).

Use `@defer` for below-fold sections:

```html
<!-- Trigger: when the placeholder enters the viewport -->
@defer (on viewport; prefetch on idle) {
  <app-skills-section />
} @placeholder (minimum 200ms) {
  <div class="h-64 rounded-lg bg-muted animate-pulse" aria-hidden="true" role="presentation"></div>
} @loading (minimum 300ms) {
  <div class="h-64 rounded-lg bg-muted/50" aria-hidden="true"></div>
}

<!-- Trigger: interaction (chatbot — user must click to open) -->
@defer (on interaction) {
  <app-chatbot />
} @placeholder {
  <button class="...">Chat with me</button>
}
```

---

### Bundle size targets

| Chunk | Target |
|-------|--------|
| Initial (main + polyfills) | < 150KB gzipped |
| Per lazy route | < 50KB gzipped |
| Total transferred | < 400KB gzipped |

**Audit command:**
```bash
ng build --configuration=production --stats-json
npx webpack-bundle-analyzer dist/web/browser/stats.json
```

**Common causes of bundle bloat:**
- Importing entire libraries (`import * as _ from 'lodash'`) — use specific imports or `lodash-es`
- Unused icon imports from `lucide-angular` — import only what you use
- Moment.js — use `date-fns` instead (tree-shakeable)
- Large JSON files imported directly — fetch at runtime or embed only what's needed

---

### Self-hosted fonts (no Google Fonts runtime)

```ts
// Install: pnpm --filter web add @fontsource/inter
// src/styles/globals.scss
@use '@fontsource/inter/400.css';
@use '@fontsource/inter/500.css';
@use '@fontsource/inter/700.css';
```

This eliminates the Google Fonts DNS lookup + connection + download from the critical path. Fonts are bundled with the app and served from CloudFront.

Also set `font-display: swap` in the `@font-face` rule (fontsource does this by default).

---

### Core Web Vitals targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID/INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

**LCP tips:**
- Add `priority` to the hero image (`NgOptimizedImage` adds `fetchpriority="high"` + preload link)
- Prerender means HTML is ready immediately — no blank shell
- Self-host fonts to avoid render-blocking

**CLS tips:**
- Always set `width` and `height` on `<img>` — `NgOptimizedImage` enforces this
- Reserve space for lazy-loaded sections with `@placeholder` min-height
- Avoid injecting content above existing content after load

---

## SEO

### SeoService

```ts
// src/app/core/services/seo.service.ts
import { Injectable, inject } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'
import { DOCUMENT } from '@angular/common'
import { environment } from '../../../environments/environment'

export interface SeoConfig {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}

const SITE_NAME = 'Your Name'
const BASE_URL = 'https://yourportfolio.com'
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png`

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta)
  private readonly title = inject(Title)
  private readonly doc = inject(DOCUMENT)

  set(config: SeoConfig): void {
    const fullTitle = `${config.title} | ${SITE_NAME}`
    const url = config.url ? `${BASE_URL}${config.url}` : BASE_URL
    const image = config.image ?? DEFAULT_IMAGE

    // Basic
    this.title.setTitle(fullTitle)
    this.meta.updateTag({ name: 'description', content: config.description })

    // Canonical
    this.setCanonical(url)

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: fullTitle })
    this.meta.updateTag({ property: 'og:description', content: config.description })
    this.meta.updateTag({ property: 'og:url', content: url })
    this.meta.updateTag({ property: 'og:image', content: image })
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' })
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME })

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' })
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle })
    this.meta.updateTag({ name: 'twitter:description', content: config.description })
    this.meta.updateTag({ name: 'twitter:image', content: image })

    // Robots
    if (config.noIndex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' })
    } else {
      this.meta.updateTag({ name: 'robots', content: 'index,follow' })
    }
  }

  private setCanonical(url: string): void {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = this.doc.createElement('link')
      link.setAttribute('rel', 'canonical')
      this.doc.head.appendChild(link)
    }
    link.setAttribute('href', url)
  }

  injectJsonLd(schema: Record<string, unknown>): void {
    // Remove existing JSON-LD
    this.doc.querySelector('script[type="application/ld+json"]')?.remove()
    const script = this.doc.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schema)
    this.doc.head.appendChild(script)
  }
}
```

### Usage in a route component

```ts
// src/app/features/home/home.component.ts
import { Component, inject, OnInit } from '@angular/core'
import { SeoService } from '../../core/services/seo.service'

@Component({ ... })
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService)

  ngOnInit(): void {
    this.seo.set({
      title: 'Developer & Designer',
      description: 'I build fast, accessible web apps with Angular, TypeScript, and AWS.',
      url: '/',
    })

    this.seo.injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Triet Truong Minh',
      url: 'http://trietportfolio.site',
      jobTitle: 'Full Stack Developer',
      sameAs: [
        'https://github.com/TrietTruong211',
        'https://www.linkedin.com/in/triet-truong-minh-847971189',
      ],
    })
  }
}
```

### Project page JSON-LD

```ts
this.seo.injectJsonLd({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: project.title,
  description: project.description,
  url: project.url,
  author: { '@type': 'Person', name: 'Your Name' },
  programmingLanguage: project.techStack,
})
```

---

### robots.txt

```
# public/robots.txt
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://yourportfolio.com/sitemap.xml
```

### sitemap.xml (generate at build time)

```ts
// scripts/generate-sitemap.ts (run as part of ng build)
import { createClient } from '@sanity/client'
import * as fs from 'fs'

const sanity = createClient({ projectId: '...', dataset: 'production', apiVersion: '2024-01-01', useCdn: false })

async function generateSitemap(): Promise<void> {
  const projects = await sanity.fetch<{ slug: string }[]>(`*[_type == "project"]{ "slug": slug.current }`)

  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'monthly' },
    { loc: '/projects/', priority: '0.9', changefreq: 'weekly' },
    ...projects.map(p => ({ loc: `/projects/${p.slug}/`, priority: '0.7', changefreq: 'monthly' })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>https://yourportfolio.com${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  fs.writeFileSync('src/public/sitemap.xml', xml)
  console.log(`Sitemap written with ${urls.length} URLs`)
}

generateSitemap()
```

---

## Accessibility

### Skip link (first element in app.component.html)

```html
<!-- src/app/app.component.html -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50
         focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground
         focus:shadow-lg"
>
  Skip to main content
</a>

<app-header />

<main id="main-content" tabindex="-1">
  <router-outlet />
</main>

<app-footer />
```

---

### Route change announcements

```ts
// src/app/app.component.ts
import { Component, inject, OnInit } from '@angular/core'
import { Router, NavigationEnd } from '@angular/router'
import { LiveAnnouncer } from '@angular/cdk/a11y'
import { Title } from '@angular/platform-browser'
import { filter } from 'rxjs/operators'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...],
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router)
  private readonly announcer = inject(LiveAnnouncer)
  private readonly title = inject(Title)

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      // Give Angular time to set the new title
      setTimeout(() => {
        this.announcer.announce(`Navigated to ${this.title.getTitle()}`, 'polite')
      }, 100)
    })
  }
}
```

---

### Focus management

```ts
// After programmatic navigation (e.g. filter change), move focus to results heading
import { ElementRef, inject } from '@angular/core'

export class ProjectsComponent {
  private readonly resultsHeading = inject(ElementRef)

  applyFilter(tag: string): void {
    this.activeTag.set(tag)
    // Move focus to results so screen reader announces count
    setTimeout(() => {
      this.resultsHeading.nativeElement.querySelector('[data-results-heading]')?.focus()
    })
  }
}
```

```html
<h2
  data-results-heading
  tabindex="-1"
  class="text-xl font-semibold mb-4 focus:outline-none"
>
  {{ filteredProjects().length }} projects
  @if (activeTag()) { <span>tagged "{{ activeTag() }}"</span> }
</h2>
```

---

### Colour contrast

Tailwind's default palette doesn't guarantee WCAG AA contrast. Always check:

- Normal text (< 18px, < 14px bold): contrast ≥ 4.5:1
- Large text (≥ 18px, or ≥ 14px bold): contrast ≥ 3:1
- UI components and focus rings: ≥ 3:1

Use the [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/) or the browser's devtools accessibility panel.

**Critical pairs to check:**
- `text-muted-foreground` on `bg-background` (often fails on light theme)
- `text-primary-foreground` on `bg-primary` (check all tweakcn presets)
- Focus ring on all backgrounds

---

### Keyboard navigation

Every interactive element must be reachable via Tab and operable via Space/Enter. Check:

```html
<!-- Custom button — must be a real <button> -->
<button
  type="button"
  (click)="toggle()"
  (keydown.enter)="toggle()"
  [attr.aria-expanded]="isOpen()"
  [attr.aria-controls]="'menu-' + id"
>
  Menu
</button>

<!-- Never use div as a button -->
<!-- WRONG: <div (click)="toggle()">Menu</div> -->
```

**Focus trap for modal/drawer (use CDK):**
```ts
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y'

private focusTrap?: FocusTrap

openModal(): void {
  this.isOpen.set(true)
  setTimeout(() => {
    this.focusTrap = this.focusTrapFactory.create(this.modalRef.nativeElement)
    this.focusTrap.focusInitialElement()
  })
}

closeModal(): void {
  this.focusTrap?.destroy()
  this.isOpen.set(false)
}
```

---

### Axe-core in Playwright

```ts
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const pages = ['/', '/projects/']

for (const path of pages) {
  test(`${path} has no accessibility violations`, async ({ page }) => {
    await page.goto(path)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
}
```

Install: `pnpm --filter web add -D @axe-core/playwright`

---

### ARIA patterns for common components

**Filter buttons (projects page):**
```html
<div role="group" aria-label="Filter projects by technology">
  @for (tag of allTags(); track tag) {
    <button
      type="button"
      [attr.aria-pressed]="activeTag() === tag"
      (click)="setFilter(tag)"
      class="..."
    >
      {{ tag }}
    </button>
  }
</div>
```

**Loading state:**
```html
<div
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  @if (isLoading()) { Loading projects... }
  @else { {{ projects().length }} projects loaded }
</div>
```

**Icon-only button:**
```html
<button type="button" aria-label="Toggle dark mode">
  <lucide-angular [img]="Moon" size="20" aria-hidden="true" />
</button>
```

---

### Semantic HTML checklist

- `<header>` — site header (not inside `<main>`)
- `<nav>` — navigation landmark; add `aria-label` if multiple navs
- `<main>` — one per page, wraps the page content
- `<article>` — project cards, blog posts (self-contained content)
- `<section>` — named sections of the page; always needs a heading
- `<aside>` — supplementary content (sidebar, related links)
- `<footer>` — site footer
- Heading hierarchy: `h1` (page title) → `h2` (sections) → `h3` (subsections) — never skip levels

---

## CI enforcement

```yaml
# .github/workflows/ci.yml (quality gates)

- name: Angular unit tests
  run: pnpm --filter web test -- --watch=false --code-coverage
  
- name: Playwright E2E + axe
  run: pnpm --filter web e2e
  # axe violations cause test failure automatically

- name: Bundle size check
  run: |
    pnpm --filter web build -- --stats-json
    node scripts/check-bundle-size.js
  # check-bundle-size.js reads stats.json and exits 1 if initial > 150KB gzipped

- name: Lighthouse CI (optional but recommended)
  uses: treosh/lighthouse-ci-action@v11
  with:
    urls: |
      http://localhost:4200/
      http://localhost:4200/projects/
    budgetPath: .lighthouserc.json
    uploadArtifacts: true
```

```json
// .lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 1.0 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }]
      }
    }
  }
}
```
