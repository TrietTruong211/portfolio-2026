import { Injectable, inject } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'
import { DOCUMENT } from '@angular/common'

export type SeoConfig = {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}

const SITE_NAME = 'Chris'
const BASE_URL = 'https://www.trietportfolio.site'
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

    this.title.setTitle(fullTitle)
    this.meta.updateTag({ name: 'description', content: config.description })

    this.setCanonical(url)

    this.meta.updateTag({ property: 'og:title', content: fullTitle })
    this.meta.updateTag({ property: 'og:description', content: config.description })
    this.meta.updateTag({ property: 'og:url', content: url })
    this.meta.updateTag({ property: 'og:image', content: image })
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' })
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME })

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' })
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle })
    this.meta.updateTag({ name: 'twitter:description', content: config.description })
    this.meta.updateTag({ name: 'twitter:image', content: image })

    if (config.noIndex === true) {
      this.meta.updateTag({ name: 'robots', content: 'noindex,nofollow' })
    } else {
      this.meta.updateTag({ name: 'robots', content: 'index,follow' })
    }
  }

  injectJsonLd(schema: Record<string, unknown>): void {
    this.doc.querySelector('script[type="application/ld+json"]')?.remove()
    const script = this.doc.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schema)
    this.doc.head.appendChild(script)
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
}
