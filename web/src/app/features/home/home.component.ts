import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core'
import { SeoService } from '../../core/services/seo.service'
import { HeroComponent } from './sections/hero.component'
import { AboutComponent } from './sections/about.component'
import { WorksComponent } from './sections/works.component'
import { ExperiencesComponent } from './sections/experiences.component'
import { ContactComponent } from './sections/contact.component'
import {
  getMiscellaneous,
  getAbouts,
  getWorks,
  getExperiences,
} from '../../../lib/sanity/queries'
import type { Miscellaneous, About, Work, Experience } from '../../../types/index'

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroComponent,
    AboutComponent,
    WorksComponent,
    ExperiencesComponent,
    ContactComponent,
  ],
  template: `
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

      <app-hero [data]="misc()" />

      <hr class="border-border" />

      @defer (on viewport) {
        <app-about [items]="abouts()" />
      } @placeholder {
        <div class="h-64 animate-pulse rounded-lg bg-muted my-16" aria-hidden="true"></div>
      }

      <hr class="border-border" />

      @defer (on viewport) {
        <app-works [items]="works()" />
      } @placeholder {
        <div class="h-96 animate-pulse rounded-lg bg-muted my-16" aria-hidden="true"></div>
      }

      <hr class="border-border" />

      @defer (on viewport) {
        <app-experiences [items]="experiences()" />
      } @placeholder {
        <div class="h-64 animate-pulse rounded-lg bg-muted my-16" aria-hidden="true"></div>
      }

      <hr class="border-border" />

      @defer (on viewport) {
        <app-contact />
      } @placeholder {
        <div class="h-96 animate-pulse rounded-lg bg-muted my-16" aria-hidden="true"></div>
      }

    </div>
  `,
})
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService)

  readonly misc = signal<Miscellaneous | null>(null)
  readonly abouts = signal<About[]>([])
  readonly works = signal<Work[]>([])
  readonly experiences = signal<Experience[]>([])

  async ngOnInit(): Promise<void> {
    // Fetch all sections in parallel
    const [misc, abouts, works, experiences] = await Promise.all([
      getMiscellaneous(),
      getAbouts(),
      getWorks(),
      getExperiences(),
    ])

    this.misc.set(misc)
    this.abouts.set(abouts)
    this.works.set(works)
    this.experiences.set(experiences)

    // SEO — use miscellaneous data if available
    const name = misc?.name ?? 'Your Name'
    this.seo.set({
      title: misc?.title ?? 'Developer & Designer',
      description: `${name} — ${misc?.title ?? 'Full Stack Developer'}. ${misc?.greeting ?? ''}`.trim(),
      url: '/',
    })

    this.seo.injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name,
      url: 'https://yourportfolio.com',
      jobTitle: misc?.title ?? 'Full Stack Developer',
    })
  }
}
