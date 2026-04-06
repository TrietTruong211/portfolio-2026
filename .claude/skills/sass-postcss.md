# Skill: SASS + PostCSS in Angular

## Context
Angular 18 processes `.scss` files through SASS first, then pipes the output through PostCSS (Tailwind + autoprefixer). This means `@apply` works inside any `.scss` file — including component stylesheets. SASS is used for mixins, nesting, and `@use`/`@forward` module imports. PostCSS resolves Tailwind utilities.

---

## Pipeline order

```
component.scss
   ↓  SASS compiler   (resolves @use, @forward, nesting, $vars)
   ↓  PostCSS         (resolves @apply, adds vendor prefixes)
   ↓  esbuild         (bundles, minifies)
→  component styles in final CSS
```

---

## File structure

```
apps/web/
├── postcss.config.js             ← PostCSS config (Tailwind + autoprefixer)
└── src/
    └── styles/
        ├── globals.scss          ← Tailwind directives + CSS vars (entry point in angular.json)
        ├── _mixins.scss          ← Shared @apply-based mixins
        ├── _typography.scss      ← Prose and heading patterns
        └── _utilities.scss       ← Custom one-off utility classes
```

Component stylesheets (`*.component.scss`) sit alongside the component and import from `styles/` using `@use`.

---

## PostCSS config

```js
// apps/web/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## globals.scss (entry point)

```scss
// src/styles/globals.scss
@tailwind base;
@tailwind components;
@tailwind utilities;

// CSS custom properties for theming (Tailwind maps to these via tailwind.config.ts)
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    // ... full token list in tailwind-theming.md
    --radius: 0.5rem;
  }
  .dark {
    --background: 240 10% 3.9%;
    // ... dark variants
  }
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

## Shared mixins (_mixins.scss)

Mixins that encapsulate multi-class Tailwind patterns. Import them with `@use` in component stylesheets.

```scss
// src/styles/_mixins.scss

// Card surface — matches the project-card pattern
@mixin card {
  @apply rounded-lg border border-border bg-card p-5 transition-shadow;
}

@mixin card-hover {
  @apply hover:shadow-md hover:border-border/80;
}

// Consistent focus ring — used on all interactive elements
@mixin focus-ring {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}

// Visually hidden but accessible to screen readers
@mixin sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
  clip: rect(0, 0, 0, 0);
}

// Truncate text with ellipsis
@mixin truncate {
  @apply overflow-hidden text-ellipsis whitespace-nowrap;
}

// Flex row, centered both axes
@mixin flex-center {
  @apply flex items-center justify-center;
}

// Responsive container
@mixin container {
  @apply mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8;
}
```

---

## Component stylesheet patterns

### Basic component with @apply

```scss
// project-card.component.scss
@use '../../../styles/mixins' as m;

:host {
  display: block;
}

.card {
  @include m.card;

  &:hover {
    @apply shadow-md;
  }

  &__title {
    @apply text-lg font-semibold text-foreground mb-1;
  }

  &__description {
    @apply text-sm text-muted-foreground mb-3 line-clamp-2;
  }

  &__tags {
    @apply flex flex-wrap gap-1.5 mb-4;
  }

  &__tag {
    @apply rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground;
  }
}
```

### Button with multi-state @apply

```scss
// shared/ui/button/button.component.scss

.btn {
  @apply inline-flex items-center justify-center gap-2 rounded-md font-medium;
  @apply transition-colors duration-150;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
  @apply disabled:pointer-events-none disabled:opacity-50;

  // Variants
  &--primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90;
  }

  &--secondary {
    @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
  }

  &--ghost {
    @apply hover:bg-accent hover:text-accent-foreground;
  }

  &--destructive {
    @apply bg-destructive text-destructive-foreground hover:bg-destructive/90;
  }

  // Sizes
  &--sm  { @apply h-8 px-3 text-sm; }
  &--md  { @apply h-10 px-4 text-sm; }
  &--lg  { @apply h-11 px-6 text-base; }
  &--icon { @apply h-10 w-10; }
}
```

### SASS nesting + @apply (responsive)

```scss
// hero.component.scss

.hero {
  @apply py-16 text-center;

  @screen md {
    @apply py-24 text-left;
  }

  &__heading {
    @apply text-4xl font-bold tracking-tight text-foreground;

    @screen md {
      @apply text-5xl;
    }

    @screen lg {
      @apply text-6xl;
    }
  }

  &__sub {
    @apply mt-4 text-lg text-muted-foreground max-w-2xl;
  }

  &__cta {
    @apply mt-8 flex gap-4 justify-center;

    @screen md {
      @apply justify-start;
    }
  }
}
```

