import type {
  OnInit} from '@angular/core';
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
import { environment } from '../../../environments/environment'
import { getFooterInfo } from '../../../lib/sanity/queries'
import type { ContactFormData, FooterInfo } from '../../../types/index'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <footer id="contact" class="border-t border-border bg-card">

      <!-- Contact section -->
      <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div class="grid gap-16 lg:grid-cols-2">

          <!-- Left: form -->
          <div>
            <p class="font-mono text-sm text-primary mb-2">// get_in_touch()</p>
            <h2 class="section-heading">Contact Me</h2>
            <p class="mt-4 text-muted-foreground leading-relaxed">
              Have a project in mind or want to chat? Drop me a message and
              I'll get back to you as soon as possible.
            </p>

            <div class="mt-8">
              @if (status() === 'success') {
                <div
                  role="status"
                  aria-live="polite"
                  class="rounded-lg border border-primary/30 bg-primary/10 p-6 text-center"
                >
                  <p class="text-lg font-semibold text-foreground">Message sent!</p>
                  <p class="mt-1 text-sm text-muted-foreground">
                    Thanks for reaching out — I'll get back to you soon.
                  </p>
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
                  class="flex flex-col gap-5"
                  aria-label="Contact form"
                >
                  <div class="flex flex-col gap-1.5">
                    <label for="footer-name" class="text-sm font-medium text-foreground">
                      Name <span aria-hidden="true" class="text-primary">*</span>
                    </label>
                    <input
                      id="footer-name"
                      name="name"
                      type="text"
                      required
                      [(ngModel)]="form.name"
                      autocomplete="name"
                      placeholder="Your name"
                      class="rounded-lg border border-border bg-background px-4 py-2.5 text-sm
                             text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                             transition-colors disabled:opacity-50"
                      [disabled]="status() === 'submitting'"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label for="footer-email" class="text-sm font-medium text-foreground">
                      Email <span aria-hidden="true" class="text-primary">*</span>
                    </label>
                    <input
                      id="footer-email"
                      name="email"
                      type="email"
                      required
                      [(ngModel)]="form.email"
                      autocomplete="email"
                      placeholder="you@example.com"
                      class="rounded-lg border border-border bg-background px-4 py-2.5 text-sm
                             text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                             transition-colors disabled:opacity-50"
                      [disabled]="status() === 'submitting'"
                    />
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label for="footer-message" class="text-sm font-medium text-foreground">
                      Message <span aria-hidden="true" class="text-primary">*</span>
                    </label>
                    <textarea
                      id="footer-message"
                      name="message"
                      required
                      [(ngModel)]="form.message"
                      rows="5"
                      placeholder="Tell me about your project..."
                      class="rounded-lg border border-border bg-background px-4 py-2.5 text-sm
                             text-foreground placeholder:text-muted-foreground resize-y
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                             transition-colors disabled:opacity-50"
                      [disabled]="status() === 'submitting'"
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
                    class="self-start rounded-lg bg-primary px-7 py-3 text-sm font-semibold
                           text-primary-foreground transition-all duration-200
                           hover:brightness-110 hover:shadow-lg hover:shadow-primary/25
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                           focus-visible:ring-offset-2 focus-visible:ring-offset-background
                           disabled:pointer-events-none disabled:opacity-50"
                  >
                    {{ status() === 'submitting' ? 'Sending...' : 'Send Message' }}
                  </button>
                </form>
              }
            </div>
          </div>

          <!-- Right: contact info -->
          <div class="flex flex-col gap-8 lg:pl-8">
            <div>
              <p class="font-mono text-sm text-primary mb-2">// contact_info()</p>
              <h3 class="text-xl font-semibold text-foreground">Let's build something together</h3>
              <p class="mt-3 text-muted-foreground leading-relaxed">
                I'm currently open to new opportunities. Whether it's a full-time role,
                freelance project, or just a chat — my inbox is always open.
              </p>
            </div>

            <div class="flex flex-col gap-4">
              @if (footerInfo()?.email) {
                <a
                  [href]="'mailto:' + footerInfo()!.email"
                  class="group flex items-center gap-3 text-muted-foreground
                         hover:text-foreground transition-colors duration-200"
                  [attr.aria-label]="'Email ' + footerInfo()!.email"
                >
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center
                               rounded-lg bg-secondary border border-border
                               group-hover:border-primary/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <span class="text-sm">{{ footerInfo()!.email }}</span>
                </a>
              }

              @if (footerInfo()?.phoneNumber) {
                <a
                  [href]="'tel:' + footerInfo()!.phoneNumber"
                  class="group flex items-center gap-3 text-muted-foreground
                         hover:text-foreground transition-colors duration-200"
                  [attr.aria-label]="'Call ' + footerInfo()!.phoneNumber"
                >
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center
                               rounded-lg bg-secondary border border-border
                               group-hover:border-primary/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.34a2 2 0 0 1 1.98-2.18h3a2 2 0 0 1 2 1.72c.13 1 .39 1.97.76 2.91a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1-1a2 2 0 0 1 2.11-.45c.94.37 1.91.63 2.91.76A2 2 0 0 1 22 16.92Z"/>
                    </svg>
                  </span>
                  <span class="text-sm">{{ footerInfo()!.phoneNumber }}</span>
                </a>
              }

              <div class="flex items-center gap-3 text-muted-foreground">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center
                             rounded-lg bg-secondary border border-border">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                <span class="text-sm">Australia</span>
              </div>
            </div>

            <!-- Social links -->
            <div>
              <p class="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Find me on
              </p>
              <div class="flex gap-3">
                <!-- GitHub -->
                <a
                  [href]="socials[0]!.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub (opens in new tab)"
                  class="flex h-10 w-10 items-center justify-center rounded-lg
                         border border-border bg-secondary text-muted-foreground
                         hover:border-primary/50 hover:text-primary transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                       fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"/>
                  </svg>
                </a>
                <!-- LinkedIn -->
                <a
                  [href]="socials[1]!.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn (opens in new tab)"
                  class="flex h-10 w-10 items-center justify-center rounded-lg
                         border border-border bg-secondary text-muted-foreground
                         hover:border-primary/50 hover:text-primary transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                       fill="currentColor" aria-hidden="true">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                    <rect x="2" y="9" width="4" height="12"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Bottom bar -->
      <div class="border-t border-border">
        <div class="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p class="text-xs text-muted-foreground">
              &copy; {{ year }} Chris M. Built with Angular &amp; Fastify.
            </p>
            <p class="font-mono text-xs text-muted-foreground">
              Designed &amp; developed with <span class="text-primary">♥</span>
            </p>
          </div>
        </div>
      </div>

    </footer>
  `,
})
export class FooterComponent implements OnInit {
  private readonly http = inject(HttpClient)
  private readonly platformId = inject(PLATFORM_ID)

  readonly status = signal<FormStatus>('idle')
  readonly footerInfo = signal<FooterInfo | null>(null)
  readonly year = new Date().getFullYear()

  ngOnInit(): void {
    void getFooterInfo().then(info => { this.footerInfo.set(info) })
  }

  form: ContactFormData = { name: '', email: '', message: '' }

  readonly socials = [
    { label: 'GitHub',   href: 'https://github.com/TrietTruong211' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/triet-truong-minh-847971189' },
  ]

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
