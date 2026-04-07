import { inject } from '@angular/core'
import type { CanActivateFn } from '@angular/router'
import { Router } from '@angular/router'
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
