import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import type { About } from '../../../../types/index'

@Component({
  selector: 'app-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  template: `
    <section id="about" aria-labelledby="about-heading" class="py-24">

      <div class="mb-12">
        <p class="font-mono text-sm text-primary mb-2">// about_me()</p>
        <h2 id="about-heading" class="section-heading">About Me</h2>
      </div>

      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        @for (item of items(); track item.title) {
          <article
            class="group relative flex flex-col gap-4 rounded-xl border border-border
                   bg-card p-6 card-hover"
          >
            <!-- Top accent line -->
            <div
              class="absolute top-0 left-6 right-6 h-px
                     bg-gradient-to-r from-transparent via-primary/50 to-transparent
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-hidden="true"
            ></div>

            @if (item.imgUrl) {
              <div class="flex h-12 w-12 items-center justify-center rounded-lg
                          bg-primary/10 border border-primary/20">
                <img
                  [ngSrc]="item.imgUrl"
                  [alt]="item.title"
                  width="28"
                  height="28"
                  class="object-contain"
                />
              </div>
            }

            <h3 class="text-base font-semibold text-foreground">{{ item.title }}</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">{{ item.description }}</p>
          </article>
        } @empty {
          <p class="text-muted-foreground col-span-3">No about items yet.</p>
        }
      </div>

    </section>
  `,
})
export class AboutComponent {
  readonly items = input<About[]>([])
}
