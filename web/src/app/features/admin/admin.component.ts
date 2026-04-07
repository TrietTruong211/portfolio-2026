import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { SeoService } from '../../core/services/seo.service'

@Component({
  selector: 'app-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container mx-auto px-4 py-16">
      <h1 class="text-3xl font-bold text-foreground">Admin</h1>
    </section>
  `,
})
export class AdminComponent implements OnInit {
  private readonly seo = inject(SeoService)

  ngOnInit(): void {
    this.seo.set({
      title: 'Admin',
      description: 'Admin dashboard',
      noIndex: true,
    })
  }
}
