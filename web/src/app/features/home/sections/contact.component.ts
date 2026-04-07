import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { environment } from '../../../../environments/environment'
import type { ContactFormData } from '../../../../types/index'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

@Component({
  selector: 'app-contact',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <section aria-labelledby="contact-heading" class="py-16">
      <h2 id="contact-heading" class="mb-10 text-3xl font-bold text-foreground">Get In Touch</h2>

      @if (status() === 'success') {
        <div
          role="status"
          aria-live="polite"
          class="rounded-lg border border-border bg-card p-6 text-center"
        >
          <p class="text-lg font-medium text-foreground">Message sent!</p>
          <p class="mt-1 text-sm text-muted-foreground">Thanks for reaching out — I'll get back to you soon.</p>
          <button
            type="button"
            (click)="reset()"
            class="mt-4 text-sm text-primary hover:underline underline-offset-4"
          >
            Send another message
          </button>
        </div>
      } @else {
        <form
          #contactForm="ngForm"
          (ngSubmit)="submit()"
          novalidate
          class="flex flex-col gap-5 max-w-lg"
          aria-label="Contact form"
        >
          <div class="flex flex-col gap-1.5">
            <label for="contact-name" class="text-sm font-medium text-foreground">
              Name <span aria-hidden="true" class="text-destructive">*</span>
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              [(ngModel)]="form.name"
              autocomplete="name"
              class="rounded-md border border-input bg-background px-3 py-2 text-sm
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                     disabled:opacity-50"
              [disabled]="status() === 'submitting'"
              placeholder="Your name"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="contact-email" class="text-sm font-medium text-foreground">
              Email <span aria-hidden="true" class="text-destructive">*</span>
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              [(ngModel)]="form.email"
              autocomplete="email"
              class="rounded-md border border-input bg-background px-3 py-2 text-sm
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                     disabled:opacity-50"
              [disabled]="status() === 'submitting'"
              placeholder="you@example.com"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="contact-message" class="text-sm font-medium text-foreground">
              Message <span aria-hidden="true" class="text-destructive">*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              [(ngModel)]="form.message"
              rows="5"
              class="rounded-md border border-input bg-background px-3 py-2 text-sm
                     text-foreground placeholder:text-muted-foreground resize-y
                     focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                     disabled:opacity-50"
              [disabled]="status() === 'submitting'"
              placeholder="Tell me about your project..."
            ></textarea>
          </div>

          @if (status() === 'error') {
            <p role="alert" class="text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
          }

          <div aria-live="polite" class="sr-only">
            @if (status() === 'submitting') { Sending your message... }
          </div>

          <button
            type="submit"
            [disabled]="status() === 'submitting' || contactForm.invalid"
            class="self-start rounded-md bg-primary px-6 py-2.5 text-sm font-medium
                   text-primary-foreground transition-opacity hover:opacity-90
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                   focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {{ status() === 'submitting' ? 'Sending...' : 'Send Message' }}
          </button>
        </form>
      }
    </section>
  `,
})
export class ContactComponent {
  private readonly http = inject(HttpClient)
  private readonly platformId = inject(PLATFORM_ID)

  readonly status = signal<FormStatus>('idle')

  form: ContactFormData = { name: '', email: '', message: '' }

  async submit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return
    if (!this.form.name || !this.form.email || !this.form.message) return

    this.status.set('submitting')
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/contact`, this.form)
      )
      this.status.set('success')
    } catch {
      this.status.set('error')
    }
  }

  reset(): void {
    this.form = { name: '', email: '', message: '' }
    this.status.set('idle')
  }
}
