import type {
  ElementRef} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
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
      #headerRef
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

          <div class="flex items-center gap-2">

            <!-- Desktop: Nav links -->
            <ul class="hidden md:flex items-center gap-1 sm:gap-2" role="list">
              @for (link of navLinks; track link.label) {
                <li>
                  <a
                    routerLink="/"
                    [fragment]="link.fragment"
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

            <!-- Desktop: Auth button -->
            @if (currentUser()) {
              @if (currentUser()!.role === 'admin') {
                <a
                  routerLink="/admin"
                  class="hidden md:flex h-8 items-center gap-1.5 rounded-lg border border-border
                         bg-card px-3 text-xs font-medium text-muted-foreground
                         transition-colors hover:border-primary/50 hover:text-foreground
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/>
                    <rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
                  </svg>
                  Dashboard
                </a>
              }
              <button
                type="button"
                (click)="logout()"
                class="hidden md:flex h-8 items-center gap-2 rounded-lg border border-border
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
                class="hidden md:flex h-8 items-center gap-1.5 rounded-lg border border-border
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

            <!-- Theme picker (always visible) -->
            <div class="relative ml-1" #pickerRef>
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

            <!-- Hamburger: mobile only -->
            <button
              type="button"
              (click)="toggleMenu()"
              [attr.aria-expanded]="menuOpen()"
              aria-label="Toggle navigation menu"
              class="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-border
                     bg-card text-muted-foreground transition-colors duration-200
                     hover:border-primary/50 hover:text-primary
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              @if (menuOpen()) {
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="4" x2="20" y1="6" y2="6"/>
                  <line x1="4" x2="20" y1="12" y2="12"/>
                  <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              }
            </button>

          </div>
        </nav>
      </div>

      <!-- Mobile full-screen drawer -->
      @if (menuOpen()) {
        <div
          class="mobile-drawer md:hidden absolute inset-x-0 top-0 h-screen flex flex-col"
          style="background: hsl(var(--background));"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <!-- Drawer top bar -->
          <div class="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 border-b border-border">
            <a
              routerLink="/"
              (click)="closeMenu()"
              class="font-mono text-lg font-bold text-primary hover:opacity-80 transition-opacity"
              aria-label="Home"
            >
              &lt;CM /&gt;
            </a>
            <button
              type="button"
              (click)="closeMenu()"
              aria-label="Close navigation menu"
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-border
                     bg-card text-muted-foreground transition-colors
                     hover:border-primary/50 hover:text-primary
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <!-- Nav links -->
          <nav class="flex flex-1 flex-col justify-center px-8 sm:px-12" aria-label="Mobile navigation">
            <ul class="flex flex-col" role="list">
              @for (link of navLinks; track link.label) {
                <li>
                  <a
                    routerLink="/"
                    [fragment]="link.fragment"
                    (click)="closeMenu()"
                    class="block border-b border-border/50 py-5 text-3xl font-bold
                           text-foreground transition-colors hover:text-primary
                           focus-visible:outline-none focus-visible:text-primary"
                  >
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>

            <!-- Auth -->
            <div class="mt-10 flex flex-col gap-3">
              @if (currentUser()) {
                @if (currentUser()!.role === 'admin') {
                  <a
                    routerLink="/admin"
                    (click)="closeMenu()"
                    class="inline-flex items-center gap-2 rounded-lg border border-border
                           bg-card px-5 py-3 text-sm font-medium text-muted-foreground
                           transition-colors hover:border-primary/50 hover:text-foreground
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/>
                      <rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
                    </svg>
                    Dashboard
                  </a>
                }
                <button
                  type="button"
                  (click)="closeMenu(); logout()"
                  class="flex items-center gap-2 rounded-lg border border-border
                         bg-card px-5 py-3 text-sm font-medium text-muted-foreground
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
                  (click)="closeMenu()"
                  class="inline-flex items-center gap-2 rounded-lg border border-border
                         bg-card px-5 py-3 text-sm font-medium text-muted-foreground
                         transition-colors hover:border-primary/50 hover:text-foreground
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Sign in
                </a>
              }
            </div>
          </nav>
        </div>
      }

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
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .mobile-drawer {
      animation: slideInRight 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    }
  `],
})
export class HeaderComponent {
  private readonly platformId = inject(PLATFORM_ID)
  private readonly themeService = inject(ThemeService)
  private readonly authService  = inject(AuthService)

  readonly currentUser = this.authService.user

  @ViewChild('pickerRef') pickerRef!: ElementRef<HTMLElement>
  @ViewChild('headerRef') headerRef!: ElementRef<HTMLElement>

  readonly scrolled   = signal(false)
  readonly pickerOpen = signal(false)
  readonly menuOpen   = signal(false)
  readonly presets    = THEME_PRESETS
  readonly darkPresets  = THEME_PRESETS.filter(p => p.dark)
  readonly lightPresets = THEME_PRESETS.filter(p => !p.dark)
  readonly activeId   = this.themeService.activePresetId

  readonly navLinks = [
    { label: 'About',      fragment: 'about' },
    { label: 'Works',      fragment: 'works' },
    { label: 'Experience', fragment: 'experience' },
    { label: 'Contact',    fragment: 'contact' },
  ]

  async logout(): Promise<void> {
    await this.authService.logout()
  }

  togglePicker(): void {
    this.pickerOpen.update(v => !v)
    if (this.pickerOpen()) this.menuOpen.set(false)
  }

  selectPreset(id: string): void {
    this.themeService.setPreset(id)
    this.pickerOpen.set(false)
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v)
    if (this.menuOpen()) this.pickerOpen.set(false)
  }

  closeMenu(): void {
    this.menuOpen.set(false)
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.scrolled.set(window.scrollY > 20)
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as Node
    if (this.pickerOpen() && !this.pickerRef.nativeElement.contains(target)) {
      this.pickerOpen.set(false)
    }
    if (this.menuOpen() && !this.headerRef.nativeElement.contains(target)) {
      this.menuOpen.set(false)
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.pickerOpen.set(false)
    this.menuOpen.set(false)
  }
}
