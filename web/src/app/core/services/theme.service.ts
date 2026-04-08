import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core'
import { DOCUMENT, isPlatformBrowser } from '@angular/common'

export type ThemePreset = {
  id: string
  label: string
  dark: boolean
  swatch: string
  vars: Record<string, string>
}

export const THEME_PRESETS: ThemePreset[] = [
  // ── Dark themes ──────────────────────────────────────────────
  {
    id: 'ember', label: 'Ember', dark: true, swatch: '#f46737',
    vars: {
      '--background':           '220 41% 10%',
      '--foreground':           '213 31% 91%',
      '--card':                 '220 36% 20%',
      '--card-foreground':      '213 31% 91%',
      '--primary':              '15 90% 59%',
      '--primary-foreground':   '0 0% 100%',
      '--secondary':            '220 36% 20%',
      '--secondary-foreground': '213 31% 91%',
      '--muted':                '220 36% 16%',
      '--muted-foreground':     '215 20% 55%',
      '--accent':               '15 90% 59%',
      '--accent-foreground':    '0 0% 100%',
      '--border':               '220 30% 24%',
      '--input':                '220 36% 20%',
      '--ring':                 '15 90% 59%',
    },
  },
  {
    id: 'midnight', label: 'Midnight', dark: true, swatch: '#a78bfa',
    vars: {
      '--background':           '240 8% 7%',
      '--foreground':           '240 15% 90%',
      '--card':                 '240 8% 13%',
      '--card-foreground':      '240 15% 90%',
      '--primary':              '262 83% 68%',
      '--primary-foreground':   '0 0% 100%',
      '--secondary':            '240 8% 13%',
      '--secondary-foreground': '240 15% 90%',
      '--muted':                '240 8% 11%',
      '--muted-foreground':     '240 10% 52%',
      '--accent':               '262 83% 68%',
      '--accent-foreground':    '0 0% 100%',
      '--border':               '240 8% 18%',
      '--input':                '240 8% 13%',
      '--ring':                 '262 83% 68%',
    },
  },
  {
    id: 'ocean', label: 'Ocean', dark: true, swatch: '#06b6d4',
    vars: {
      '--background':           '200 40% 8%',
      '--foreground':           '196 30% 90%',
      '--card':                 '200 35% 15%',
      '--card-foreground':      '196 30% 90%',
      '--primary':              '186 90% 48%',
      '--primary-foreground':   '200 40% 8%',
      '--secondary':            '200 35% 15%',
      '--secondary-foreground': '196 30% 90%',
      '--muted':                '200 35% 12%',
      '--muted-foreground':     '200 20% 52%',
      '--accent':               '186 90% 48%',
      '--accent-foreground':    '200 40% 8%',
      '--border':               '200 30% 20%',
      '--input':                '200 35% 15%',
      '--ring':                 '186 90% 48%',
    },
  },
  // ── Light themes ─────────────────────────────────────────────
  {
    id: 'paper', label: 'Paper', dark: false, swatch: '#d97706',
    vars: {
      '--background':           '40 30% 97%',
      '--foreground':           '220 30% 12%',
      '--card':                 '0 0% 100%',
      '--card-foreground':      '220 30% 12%',
      '--primary':              '38 92% 44%',
      '--primary-foreground':   '0 0% 100%',
      '--secondary':            '40 20% 92%',
      '--secondary-foreground': '220 30% 12%',
      '--muted':                '40 20% 93%',
      '--muted-foreground':     '220 15% 44%',
      '--accent':               '38 92% 44%',
      '--accent-foreground':    '0 0% 100%',
      '--border':               '40 15% 84%',
      '--input':                '40 20% 93%',
      '--ring':                 '38 92% 44%',
    },
  },
  {
    id: 'cloud', label: 'Cloud', dark: false, swatch: '#7c3aed',
    vars: {
      '--background':           '210 25% 97%',
      '--foreground':           '220 35% 14%',
      '--card':                 '0 0% 100%',
      '--card-foreground':      '220 35% 14%',
      '--primary':              '262 83% 52%',
      '--primary-foreground':   '0 0% 100%',
      '--secondary':            '210 20% 92%',
      '--secondary-foreground': '220 35% 14%',
      '--muted':                '210 20% 92%',
      '--muted-foreground':     '220 15% 45%',
      '--accent':               '262 83% 52%',
      '--accent-foreground':    '0 0% 100%',
      '--border':               '210 15% 84%',
      '--input':                '210 20% 92%',
      '--ring':                 '262 83% 52%',
    },
  },
  {
    id: 'blossom', label: 'Blossom', dark: false, swatch: '#e11d48',
    vars: {
      '--background':           '340 25% 97%',
      '--foreground':           '340 25% 12%',
      '--card':                 '0 0% 100%',
      '--card-foreground':      '340 25% 12%',
      '--primary':              '343 87% 50%',
      '--primary-foreground':   '0 0% 100%',
      '--secondary':            '340 18% 92%',
      '--secondary-foreground': '340 25% 12%',
      '--muted':                '340 18% 93%',
      '--muted-foreground':     '340 10% 46%',
      '--accent':               '343 87% 50%',
      '--accent-foreground':    '0 0% 100%',
      '--border':               '340 15% 84%',
      '--input':                '340 18% 93%',
      '--ring':                 '343 87% 50%',
    },
  },
]

const DEFAULT_ID  = 'ember'
const LS_KEY      = 'portfolio-theme'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc        = inject(DOCUMENT)
  private readonly platformId = inject(PLATFORM_ID)

  readonly activePresetId = signal<string>(DEFAULT_ID)

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return
    const saved = localStorage.getItem(LS_KEY) ?? DEFAULT_ID
    this.apply(saved)
  }

  setPreset(id: string): void {
    this.apply(id)
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(LS_KEY, id)
    }
  }

  private apply(id: string): void {
    const preset = THEME_PRESETS.find(p => p.id === id) ?? THEME_PRESETS[0]!
    const root   = this.doc.documentElement

    for (const [prop, value] of Object.entries(preset.vars)) {
      root.style.setProperty(prop, value)
    }

    root.classList.toggle('dark', preset.dark)
    this.activePresetId.set(preset.id)
  }
}
