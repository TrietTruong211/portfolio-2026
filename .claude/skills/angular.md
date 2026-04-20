# Skill: Angular 18

## Context
This project uses Angular 18 with standalone components, Signals, and `@angular/ssr` prerendering. The build output is fully static HTML — no Node.js server at runtime. Every route is prerendered to its own `index.html` and deployed to S3 + CloudFront.

---

## Project structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Root shell (skip link, layout)
│   │   ├── app.config.ts             # provideRouter, provideHttpClient, etc.
│   │   ├── app.routes.ts             # Top-level lazy routes
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── theme.service.ts
│   │   │   │   ├── seo.service.ts
│   │   │   │   └── sanity.service.ts
│   │   │   └── guards/
│   │   │       └── auth.guard.ts
│   │   ├── features/
│   │   │   ├── home/                 # Eagerly loaded (homepage)
│   │   │   ├── projects/             # Lazy loaded
│   │   │   └── admin/                # Lazy loaded + auth guard
│   │   ├── shared/
│   │   │   ├── components/           # ProjectCard, SkillBadge, etc.
│   │   │   ├── pipes/
│   │   │   └── ui/                   # Button, Badge, Card primitives
│   │   └── layout/
│   │       ├── header/
│   │       └── footer/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── styles/
│   │   └── globals.scss              # Tailwind + CSS vars
│   └── index.html
├── e2e/                              # Playwright tests
├── angular.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## app.config.ts

```ts
// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideRouter, withPreloading, PreloadAllModules, withInMemoryScrolling } from '@angular/router'
import { provideHttpClient, withFetch } from '@angular/common/http'
import { provideClientHydration } from '@angular/platform-browser'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
    ),
    provideHttpClient(withFetch()),
    provideClientHydration(),
  ],
}
```

---

## Routing — lazy loading

```ts
// src/app/app.routes.ts
import { Routes } from '@angular/router'
import { authGuard } from './core/guards/auth.guard'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Chris — Developer & Designer',
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent),
    title: 'Projects — Chris',
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
]
```

---

## Standalone component pattern

```ts
// src/app/shared/components/project-card/project-card.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgOptimizedImage } from '@angular/common'
import { LucideAngularModule, ExternalLink, Github } from 'lucide-angular'
import type { Project } from '@portfolio/types'

@Component({
  selector: 'app-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, LucideAngularModule],
  template: `
    <article
      class="group rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
      [attr.aria-label]="project().title"
    >
      @if (project().image) {
        <img
          [ngSrc]="project().image!"
          [alt]="project().title + ' screenshot'"
          width="600"
          height="340"
          class="mb-4 rounded-md object-cover w-full"
          loading="lazy"
        />
      }

      <h3 class="text-lg font-semibold text-foreground mb-1">{{ project().title }}</h3>
      <p class="text-sm text-muted-foreground mb-3 line-clamp-2">{{ project().description }}</p>

      <div class="flex flex-wrap gap-1.5 mb-4">
        @for (tag of project().tags; track tag) {
          <span class="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
            {{ tag }}
          </span>
        }
      </div>

      <div class="flex gap-3">
        @if (project().url) {
          <a
            [href]="project().url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            [attr.aria-label]="'Visit ' + project().title + ' (opens in new tab)'"
          >
            <lucide-angular [img]="ExternalLink" size="14" aria-hidden="true" />
            Live site
          </a>
        }
        @if (project().githubUrl) {
          <a
            [href]="project().githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            [attr.aria-label]="'View ' + project().title + ' source code on GitHub (opens in new tab)'"
          >
            <lucide-angular [img]="Github" size="14" aria-hidden="true" />
            Source
          </a>
        }
      </div>
    </article>
  `,
})
export class ProjectCardComponent {
  readonly project = input.required<Project>()
  protected readonly ExternalLink = ExternalLink
  protected readonly Github = Github
}
```

---

## Signals service pattern

```ts
// src/app/core/services/auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { toSignal } from '@angular/core/rxjs-interop'
import { environment } from '../../../environments/environment'
import type { ApiUser } from '@portfolio/types'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient)

  private readonly _user = signal<ApiUser | null>(null)
  readonly user = this._user.asReadonly()
  readonly isAuthenticated = computed(() => this._user() !== null)
  readonly isOwner = computed(() => this._user()?.role === 'owner')

  async checkSession(): Promise<void> {
    try {
      const user = await this.http
        .get<ApiUser>(`${environment.apiUrl}/auth/me`, { withCredentials: true })
        .toPromise()
      this._user.set(user ?? null)
    } catch {
      this._user.set(null)
    }
  }

  async login(email: string, password: string): Promise<void> {
    await this.http
      .post(`${environment.apiUrl}/auth/login`, { email, password }, { withCredentials: true })
      .toPromise()
    await this.checkSession()
  }

  async logout(): Promise<void> {
    await this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .toPromise()
    this._user.set(null)
  }
}
```

