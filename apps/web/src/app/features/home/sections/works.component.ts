import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import type { Work } from '@portfolio/types'

@Component({
  selector: 'app-works',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  template: `
    <section aria-labelledby="works-heading" class="py-16">
      <h2 id="works-heading" class="mb-10 text-3xl font-bold text-foreground">Works</h2>

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        @for (work of items(); track work.title) {
          <article
            class="flex flex-col rounded-lg border border-border bg-card overflow-hidden"
            data-testid="work-card"
          >
            @if (work.imgUrl) {
              <img
                [ngSrc]="work.imgUrl"
                [alt]="work.title + ' screenshot'"
                width="600"
                height="340"
                class="w-full object-cover"
                loading="lazy"
              />
            }

            <div class="flex flex-1 flex-col gap-3 p-5">
              <h3 class="text-lg font-semibold text-foreground">{{ work.title }}</h3>
              <p class="flex-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {{ work.description }}
              </p>

              <div class="flex flex-wrap gap-1.5">
                @for (tag of work.tags; track tag) {
                  <span class="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                    {{ tag }}
                  </span>
                }
              </div>

              <div class="flex gap-3 pt-1">
                @if (work.projectLink) {
                  <a
                    [href]="work.projectLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-primary hover:underline underline-offset-4"
                    [attr.aria-label]="'Visit ' + work.title + ' (opens in new tab)'"
                  >
                    Live
                  </a>
                }
                @if (work.codeLink) {
                  <a
                    [href]="work.codeLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-muted-foreground hover:text-foreground"
                    [attr.aria-label]="'View source code for ' + work.title + ' (opens in new tab)'"
                  >
                    Code
                  </a>
                }
              </div>
            </div>
          </article>
        } @empty {
          <p class="text-muted-foreground">No works yet.</p>
        }
      </div>
    </section>
  `,
})
export class WorksComponent {
  readonly items = input<Work[]>([])
}
