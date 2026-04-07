import { TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule, HttpClientTestingModule],
    }).compileComponents()
  })

  it('creates the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    expect(fixture.componentInstance).toBeTruthy()
  })

  it('renders skip link as first element', () => {
    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    const el = fixture.nativeElement as HTMLElement
    const skipLink = el.querySelector('a[href="#main-content"]')
    expect(skipLink).toBeTruthy()
    expect(skipLink?.textContent?.trim()).toBe('Skip to main content')
  })

  it('renders main landmark with correct id', () => {
    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    const el = fixture.nativeElement as HTMLElement
    expect(el.querySelector('main#main-content')).toBeTruthy()
  })
})
