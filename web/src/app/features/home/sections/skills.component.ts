import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import type { Skill } from '../../../../types/index'

@Component({
  selector: 'app-skills',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  template: `
    <section id="skills" aria-labelledby="skills-heading" class="py-24">

      <div class="mb-12">
        <p class="font-mono text-sm text-primary mb-2">// tech_stack()</p>
        <h2 id="skills-heading" class="section-heading">Skills</h2>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        @for (skill of items(); track skill.name) {
          <div
            class="group flex items-center gap-3 rounded-lg border border-border
                   bg-card px-4 py-3 transition-all duration-200
                   hover:border-primary/40 hover:bg-primary/5"
          >
            @if (skill.icon) {
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                [style.background]="skill.bgColor ?? 'hsl(var(--secondary))'"
              >
                <img
                  [ngSrc]="skill.icon"
                  [alt]="skill.name"
                  width="20"
                  height="20"
                  class="object-contain"
                  loading="lazy"
                />
              </div>
            }
            <span class="text-sm font-medium text-foreground truncate
                         group-hover:text-primary transition-colors">
              {{ skill.name }}
            </span>
          </div>
        } @empty {
          <p class="text-muted-foreground col-span-full">No skills listed yet.</p>
        }
      </div>

    </section>
  `,
})
export class SkillsComponent {
  readonly items = input<Skill[]>([])
}
