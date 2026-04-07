import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import type { Miscellaneous } from '@portfolio/types'

@Component({
  selector: 'app-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  template: `
    <section class="flex flex-col items-center gap-8 py-20 text-center md:flex-row md:text-left"
             aria-labelledby="hero-heading">

      @if (data()?.profileImage) {
        <img
          [ngSrc]="data()!.profileImage!"
          alt="Profile photo of {{ data()?.name }}"
          width="300"
          height="300"
          priority
          class="rounded-full object-cover"
        />
      }

      <div>
        <p class="text-lg text-muted-foreground">{{ data()?.greeting }}</p>
        <h1 id="hero-heading" class="mt-2 text-5xl font-bold text-foreground">
          {{ data()?.name }}
        </h1>
        <p class="mt-4 text-2xl text-muted-foreground">{{ data()?.title }}</p>

        @if (data()?.resume) {
          <a
            [href]="data()!.resume!"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium
                   text-primary-foreground transition-opacity hover:opacity-90
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                   focus-visible:ring-offset-2"
            aria-label="Download resume (opens in new tab)"
          >
            Download Resume
          </a>
        }
      </div>
    </section>
  `,
})
export class HeroComponent {
  readonly data = input<Miscellaneous | null>(null)
}
