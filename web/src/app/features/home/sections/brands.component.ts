import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import type { Brand } from '../../../../types/index'

@Component({
  selector: 'app-brands',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  template: `
    @if (items().length > 0) {
      <section aria-label="Companies and brands" class="py-16 border-t border-border">

        <p class="mb-8 text-center text-xs font-medium uppercase tracking-widest
                   text-muted-foreground">
          Companies &amp; technologies I've worked with
        </p>

        <div class="flex flex-wrap items-center justify-center gap-4">
          @for (brand of items(); track brand.name) {
            @if (brand.url) {
              <a
                [href]="brand.url"
                target="_blank"
                rel="noopener noreferrer"
                [attr.aria-label]="brand.name + ' (opens in new tab)'"
                class="flex h-14 items-center justify-center rounded-lg border border-border
                       bg-card px-5 transition-all duration-300
                       hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
              >
                @if (brand.imgUrl) {
                  <img
                    [ngSrc]="brand.imgUrl"
                    [alt]="brand.name"
                    width="80"
                    height="32"
                    class="h-7 w-auto object-contain grayscale opacity-60
                           transition-all duration-300 group-hover:grayscale-0
                           group-hover:opacity-100"
                    loading="lazy"
                  />
                } @else {
                  <span class="text-sm font-semibold text-muted-foreground">{{ brand.name }}</span>
                }
              </a>
            } @else {
              <div
                class="flex h-14 items-center justify-center rounded-lg border border-border
                       bg-card px-5"
              >
                @if (brand.imgUrl) {
                  <img
                    [ngSrc]="brand.imgUrl"
                    [alt]="brand.name"
                    width="80"
                    height="32"
                    class="h-7 w-auto object-contain grayscale opacity-60"
                    loading="lazy"
                  />
                } @else {
                  <span class="text-sm font-semibold text-muted-foreground">{{ brand.name }}</span>
                }
              </div>
            }
          }
        </div>

      </section>
    }
  `,
})
export class BrandsComponent {
  readonly items = input<Brand[]>([])
}
