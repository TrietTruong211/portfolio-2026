import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import type { Testimonial } from '../../../../types/index'

@Component({
  selector: 'app-testimonials',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  template: `
    <section id="testimonials" aria-labelledby="testimonials-heading" class="py-24">

      <div class="mb-12">
        <p class="font-mono text-sm text-primary mb-2">// what_they_say()</p>
        <h2 id="testimonials-heading" class="section-heading">Testimonials</h2>
      </div>

      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        @for (t of items(); track t.name) {
          <article
            class="relative flex flex-col justify-between rounded-xl border border-border
                   bg-card p-6 card-hover overflow-hidden"
          >
            <!-- Decorative quote mark -->
            <span
              class="absolute right-4 top-2 font-serif text-7xl font-bold leading-none
                     text-primary/10 select-none pointer-events-none"
              aria-hidden="true"
            >"</span>

            <!-- Feedback -->
            <p class="relative z-10 text-sm text-muted-foreground leading-relaxed">
              "{{ t.feedback }}"
            </p>

            <!-- Person -->
            <div class="mt-6 flex items-center gap-3">
              @if (t.imgUrl) {
                <div class="relative h-10 w-10 shrink-0 overflow-hidden rounded-full
                            ring-2 ring-primary/30">
                  <img
                    [ngSrc]="t.imgUrl"
                    [alt]="t.name"
                    fill
                    class="object-cover"
                    loading="lazy"
                  />
                </div>
              } @else {
                <div class="flex h-10 w-10 shrink-0 items-center justify-center
                            rounded-full bg-primary/10 border border-primary/20">
                  <span class="text-sm font-bold text-primary">
                    {{ t.name.charAt(0) }}
                  </span>
                </div>
              }
              <div>
                <p class="text-sm font-semibold text-foreground">{{ t.name }}</p>
                <p class="text-xs text-primary">{{ t.company }}</p>
              </div>
            </div>
          </article>
        } @empty {
          <p class="text-muted-foreground">No testimonials yet.</p>
        }
      </div>

    </section>
  `,
})
export class TestimonialsComponent {
  readonly items = input<Testimonial[]>([])
}
