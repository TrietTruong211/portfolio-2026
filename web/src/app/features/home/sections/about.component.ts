import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import type { About } from '../../../../types/index'

@Component({
  selector: 'app-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  template: `
    <section aria-labelledby="about-heading" class="py-16">
      <h2 id="about-heading" class="mb-10 text-3xl font-bold text-foreground">About Me</h2>

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        @for (item of items(); track item.title) {
          <article class="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
            @if (item.imgUrl) {
              <img
                [ngSrc]="item.imgUrl"
                [alt]="item.title"
                width="48"
                height="48"
                class="object-contain"
              />
            }
            <h3 class="text-lg font-semibold text-foreground">{{ item.title }}</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">{{ item.description }}</p>
          </article>
        } @empty {
          <p class="text-muted-foreground">No about items yet.</p>
        }
      </div>
    </section>
  `,
})
export class AboutComponent {
  readonly items = input<About[]>([])
}
