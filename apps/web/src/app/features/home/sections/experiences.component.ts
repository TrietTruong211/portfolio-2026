import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import type { Experience } from '@portfolio/types'

@Component({
  selector: 'app-experiences',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="experience-heading" class="py-16">
      <h2 id="experience-heading" class="mb-10 text-3xl font-bold text-foreground">
        Experience
      </h2>

      <div class="flex flex-col gap-10">
        @for (exp of items(); track exp.year) {
          <div class="flex gap-6">
            <!-- Year label -->
            <div class="w-16 shrink-0 text-right">
              <span class="text-sm font-semibold text-muted-foreground">{{ exp.year }}</span>
            </div>

            <!-- Timeline line + items -->
            <div class="relative flex flex-col gap-4 border-l border-border pl-6">
              @for (work of exp.works; track work.name) {
                <article class="relative">
                  <!-- Dot -->
                  <span
                    class="absolute -left-[1.625rem] top-1.5 h-3 w-3 rounded-full border-2
                           border-primary bg-background"
                    aria-hidden="true"
                  ></span>

                  <h3 class="font-semibold text-foreground">{{ work.name }}</h3>
                  <p class="text-sm text-primary">{{ work.company }}</p>
                  <p class="mt-1 text-sm text-muted-foreground leading-relaxed">{{ work.desc }}</p>
                </article>
              }
            </div>
          </div>
        } @empty {
          <p class="text-muted-foreground">No experience entries yet.</p>
        }
      </div>
    </section>
  `,
})
export class ExperiencesComponent {
  readonly items = input<Experience[]>([])
}
