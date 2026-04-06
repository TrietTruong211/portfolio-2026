# Skill: Tailwind CSS + Theming (Angular)

## Context
Tailwind CSS v3 with class-based dark mode. The <html> element receives class="dark" and data-preset="..." attributes toggled by ThemeService. No next-themes -- Angular's DOCUMENT injection handles this directly.

---

## Shared config

```ts
// packages/config/tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['../../apps/web/src/**/*.{ts,html}'],
  theme: {
    extend: {
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

---

## CSS variables (globals.scss)

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }

  /* tweakcn presets */
  [data-preset="rose"]   { --primary: 346.8 77.2% 49.8%; --primary-foreground: 355.7 100% 97.3%; --ring: 346.8 77.2% 49.8%; }
  [data-preset="blue"]   { --primary: 221.2 83.2% 53.3%; --primary-foreground: 210 40% 98%;      --ring: 221.2 83.2% 53.3%; }
  [data-preset="green"]  { --primary: 142.1 76.2% 36.3%; --primary-foreground: 355.7 100% 97.3%; --ring: 142.1 76.2% 36.3%; }
  [data-preset="violet"] { --primary: 262.1 83.3% 57.8%; --primary-foreground: 210 40% 98%;      --ring: 262.1 83.3% 57.8%; }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground antialiased; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

---

## PostCSS config

```js
// apps/web/postcss.config.js  ← must live here; Angular CLI reads it automatically
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Angular's esbuild builder runs SASS first, then feeds the output through PostCSS. This means `@apply` directives in `.scss` files are resolved by Tailwind/PostCSS after SASS has run — no extra plugins or hacks needed.

Install if not already present:
```bash
pnpm --filter web add -D postcss autoprefixer
```

---

## Tailwind usage rules

1. Semantic color tokens only -- bg-background, text-foreground, bg-primary etc. Never hardcode bg-zinc-900
2. Dark mode is automatic -- CSS vars adapt via .dark class; never write dark: variants for color tokens
3. No arbitrary values -- w-[347px] is forbidden unless no Tailwind equivalent exists
4. No inline style bindings for visual styling -- use Tailwind classes
5. Always use cn() utility for conditional class merging

```ts
// src/app/core/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```
