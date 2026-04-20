import { inject } from '@angular/core'
import type { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http'
import { HttpClient } from '@angular/common/http'
import { catchError, finalize, shareReplay, switchMap, take } from 'rxjs/operators'
import { throwError } from 'rxjs'
import type { Observable } from 'rxjs'
import { Router } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { environment } from '../../../environments/environment'

const AUTH_ENDPOINT = /\/auth\/(login|register|refresh|logout|me)(\?|$|\/)/

let refreshInFlight$: Observable<unknown> | null = null

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http   = inject(HttpClient)
  const auth   = inject(AuthService)
  const router = inject(Router)

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || AUTH_ENDPOINT.test(req.url)) {
        return throwError(() => error)
      }

      if (!refreshInFlight$) {
        refreshInFlight$ = http
          .post(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
          .pipe(
            take(1),
            shareReplay(1),
            finalize(() => { refreshInFlight$ = null }),
          )
      }

      return refreshInFlight$.pipe(
        switchMap(() => next(req)),
        catchError(() => {
          auth.clearSession()
          void router.navigate(['/login'])
          return throwError(() => error)
        })
      )
    })
  )
}
