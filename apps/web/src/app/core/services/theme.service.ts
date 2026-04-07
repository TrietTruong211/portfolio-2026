import { Injectable, signal, inject, PLATFORM_ID, effect } from '@angular/core'
import { DOCUMENT, isPlatformBrowser } from '@angular/common'

export type ColorPreset = 'zinc' | 'rose' | 'blue' | 'green' | 'violet'
export type ThemeMode = 'light' | 'dark' | 'system'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT)
  private readonly platformId = inject(PLATFORM_ID)

  readonly mode = signal<ThemeMode>('system')
  readonly colorPreset = signal<ColorPreset>('zinc')

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null
      const savedPreset = localStorage.getItem('color-preset') as ColorPreset | null
      if (savedMode) this.mode.set(savedMode)
      if (savedPreset) this.colorPreset.set(savedPreset)

      effect(() => {
        this.applyMode(this.mode())
        this.applyPreset(this.colorPreset())
      })
    }
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode)
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme-mode', mode)
    }
  }

  setPreset(preset: ColorPreset): void {
    this.colorPreset.set(preset)
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('color-preset', preset)
    }
  }

  private applyMode(mode: ThemeMode): void {
    const isDark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    this.doc.documentElement.classList.toggle('dark', isDark)
  }

  private applyPreset(preset: ColorPreset): void {
    this.doc.documentElement.setAttribute('data-preset', preset)
  }
}
