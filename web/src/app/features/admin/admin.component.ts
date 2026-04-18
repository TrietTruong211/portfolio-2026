import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import type { OnInit } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { DatePipe } from '@angular/common'
import { SeoService } from '../../core/services/seo.service'
import { environment } from '../../../environments/environment'
import type { ContactSubmission } from '../../../types/index'

@Component({
  selector: 'app-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="min-h-screen bg-background">

      <main class="mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6">

        <!-- Page heading -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-foreground">Dashboard</h1>
          <p class="mt-1 text-sm text-muted-foreground">Manage your portfolio data</p>
        </div>

        <!-- Contact submissions section -->
        <section aria-labelledby="submissions-heading">
          <div class="mb-4 flex items-center justify-between">
            <h2 id="submissions-heading" class="text-base font-semibold text-foreground">
              Contact Submissions
            </h2>
            @if (!loading() && !error()) {
              <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {{ submissions().length }}
              </span>
            }
          </div>

          @if (loading()) {
            <div class="flex items-center justify-center rounded-xl border border-border bg-card py-16"
                 role="status" aria-label="Loading submissions">
              <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg"
                   fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          } @else if (error()) {
            <div role="alert"
                 class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3
                        text-sm text-destructive">
              {{ error() }}
            </div>
          } @else if (submissions().length === 0) {
            <div class="rounded-xl border border-border bg-card px-6 py-16 text-center">
              <p class="text-sm text-muted-foreground">No submissions yet.</p>
            </div>
          } @else {
            <div class="overflow-hidden rounded-xl border border-border bg-card">
              <ul role="list" class="divide-y divide-border">
                @for (sub of submissions(); track sub.id) {
                  <li class="px-5 py-4">
                    <div class="flex flex-wrap items-start justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-foreground">{{ sub.name }}</p>
                        <a [href]="'mailto:' + sub.email"
                           class="text-xs text-primary hover:underline focus-visible:outline-none
                                  focus-visible:underline">
                          {{ sub.email }}
                        </a>
                      </div>
                      <time [dateTime]="sub.createdAt"
                            class="shrink-0 text-xs text-muted-foreground">
                        {{ sub.createdAt | date:'d MMM y, h:mm a' }}
                      </time>
                    </div>
                    <p class="mt-2 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {{ sub.message }}
                    </p>
                  </li>
                }
              </ul>
            </div>
          }
        </section>

      </main>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private readonly http = inject(HttpClient)
  private readonly seo  = inject(SeoService)

  readonly submissions = signal<ContactSubmission[]>([])
  readonly loading     = signal(true)
  readonly error       = signal<string | null>(null)

  ngOnInit(): void {
    this.seo.set({ title: 'Admin', description: 'Admin dashboard', noIndex: true })
    void this.loadSubmissions()
  }

  private async loadSubmissions(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ data: ContactSubmission[]; total: number; limit: number; offset: number }>(
          `${environment.apiUrl}/api/admin/contact-submissions`,
          { withCredentials: true }
        )
      )
      this.submissions.set(res.data)
    } catch {
      this.error.set('Failed to load submissions. Please try again.')
    } finally {
      this.loading.set(false)
    }
  }
}
