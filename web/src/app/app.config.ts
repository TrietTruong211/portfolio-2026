import type { ApplicationConfig } from '@angular/core'
import { provideZoneChangeDetection, APP_INITIALIZER, inject, PLATFORM_ID } from '@angular/core'
import { provideRouter, withPreloading, PreloadAllModules, withInMemoryScrolling, withRouterConfig } from '@angular/router'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { provideClientHydration } from '@angular/platform-browser'
import { isPlatformBrowser } from '@angular/common'
import { routes } from './app.routes'
import { AuthService } from './core/services/auth.service'
import { authInterceptor } from './core/interceptors/auth.interceptor'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const auth       = inject(AuthService)
        const platformId = inject(PLATFORM_ID)
        return (): Promise<void> =>
          isPlatformBrowser(platformId) ? auth.checkSession() : Promise.resolve()
      },
      multi: true,
    },
  ],
}
