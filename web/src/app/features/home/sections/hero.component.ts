import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import type { Miscellaneous } from '../../../../types/index'

@Component({
  selector: 'app-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  template: `
    <section
      class="relative min-h-screen hero-bg overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <!-- Grid overlay -->
      <div class="absolute inset-0 grid-overlay opacity-40 pointer-events-none" aria-hidden="true"></div>

      <!-- Radial glow -->
      <div
        class="absolute -top-40 -right-40 h-96 w-96 rounded-full pointer-events-none"
        style="background: radial-gradient(circle, hsl(15 90% 59% / 0.08) 0%, transparent 70%)"
        aria-hidden="true"
      ></div>

      <div class="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="flex min-h-screen flex-col items-center justify-center gap-12
                    pt-20 pb-16 lg:flex-row lg:justify-between lg:gap-16">

          <!-- Text side -->
          <div class="flex flex-col items-center text-center lg:items-start lg:text-left lg:max-w-xl">

            <p class="font-mono text-sm text-primary mb-4 animate-fade-in"
               aria-hidden="true">
              &lt; Hello, World! /&gt;
            </p>

            <h1 id="hero-heading" class="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              <span class="block text-foreground">I'm</span>
              <span class="block text-gradient mt-1">{{ data()?.name ?? 'Your Name' }}</span>
            </h1>

            <p class="mt-5 text-lg text-muted-foreground sm:text-xl max-w-md">
              {{ data()?.title ?? 'Full Stack Developer' }}
            </p>

            <div class="mt-8 flex flex-wrap items-center gap-4 justify-center lg:justify-start">
              <a
                href="#works"
                class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3
                       text-sm font-semibold text-primary-foreground
                       transition-all duration-200 hover:brightness-110
                       hover:shadow-lg hover:shadow-primary/30
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-primary focus-visible:ring-offset-2
                       focus-visible:ring-offset-background"
              >
                View My Work
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </a>

              @if (data()?.resume) {
                <a
                  [href]="data()!.resume!"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 rounded-lg border border-border
                         px-6 py-3 text-sm font-semibold text-foreground
                         transition-all duration-200 hover:border-primary/50
                         hover:text-primary hover:bg-primary/5
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-primary focus-visible:ring-offset-2
                         focus-visible:ring-offset-background"
                  aria-label="Download resume (opens in new tab)"
                >
                  Download CV
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" x2="12" y1="15" y2="3"/>
                  </svg>
                </a>
              }
            </div>

          </div>

          <!-- Image side -->
          @if (data()?.profileImage) {
            <div class="relative shrink-0" aria-hidden="true">
              <!-- Glow ring -->
              <div class="absolute inset-0 rounded-full"
                   style="background: conic-gradient(from 0deg, hsl(15 90% 59%), hsl(220 36% 20%), hsl(15 90% 59%));
                          padding: 3px; border-radius: 9999px;">
                <div class="h-full w-full rounded-full"
                     style="background: hsl(220 41% 10%)"></div>
              </div>
              <div class="relative rounded-full overflow-hidden
                          h-56 w-56 sm:h-64 sm:w-64 lg:h-72 lg:w-72
                          ring-2 ring-primary/40 ring-offset-4 ring-offset-background"
                   style="box-shadow: 0 0 60px hsl(15 90% 59% / 0.15)">
                <img
                  [ngSrc]="data()!.profileImage!"
                  [alt]="'Profile photo of ' + data()?.name"
                  fill
                  priority
                  class="object-cover"
                />
              </div>
            </div>
          }

        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
           aria-hidden="true">
        <span class="text-xs font-mono text-muted-foreground">scroll</span>
        <div class="h-8 w-px bg-gradient-to-b from-muted-foreground to-transparent"></div>
      </div>

    </section>
  `,
})
export class HeroComponent {
  readonly data = input<Miscellaneous | null>(null)
}
