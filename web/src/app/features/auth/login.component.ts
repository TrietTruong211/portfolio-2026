import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from '../../core/services/auth.service'

type Tab = 'login' | 'register'

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="flex min-h-screen items-center justify-center px-4 py-24
                 bg-background"
          aria-labelledby="auth-heading">

      <div class="w-full max-w-sm">

        <!-- Logo -->
        <a routerLink="/"
           class="mb-8 block text-center font-mono text-xl font-bold text-primary
                  hover:opacity-80 transition-opacity"
           aria-label="Back to home">
          &lt;CM /&gt;
        </a>

        <!-- Tab switcher -->
        <div class="mb-6 flex rounded-lg border border-border bg-card p-1" role="tablist">
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="tab() === 'login'"
            (click)="tab.set('login')"
            class="flex-1 rounded-md py-2 text-sm font-medium transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            [class]="tab() === 'login'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'"
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="tab() === 'register'"
            (click)="tab.set('register')"
            class="flex-1 rounded-md py-2 text-sm font-medium transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            [class]="tab() === 'register'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'"
          >
            Create Account
          </button>
        </div>

        <!-- Card -->
        <div class="rounded-xl border border-border bg-card p-6 shadow-lg shadow-black/20">

          <h1 id="auth-heading" class="mb-1 text-lg font-semibold text-foreground">
            {{ tab() === 'login' ? 'Welcome back' : 'Create an account' }}
          </h1>
          <p class="mb-6 text-sm text-muted-foreground">
            {{ tab() === 'login'
              ? 'Sign in to your account to continue.'
              : 'New accounts are created with user role.' }}
          </p>

          <form (ngSubmit)="submit()" #authForm="ngForm" novalidate class="flex flex-col gap-4">

            <!-- Email -->
            <div class="flex flex-col gap-1.5">
              <label for="auth-email" class="text-sm font-medium text-foreground">Email</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                autocomplete="email"
                placeholder="you@example.com"
                [(ngModel)]="form.email"
                [disabled]="loading()"
                class="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                       text-foreground placeholder:text-muted-foreground
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                       transition-colors disabled:opacity-50"
              />
            </div>

            <!-- Password -->
            <div class="flex flex-col gap-1.5">
              <label for="auth-password" class="text-sm font-medium text-foreground">Password</label>
              <input
                id="auth-password"
                name="password"
                type="password"
                required
                minlength="8"
                [autocomplete]="tab() === 'login' ? 'current-password' : 'new-password'"
                placeholder="Min. 8 characters"
                [(ngModel)]="form.password"
                [disabled]="loading()"
                class="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm
                       text-foreground placeholder:text-muted-foreground
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                       transition-colors disabled:opacity-50"
              />
            </div>

            <!-- Error -->
            @if (error()) {
              <p role="alert" class="rounded-lg border border-destructive/30 bg-destructive/10
                                     px-3.5 py-2.5 text-sm text-destructive">
                {{ error() }}
              </p>
            }

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="loading() || authForm.invalid"
              class="mt-1 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold
                     text-primary-foreground transition-all duration-200
                     hover:brightness-110 hover:shadow-lg hover:shadow-primary/25
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                     focus-visible:ring-offset-2 focus-visible:ring-offset-background
                     disabled:pointer-events-none disabled:opacity-50"
            >
              @if (loading()) {
                <span class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg"
                       fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ tab() === 'login' ? 'Signing in…' : 'Creating account…' }}
                </span>
              } @else {
                {{ tab() === 'login' ? 'Sign In' : 'Create Account' }}
              }
            </button>

          </form>
        </div>

        <p class="mt-4 text-center text-xs text-muted-foreground">
          <a routerLink="/" class="hover:text-primary transition-colors underline underline-offset-4">
            ← Back to portfolio
          </a>
        </p>

      </div>
    </main>
  `,
})
export class LoginComponent {
  private readonly auth   = inject(AuthService)
  private readonly router = inject(Router)

  readonly tab     = signal<Tab>('login')
  readonly loading = signal(false)
  readonly error   = signal<string | null>(null)

  form = { email: '', password: '' }

  async submit(): Promise<void> {
    if (!this.form.email || !this.form.password) return
    this.loading.set(true)
    this.error.set(null)

    try {
      if (this.tab() === 'login') {
        await this.auth.login(this.form.email, this.form.password)
      } else {
        await this.auth.register(this.form.email, this.form.password)
      }
      await this.router.navigate(['/'])
    } catch (err: unknown) {
      const msg = (err as { error?: { error?: string } }).error?.error
      this.error.set(msg ?? (this.tab() === 'login' ? 'Invalid email or password.' : 'Could not create account.'))
    } finally {
      this.loading.set(false)
    }
  }
}
