import type {
  OnInit} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  makeStateKey,
  PLATFORM_ID,
  signal,
  TransferState,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { SeoService } from '../../core/services/seo.service'
import { HeroComponent } from './sections/hero.component'
import { AboutComponent } from './sections/about.component'
import { SkillsComponent } from './sections/skills.component'
import { WorksComponent } from './sections/works.component'
import { ExperiencesComponent } from './sections/experiences.component'
import { TestimonialsComponent } from './sections/testimonials.component'
import { BrandsComponent } from './sections/brands.component'
import {
  getMiscellaneous,
  getAbouts,
  getSkills,
  getWorks,
  getExperiences,
  getTestimonials,
  getBrands,
} from '../../../lib/sanity/queries'
import type {
  Miscellaneous,
  About,
  Skill,
  Work,
  Experience,
  Testimonial,
  Brand,
} from '../../../types/index'

const MISC_KEY          = makeStateKey<Miscellaneous | null>('home_misc')
const ABOUTS_KEY        = makeStateKey<About[]>('home_abouts')
const SKILLS_KEY        = makeStateKey<Skill[]>('home_skills')
const WORKS_KEY         = makeStateKey<Work[]>('home_works')
const EXPERIENCES_KEY   = makeStateKey<Experience[]>('home_experiences')
const TESTIMONIALS_KEY  = makeStateKey<Testimonial[]>('home_testimonials')
const BRANDS_KEY        = makeStateKey<Brand[]>('home_brands')

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroComponent,
    AboutComponent,
    SkillsComponent,
    WorksComponent,
    ExperiencesComponent,
    TestimonialsComponent,
    BrandsComponent,
  ],
  template: `
    <app-hero [data]="misc()" />

    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <app-about [items]="abouts()" />
      <app-skills [items]="skills()" />
      <app-works [items]="works()" />
      <app-experiences [items]="experiences()" />
    </div>
  `,
      // <app-testimonials [items]="testimonials()" />
      // <app-brands [items]="brands()" />
})
export class HomeComponent implements OnInit {
  private readonly seo         = inject(SeoService)
  private readonly state       = inject(TransferState)
  private readonly platformId  = inject(PLATFORM_ID)

  readonly misc        = signal<Miscellaneous | null>(null)
  readonly abouts      = signal<About[]>([])
  readonly skills      = signal<Skill[]>([])
  readonly works       = signal<Work[]>([])
  readonly experiences = signal<Experience[]>([])
  readonly testimonials = signal<Testimonial[]>([])
  readonly brands      = signal<Brand[]>([])

  ngOnInit(): void {
    void this.init()
  }

  private async init(): Promise<void> {
    // On the client, rehydrate from TransferState instead of re-fetching.
    if (isPlatformBrowser(this.platformId)) {
      const miscData        = this.state.get(MISC_KEY, null)
      const aboutsData      = this.state.get(ABOUTS_KEY, null)
      const skillsData      = this.state.get(SKILLS_KEY, null)
      const worksData       = this.state.get(WORKS_KEY, null)
      const experiencesData = this.state.get(EXPERIENCES_KEY, null)
      const testimonialsData = this.state.get(TESTIMONIALS_KEY, null)
      const brandsData      = this.state.get(BRANDS_KEY, null)

      if (aboutsData !== null) {
        this.misc.set(miscData)
        this.abouts.set(aboutsData)
        this.skills.set(skillsData ?? [])
        this.works.set(worksData ?? [])
        this.experiences.set(experiencesData ?? [])
        this.testimonials.set(testimonialsData ?? [])
        this.brands.set(brandsData ?? [])
        this.applySeo(miscData)
        return
      }
    }

    // Server-side (or client with no cached state): fetch from Sanity.
    const [misc, abouts, skills, works, experiences, testimonials, brands] =
      await Promise.allSettled([
        getMiscellaneous(),
        getAbouts(),
        getSkills(),
        getWorks(),
        getExperiences(),
        getTestimonials(),
        getBrands(),
      ] as const)

    const miscData        = misc.status          === 'fulfilled' ? misc.value          : null
    const aboutsData      = abouts.status        === 'fulfilled' ? abouts.value        : []
    const skillsData      = skills.status        === 'fulfilled' ? skills.value        : []
    const worksData       = works.status         === 'fulfilled' ? works.value         : []
    const experiencesData = experiences.status   === 'fulfilled' ? experiences.value   : []
    const testimonialsData = testimonials.status === 'fulfilled' ? testimonials.value  : []
    const brandsData      = brands.status        === 'fulfilled' ? brands.value        : []

    this.misc.set(miscData)
    this.abouts.set(aboutsData)
    this.skills.set(skillsData)
    this.works.set(worksData)
    this.experiences.set(experiencesData)
    this.testimonials.set(testimonialsData)
    this.brands.set(brandsData)

    // Store in TransferState so the client can hydrate without re-fetching.
    this.state.set(MISC_KEY, miscData)
    this.state.set(ABOUTS_KEY, aboutsData)
    this.state.set(SKILLS_KEY, skillsData)
    this.state.set(WORKS_KEY, worksData)
    this.state.set(EXPERIENCES_KEY, experiencesData)
    this.state.set(TESTIMONIALS_KEY, testimonialsData)
    this.state.set(BRANDS_KEY, brandsData)

    this.applySeo(miscData)
  }

  private applySeo(miscData: Miscellaneous | null): void {
    const name = miscData?.name ?? 'Your Name'
    this.seo.set({
      title: miscData?.title ?? 'Developer & Designer',
      description: `${name} — ${miscData?.title ?? 'Full Stack Developer'}. ${miscData?.greeting ?? ''}`.trim(),
      url: '/',
    })
    this.seo.injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name,
      url: 'https://yourportfolio.com',
      jobTitle: miscData?.title ?? 'Full Stack Developer',
    })
  }
}
