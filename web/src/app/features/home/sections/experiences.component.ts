import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import type { Experience } from '../../../../types/index'

@Component({
  selector: 'app-experiences',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .tl-entry {
      opacity: 0;
      transform: translateY(32px);
      transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .tl-entry.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .tl-line-fill {
      transform-origin: top center;
      transform: scaleY(0);
      transition: transform 0.1s linear;
    }
  `],
  template: `
    <section #sectionEl id="experience" aria-labelledby="experience-heading" class="py-24">

      <div class="mb-16">
        <p class="font-mono text-sm text-primary mb-2">// experience()</p>
        <h2 id="experience-heading" class="section-heading">Experience</h2>
      </div>

      @if (items().length === 0) {
        <p class="text-muted-foreground">No experience entries yet.</p>
      } @else {
        <div class="relative">

          <!-- Timeline track -->
          <div class="absolute left-4 top-0 bottom-0 w-px bg-border/40" aria-hidden="true"></div>
          <div #lineEl class="tl-line-fill absolute left-4 top-0 bottom-0 w-px bg-primary" aria-hidden="true"></div>

          <div class="flex flex-col gap-12">
            @for (exp of items(); track exp.year; let i = $index) {
              <div #tlEntry class="tl-entry relative pl-12">

                <!-- Dot -->
                <div class="absolute left-4 top-1 -translate-x-1/2 h-3 w-3 rounded-full
                            border-2 border-primary bg-background ring-4 ring-primary/15 z-10"
                     aria-hidden="true"></div>

                <!-- Year -->
                <p class="font-mono text-xs font-semibold text-primary mb-4">{{ exp.year }}</p>

                <!-- Work items -->
                <div class="flex flex-col gap-6">
                  @for (work of exp.works; track work.name) {
                    <article>
                      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                        <h3 class="font-semibold text-foreground">{{ work.name }}</h3>
                        @if (work.company) {
                          <span class="text-sm text-primary/80 font-medium">&#64; {{ work.company }}</span>
                        }
                      </div>
                      <p class="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{{ work.desc }}</p>
                    </article>
                  }
                </div>

              </div>
            }
          </div>

        </div>
      }

    </section>
  `,
})
export class ExperiencesComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly items = input<Experience[]>([])

  @ViewChild('sectionEl') sectionEl!: ElementRef<HTMLElement>
  @ViewChild('lineEl')    lineEl!:    ElementRef<HTMLElement>
  @ViewChildren('tlEntry') tlEntries!: QueryList<ElementRef<HTMLElement>>

  private readonly platformId = inject(PLATFORM_ID)
  private ioObserver:  IntersectionObserver | null = null
  private scrollBound: (() => void) | null = null

  ngOnInit(): void {
    console.log('[Experiences] items:', JSON.stringify(this.items(), null, 2))
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return

    this.ioObserver = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            this.ioObserver?.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12 }
    )

    const observeAll = (): void => {
      for (const item of this.tlEntries) {
        this.ioObserver?.observe(item.nativeElement)
      }
    }
    observeAll()
    this.tlEntries.changes.subscribe(() => observeAll())

    this.scrollBound = (): void => {
      const section = this.sectionEl?.nativeElement
      const line    = this.lineEl?.nativeElement
      if (!section || !line) return
      const rect     = section.getBoundingClientRect()
      const winH     = window.innerHeight
      const progress = Math.max(0, Math.min(1, (winH - rect.top) / (rect.height + winH)))
      line.style.transform = `scaleY(${progress})`
    }

    window.addEventListener('scroll', this.scrollBound, { passive: true })
    this.scrollBound()
  }

  ngOnDestroy(): void {
    this.ioObserver?.disconnect()
    if (this.scrollBound) window.removeEventListener('scroll', this.scrollBound)
  }
}
