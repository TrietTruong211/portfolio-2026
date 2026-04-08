import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core'
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common'
import { RouterLink } from '@angular/router'
import { ThemeService, THEME_PRESETS } from '../../core/services/theme.service'
import { AuthService } from '../../core/services/auth.service'

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgTemplateOutlet],
  template: `
    <header
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      [class.scrolled]="scrolled()"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav class="flex h-16 items-center justify-between" aria-label="Main navigation">

          <!-- Logo -->
          <a
            routerLink="/"
            class="font-mono text-lg font-bold text-primary hover:opacity-80 transition-opacity"
            aria-label="Home"
          >
            &lt;CM /&gt;
          </a>

          <div class="flex items-center gap-1 sm:gap-2">
            <!-- Nav links -->
            <ul class="flex items-center gap-1 sm:gap-2" role="list">
              @for (link of navLinks; track link.label) {
                <li>
                  <a
                    [href]="link.href"
                    class="relative px-3 py-2 text-sm font-medium text-muted-foreground
                           transition-colors duration-200 hover:text-foreground
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-primary focus-visible:rounded-md
                           after:absolute after:bottom-0 after:left-3 after:right-3
                           after:h-px after:origin-left after:scale-x-0 after:bg-primary
                           after:transition-transform after:duration-200
                           hover:after:scale-x-100"
                  >
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>

            <!-- Auth button -->
            @if (currentUser()) {
              <button
                type="button"
                (click)="logout()"
                class="flex h-8 items-center gap-2 rounded-lg border border-border
                       bg-card px-3 text-xs font-medium text-muted-foreground
                       transition-colors hover:border-primary/50 hover:text-foreground
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span class="flex h-5 w-5 items-center justify-center rounded-full
                             bg-primary text-[10px] font-bold text-primary-foreground">
                  {{ currentUser()!.role === 'admin' ? 'A' : 'U' }}
                </span>
                Sign out
              </button>
            } @else {
              <a
                routerLink="/login"
                class="flex h-8 items-center gap-1.5 rounded-lg border border-border
                       bg-card px-3 text-xs font-medium text-muted-foreground
                       transition-colors hover:border-primary/50 hover:text-foreground
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Sign in
              </a>
            }

            <!-- Theme picker -->
            <div class="relative ml-2" #pickerRef>
              <button
                type="button"
                (click)="togglePicker()"
                [attr.aria-expanded]="pickerOpen()"
                aria-label="Change accent colour"
                class="flex h-8 w-8 items-center justify-center rounded-lg border border-border
                       bg-card text-muted-foreground transition-colors duration-200
                       hover:border-primary/50 hover:text-primary
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <!-- Palette icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                  <circle cx="8.5"  cy="7.5"  r=".5" fill="currentColor"/>
                  <circle cx="6.5"  cy="12.5" r=".5" fill="currentColor"/>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688
                           0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125
                           a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554
                           C21.965 6.012 17.461 2 12 2z"/>
                </svg>
              </button>

              <!-- Dropdown panel -->
              @if (pickerOpen()) {
                <div
                  role="dialog"
                  aria-label="Theme picker"
                  class="absolute right-0 top-10 z-50 w-44 rounded-xl border border-border
                         bg-card p-3 shadow-xl shadow-black/30"
                >
                  <p class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Dark
                  </p>
                  <div class="grid grid-cols-3 gap-1.5 mb-3">
                    @for (preset of darkPresets; track preset.id) {
                      <ng-container *ngTemplateOutlet="swatchBtn; context: { preset }"/>
                    }
                  </div>

                  <p class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Light
                  </p>
                  <div class="grid grid-cols-3 gap-1.5">
                    @for (preset of lightPresets; track preset.id) {
                      <ng-container *ngTemplateOutlet="swatchBtn; context: { preset }"/>
                    }
                  </div>
                </div>
              }

              <ng-template #swatchBtn let-preset="preset">
                <button
                  type="button"
                  (click)="selectPreset(preset.id)"
                  [attr.aria-label]="preset.label + (activeId() === preset.id ? ' (active)' : '')"
                  [attr.aria-pressed]="activeId() === preset.id"
                  class="group flex flex-col items-center gap-1.5 rounded-lg p-1.5
                         transition-colors hover:bg-secondary
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span
                    class="relative flex h-7 w-7 items-center justify-center rounded-full
                           ring-2 ring-offset-2 ring-offset-card transition-all duration-200"
                    [style.background]="preset.swatch"
                    [class]="activeId() === preset.id
                      ? 'ring-white/60 scale-110'
                      : 'ring-transparent group-hover:ring-white/25'"
                  >
                    @if (activeId() === preset.id) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11"
                           viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"
                           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    }
                  </span>
                  <span class="text-[10px] font-medium text-muted-foreground
                               group-hover:text-foreground transition-colors leading-none">
                    {{ preset.label }}
                  </span>
                </button>
              </ng-template>
            </div>

          </div>

        </nav>
      </div>
    </header>
  `,
  styles: [`
    header {
      background: transparent;
    }
    header.scrolled {
      background: hsl(var(--background) / 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid hsl(var(--border) / 0.7);
      box-shadow: 0 4px 24px hsl(var(--background) / 0.5);
    }
  `],
})
export class HeaderComponent {
  private readonly platformId = inject(PLATFORM_ID)
  private readonly themeService = inject(ThemeService)
  private readonly authService  = inject(AuthService)

  readonly currentUser = this.authService.user

  @ViewChild('pickerRef') pickerRef!: ElementRef<HTMLElement>

  readonly scrolled   = signal(false)
  readonly pickerOpen = signal(false)
  readonly presets    = THEME_PRESETS
  readonly darkPresets  = THEME_PRESETS.filter(p => p.dark)
  readonly lightPresets = THEME_PRESETS.filter(p => !p.dark)
  readonly activeId   = this.themeService.activePresetId

  readonly navLinks = [
    { label: 'About',      href: '#about' },
    { label: 'Works',      href: '#works' },
    { label: 'Experience', href: '#experience' },
    { label: 'Contact',    href: '#contact' },
  ]

  async logout(): Promise<void> {
    await this.authService.logout()
  }

  togglePicker(): void {
    this.pickerOpen.update(v => !v)
  }

  selectPreset(id: string): void {
    this.themeService.setPreset(id)
    this.pickerOpen.set(false)
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.scrolled.set(window.scrollY > 20)
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.pickerOpen()) return
    if (!this.pickerRef?.nativeElement.contains(event.target as Node)) {
      this.pickerOpen.set(false)
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.pickerOpen.set(false)
  }
}
