import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { RouterOutlet, Router, NavigationEnd } from '@angular/router'
import { LiveAnnouncer } from '@angular/cdk/a11y'
import { Title } from '@angular/platform-browser'
import { filter } from 'rxjs/operators'
import { ThemeService } from './core/services/theme.service'

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router)
  private readonly announcer = inject(LiveAnnouncer)
  private readonly title = inject(Title)
  // Initialise ThemeService eagerly so it applies theme on first render
  private readonly theme = inject(ThemeService)

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      setTimeout(() => {
        void this.announcer.announce(`Navigated to ${this.title.getTitle()}`, 'polite')
      }, 100)
    })
  }
}
