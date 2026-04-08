import { ChangeDetectionStrategy, Component, computed, input, signal, ElementRef, ViewChild } from '@angular/core'
import type { Work } from '../../../../types/index'

const PAGE_SIZE = 6

@Component({
  selector: 'app-works',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <section #sectionEl id="works" aria-labelledby="works-heading" class="py-24">

      <div class="mb-8">
        <p class="font-mono text-sm text-primary mb-2">// my_works()</p>
        <h2 id="works-heading" class="section-heading">Works</h2>
      </div>

      <!-- Tag filter pills -->
      @if (allTags().length > 1) {
        <div class="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter projects by tag">
          @for (tag of allTags(); track tag) {
            <button
              type="button"
              (click)="setFilter(tag)"
              [attr.aria-pressed]="activeFilter() === tag"
              class="rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                     focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              [class]="activeFilter() === tag
                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'"
            >
              {{ tag }}
            </button>
          }
        </div>
      }

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        @for (work of pagedItems(); track work.title) {
          <article
            class="group flex flex-col rounded-xl border border-border bg-card
                   overflow-hidden card-hover"
            data-testid="work-card"
          >
            <!-- Image with hover overlay -->
            @if (work.imgUrl) {
              <div class="relative overflow-hidden h-48 flex items-center justify-center p-4"
                   style="background: linear-gradient(135deg, hsl(220 30% 24%) 0%, hsl(220 30% 30%) 100%)">
                <img
                  [src]="work.imgUrl"
                  [alt]="work.title + ' screenshot'"
                  class="max-w-full max-h-full w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div class="absolute inset-0 flex items-center justify-center gap-4
                            bg-background/80 opacity-0 group-hover:opacity-100
                            transition-opacity duration-300">
                  @if (work.projectLink) {
                    <a
                      [href]="work.projectLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      [attr.aria-label]="'Visit ' + work.title + ' (opens in new tab)'"
                      class="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2
                             text-xs font-semibold text-primary-foreground hover:brightness-110"
                    >
                      Live
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                           viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                           aria-hidden="true">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
                      </svg>
                    </a>
                  }
                  @if (work.codeLink) {
                    <a
                      [href]="work.codeLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      [attr.aria-label]="'View source code for ' + work.title + ' (opens in new tab)'"
                      class="flex items-center gap-1.5 rounded-lg border border-border
                             bg-card px-4 py-2 text-xs font-semibold text-foreground
                             hover:border-primary/50"
                    >
                      Code
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
                           viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                           aria-hidden="true">
                        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                      </svg>
                    </a>
                  }
                </div>
              </div>
            }

            <div class="flex flex-1 flex-col gap-3 p-5">
              <h3 class="font-semibold text-foreground group-hover:text-primary transition-colors">
                {{ work.title }}
              </h3>
              <p class="flex-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {{ work.description }}
              </p>

              <div class="flex flex-wrap gap-1.5 pt-1">
                @for (tag of work.tags; track tag) {
                  <span class="rounded-md bg-primary/10 border border-primary/20
                               px-2.5 py-0.5 text-xs font-medium text-primary">
                    {{ tag }}
                  </span>
                }
              </div>

              @if (!work.imgUrl) {
                <div class="flex gap-3 pt-1">
                  @if (work.projectLink) {
                    <a [href]="work.projectLink" target="_blank" rel="noopener noreferrer"
                       class="text-sm font-medium text-primary hover:underline underline-offset-4"
                       [attr.aria-label]="'Visit ' + work.title + ' (opens in new tab)'">
                      Live ↗
                    </a>
                  }
                  @if (work.codeLink) {
                    <a [href]="work.codeLink" target="_blank" rel="noopener noreferrer"
                       class="text-sm text-muted-foreground hover:text-foreground transition-colors"
                       [attr.aria-label]="'View source code for ' + work.title + ' (opens in new tab)'">
                      Code
                    </a>
                  }
                </div>
              }
            </div>
          </article>
        } @empty {
          <p class="text-muted-foreground col-span-3">No works match this filter.</p>
        }
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="mt-10 flex items-center justify-center gap-2"
             role="navigation" aria-label="Project pages">

          <!-- Prev -->
          <button
            type="button"
            (click)="goTo(currentPage() - 1)"
            [disabled]="currentPage() === 1"
            aria-label="Previous page"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-border
                   bg-card text-muted-foreground transition-colors
                   hover:border-primary/50 hover:text-primary
                   disabled:pointer-events-none disabled:opacity-30
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>

          <!-- Page numbers -->
          @for (page of pageNumbers(); track page) {
            @if (page === -1) {
              <span class="px-1 text-muted-foreground select-none">…</span>
            } @else {
              <button
                type="button"
                (click)="goTo(page)"
                [attr.aria-label]="'Page ' + page"
                [attr.aria-current]="currentPage() === page ? 'page' : null"
                class="h-9 min-w-9 rounded-lg border px-2.5 text-sm font-medium transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                [class]="currentPage() === page
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'"
              >
                {{ page }}
              </button>
            }
          }

          <!-- Next -->
          <button
            type="button"
            (click)="goTo(currentPage() + 1)"
            [disabled]="currentPage() === totalPages()"
            aria-label="Next page"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-border
                   bg-card text-muted-foreground transition-colors
                   hover:border-primary/50 hover:text-primary
                   disabled:pointer-events-none disabled:opacity-30
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

        </div>
      }

    </section>
  `,
})
export class WorksComponent {
  readonly items = input<Work[]>([])

  @ViewChild('sectionEl') sectionEl!: ElementRef<HTMLElement>

  readonly activeFilter = signal('All')
  readonly currentPage  = signal(1)

  readonly allTags = computed(() => {
    const tags = new Set<string>()
    for (const work of this.items()) {
      for (const tag of work.tags) tags.add(tag)
    }
    return ['All', ...tags]
  })

  readonly filteredItems = computed(() => {
    const filter = this.activeFilter()
    return filter === 'All'
      ? this.items()
      : this.items().filter(w => w.tags.includes(filter))
  })

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredItems().length / PAGE_SIZE))
  )

  readonly pagedItems = computed(() => {
    const page  = this.currentPage()
    const start = (page - 1) * PAGE_SIZE
    return this.filteredItems().slice(start, start + PAGE_SIZE)
  })

  /** Builds a compact page-number array with ellipsis (-1) placeholders. */
  readonly pageNumbers = computed((): number[] => {
    const total   = this.totalPages()
    const current = this.currentPage()
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

    const pages: number[] = [1]
    if (current > 3)          pages.push(-1)
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
      pages.push(p)
    }
    if (current < total - 2)  pages.push(-1)
    pages.push(total)
    return pages
  })

  setFilter(tag: string): void {
    this.activeFilter.set(tag)
    this.currentPage.set(1)
  }

  goTo(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()))
    this.currentPage.set(clamped)
    this.sectionEl?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