---

## @defer for below-the-fold sections

```html
<!-- src/app/features/home/home.component.html -->
<app-hero />

<!-- Immediately after fold — eager load -->
<app-featured-projects />

<!-- Below fold — defer until viewport -->
@defer (on viewport) {
  <app-skills-section />
} @placeholder {
  <div class="h-64 animate-pulse bg-muted rounded-lg" aria-hidden="true"></div>
}

@defer (on viewport) {
  <app-work-experience />
} @placeholder {
  <div class="h-48 animate-pulse bg-muted rounded-lg" aria-hidden="true"></div>
}

@defer (on viewport) {
  <app-chatbot />
} @loading (minimum 300ms) {
  <div class="h-12 animate-pulse bg-muted rounded-full" aria-hidden="true"></div>
}
```

---

## SSG (prerender) configuration

```ts
// angular.json (server target)
{
  "prerender": {
    "builder": "@angular-devkit/build-angular:prerender",
    "options": {
      "routes": ["/", "/projects"],
      "discoverRoutes": true
    }
  }
}
```

```ts
// app.config.server.ts
import { ApplicationConfig, mergeApplicationConfigs } from '@angular/core'
import { provideServerRendering } from '@angular/platform-server'
import { appConfig } from './app.config'

export const serverConfig: ApplicationConfig = mergeApplicationConfigs(appConfig, {
  providers: [provideServerRendering()],
})
```

**Prerender rules:**
- Dynamic data (Sanity content) is fetched during the build via `APP_INITIALIZER` or route resolvers
- The prerendered HTML includes the full content — no blank shell with a loading spinner
- Client-only features (chatbot, admin) are hydrated after load using `isPlatformBrowser()` guard

---

## isPlatformBrowser guard (for SSR-safe code)

```ts
import { isPlatformBrowser } from '@angular/common'
import { inject, PLATFORM_ID } from '@angular/core'

// In a service or component:
private readonly platformId = inject(PLATFORM_ID)

get isBrowser(): boolean {
  return isPlatformBrowser(this.platformId)
}

// Usage: only run browser-only code (localStorage, window) inside this guard
if (this.isBrowser) {
  localStorage.setItem('color-theme', preset)
}
```

---

## ThemeService

```ts
// src/app/core/services/theme.service.ts
import { Injectable, signal, inject, PLATFORM_ID, effect } from '@angular/core'
import { DOCUMENT, isPlatformBrowser } from '@angular/common'

export type ColorPreset = 'zinc' | 'rose' | 'blue' | 'green' | 'violet'
export type ThemeMode = 'light' | 'dark' | 'system'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT)
  private readonly platformId = inject(PLATFORM_ID)

  readonly mode = signal<ThemeMode>('system')
  readonly colorPreset = signal<ColorPreset>('zinc')

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null
      const savedPreset = localStorage.getItem('color-preset') as ColorPreset | null
      if (savedMode) this.mode.set(savedMode)
      if (savedPreset) this.colorPreset.set(savedPreset)

      effect(() => {
        this.applyMode(this.mode())
        this.applyPreset(this.colorPreset())
      })
    }
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode)
    localStorage.setItem('theme-mode', mode)
  }

  setPreset(preset: ColorPreset): void {
    this.colorPreset.set(preset)
    localStorage.setItem('color-preset', preset)
  }

  private applyMode(mode: ThemeMode): void {
    const isDark = mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    this.doc.documentElement.classList.toggle('dark', isDark)
  }

  private applyPreset(preset: ColorPreset): void {
    this.doc.documentElement.setAttribute('data-preset', preset)
  }
}
```

---

## Route guard (auth)

```ts
// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from '../services/auth.service'

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService)
  const router = inject(Router)

  await auth.checkSession()

  if (!auth.isOwner()) {
    return router.createUrlTree(['/'])
  }
  return true
}
```

---

## Angular unit test pattern (Jasmine)

```ts
// src/app/shared/components/project-card/project-card.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ProjectCardComponent } from './project-card.component'
import type { Project } from '@portfolio/types'

const mockProject: Project = {
  title: 'Test Project',
  slug: 'test-project',
  description: 'A test project',
  tags: ['Angular', 'TypeScript'],
  techStack: ['Angular', 'Fastify'],
  image: null,
  url: 'https://example.com',
  githubUrl: null,
  featured: false,
  order: 1,
}

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(ProjectCardComponent)
    fixture.componentRef.setInput('project', mockProject)
    fixture.detectChanges()
  })

  it('renders the project title', () => {
    const el: HTMLElement = fixture.nativeElement
    expect(el.querySelector('h3')?.textContent).toContain('Test Project')
  })

  it('renders all tags', () => {
    const el: HTMLElement = fixture.nativeElement
    const tags = el.querySelectorAll('span')
    expect(tags.length).toBe(2)
  })
})
```