---

## Using @use to import mixins

Always use SASS modules (`@use`) — never `@import` (deprecated).

```scss
// Path is relative from the component file's location
@use 'src/styles/mixins' as m;   // from an app-level config path
// or relative:
@use '../../../styles/mixins' as m;

.my-element {
  @include m.card;
  @include m.focus-ring;
}
```

Configure `stylePreprocessorOptions` in `angular.json` to set an include path so you don't need long relative paths:

```json
// angular.json → projects.web.architect.build.options
"stylePreprocessorOptions": {
  "includePaths": ["src/styles"]
}
```

Then use bare imports in any component:
```scss
@use 'mixins' as m;
@use 'typography' as t;
```

---

## Typography (_typography.scss)

```scss
// src/styles/_typography.scss

@mixin prose {
  @apply text-base leading-relaxed text-foreground;

  h2 { @apply text-2xl font-semibold mt-8 mb-3 text-foreground; }
  h3 { @apply text-xl font-medium mt-6 mb-2 text-foreground; }
  p  { @apply mb-4 text-muted-foreground; }
  a  { @apply text-primary underline underline-offset-4 hover:text-primary/80; }
  ul { @apply list-disc pl-6 mb-4 space-y-1 text-muted-foreground; }
  ol { @apply list-decimal pl-6 mb-4 space-y-1 text-muted-foreground; }
  code { @apply rounded bg-muted px-1 py-0.5 text-sm font-mono text-foreground; }
  pre  { @apply rounded-lg bg-muted p-4 overflow-x-auto text-sm font-mono; }
  blockquote {
    @apply border-l-4 border-border pl-4 italic text-muted-foreground my-4;
  }
  hr { @apply border-border my-8; }
}
```

Usage (e.g. rendering Sanity portable text):
```scss
// rich-text.component.scss
@use 'typography' as t;

.prose {
  @include t.prose;
}
```

---

## When to use @apply vs inline Tailwind classes

| Situation | Use |
|-----------|-----|
| Single element, few classes, no variants | Inline in template |
| Multi-state (hover + focus + disabled) on a reusable UI primitive | `@apply` in component `.scss` |
| Shared pattern used across multiple components | `@mixin` in `_mixins.scss` |
| Complex responsive variants (`@screen md`) | `@apply` in `.scss` — cleaner than `md:` chains |
| One-off layout utility | Inline in template |
| BEM-structured component styles | `@apply` in `.scss` with nested `&__element` |

**Rule of thumb:** if you'd write the same 5+ class combination more than once, extract it to a mixin. If it's a single element and has no state variants, keep it inline.

---

## What NOT to do

```scss
// BAD — SASS variables for colors; breaks dark mode and theming
$primary-color: #0f172a;
.btn { color: $primary-color; }

// GOOD — CSS custom properties (themed automatically)
.btn { @apply text-primary; }

// BAD — arbitrary pixel values when Tailwind equivalents exist
.card { padding: 20px; }

// GOOD
.card { @apply p-5; }

// BAD — duplicating Tailwind utilities you could just use inline
@layer utilities {
  .flex-center { display: flex; align-items: center; justify-content: center; }
}

// GOOD — use the mixin for SASS files, or just inline in templates
// Template: class="flex items-center justify-center"
// SCSS: @include m.flex-center;

// BAD — @import (deprecated in SASS)
@import 'mixins';

// GOOD — @use
@use 'mixins' as m;
```

---

## Linting

Add `stylelint` to catch SCSS issues in CI:

```bash
pnpm --filter web add -D stylelint stylelint-config-standard-scss stylelint-config-tailwindcss
```

```json
// apps/web/.stylelintrc.json
{
  "extends": [
    "stylelint-config-standard-scss",
    "stylelint-config-tailwindcss"
  ],
  "rules": {
    "scss/at-rule-no-unknown": [true, {
      "ignoreAtRules": ["tailwind", "apply", "variants", "responsive", "screen", "layer"]
    }],
    "no-descending-specificity": null
  }
}
```

Add to CI:
```bash
pnpm --filter web exec stylelint "src/**/*.scss"
```
