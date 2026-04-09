import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterOutlet, Router, NavigationEnd } from '@angular/router'
import { LiveAnnouncer } from '@angular/cdk/a11y'
import { Title } from '@angular/platform-browser'
import { filter } from 'rxjs/operators'
import { ThemeService } from './core/services/theme.service'
import { AuthService } from './core/services/auth.service'
import { HeaderComponent } from './shared/components/header.component'
import { FooterComponent } from './shared/components/footer.component'

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router)
  private readonly announcer = inject(LiveAnnouncer)
  private readonly title = inject(Title)
  // Initialise ThemeService eagerly so it applies theme on first render
  private readonly theme = inject(ThemeService)
  private readonly auth  = inject(AuthService)

  ngOnInit(): void {
    void this.auth.checkSession()

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      setTimeout(() => {
        void this.announcer.announce(`Navigated to ${this.title.getTitle()}`, 'polite')
      }, 100)
    })
  }
}
