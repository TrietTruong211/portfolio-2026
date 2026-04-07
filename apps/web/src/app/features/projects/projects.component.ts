import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { SeoService } from '../../core/services/seo.service'

@Component({
  selector: 'app-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container mx-auto px-4 py-16">
      <h1 class="text-3xl font-bold text-foreground mb-8">Projects</h1>
    </section>
  `,
})
export class ProjectsComponent implements OnInit {
  private readonly seo = inject(SeoService)

  ngOnInit(): void {
    this.seo.set({
      title: 'Projects',
      description: 'A collection of projects I have built.',
      url: '/projects',
    })
  }
}
