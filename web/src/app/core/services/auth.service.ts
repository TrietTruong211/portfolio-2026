import { Injectable, signal, computed, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { ApiUser } from '../../../types/index'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient)

  private readonly _user = signal<ApiUser | null>(null)
  readonly user = this._user.asReadonly()
  readonly isAuthenticated = computed(() => this._user() !== null)
  readonly isOwner = computed(() => this._user()?.role === 'owner')

  async checkSession(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http.get<ApiUser>(`${environment.apiUrl}/auth/me`, { withCredentials: true })
      )
      this._user.set(user)
    } catch {
      this._user.set(null)
    }
  }

  async login(email: string, password: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/login`, { email, password }, { withCredentials: true })
    )
    await this.checkSession()
  }

  async logout(): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
    )
    this._user.set(null)
  }
}
