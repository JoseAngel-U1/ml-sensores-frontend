---
name: Cyber-Athletic Sensor ML
colors:
  background: '#101513'
  surface: '#1B2420'
  primary: '#3D9B72'
  accent: '#83B59C'
  primary-soft: '#26332D'
  text: '#E2E8E4'
  text-secondary: '#A5B4AA'
  on-primary: '#FFFFFF'
  border: 'rgb(165 180 170 / 15%)'
  primary-hover: '#4BAE82'
  error: '#F0A8A3'
  error-background: '#492725'
  error-border: '#87514D'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.08em
  telemetry-display:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system targets high-performance athletes, sports scientists, and biomechanics researchers who interface with real-time biometric tracking and machine learning movement diagnostics. The aesthetic combines tactical telemetry data displays with clean athletic minimalism. It bridges high-density data readouts and rapid, split-second physical comprehension.

The UI avoids decorative skeuomorphism in favor of high-legibility telemetry precision: ultra-crisp line weights, dedicated indicator channels, and clear signal states. The visual tone is technical, disciplined, responsive, and calculated—delivering immediate confidence under dynamic performance conditions.

## Colors

The official dark palette uses less saturated greens and charcoal-gray surfaces for a more restrained, professional appearance. The user manually adjusted these colors in `src/index.css`; the values below match the current `:root[data-theme='dark']` block. The color metadata above lists the implemented semantic tokens instead of the superseded exploratory palette.

### Corrección 2-D — Estado y alcance

**Completada y validada en Android (Xiaomi 11T), según confirmación del usuario.** El selector funciona desde el segundo espacio del grid del Sidebar. La preferencia se guarda mediante `localStorage` con la clave `ml-sensores-tema` (valores `claro` / `oscuro`) y se aplica al documento antes del montaje de React. La primera ejecución usa el tema claro.

El tema claro permanece sin modificaciones visuales. El modo oscuro conserva exactamente su tipografía, estructura, dimensiones y espaciados; solo adapta colores, bordes, sombras y esquema nativo de controles. Las especificaciones estructurales originales de este documento se conservan como referencia de diseño y no sustituyen las reglas del tema claro de `DESIGN.md` ni las implementadas en `src/index.css`.

### Official CSS Tokens

| Variable en `src/index.css` | Valor oscuro actual | Uso |
|---|---|---|
| `--color-background` | `#101513` | Fondo gris carbón |
| `--color-surface` | `#1B2420` | Superficies y tarjetas |
| `--color-primary` | `#3D9B72` | Rellenos de acciones |
| `--color-accent` | `#83B59C` | Textos destacados e indicadores |
| `--color-primary-soft` | `#26332D` | Contenedores secundarios |
| `--color-text` | `#E2E8E4` | Texto principal |
| `--color-text-secondary` | `#A5B4AA` | Texto secundario |
| `--color-on-primary` | `#FFFFFF` | Texto sobre acciones verdes |
| `--color-border` | `rgb(165 180 170 / 15%)` | Bordes y divisores |
| `--color-primary-hover` | `#4BAE82` | Acciones en hover |
| `--color-error` | `#F0A8A3` | Texto e iconos de error |
| `--color-error-background` | `#492725` | Fondo de error |
| `--color-error-border` | `#87514D` | Borde de error |
| `--primary-rgb` | `61 155 114` | Transparencias del primario |
| `--scrim-rgb` | `0 0 0` | Overlay y sombras |
| `--shadow-card` | `0 1px 3px rgb(0 0 0 / 18%)` | Sombra de tarjetas |
| `--shadow-interactive` | `0 4px 12px rgb(0 0 0 / 24%)` | Sombra interactiva |
| `--focus-ring` | `0 0 0 2px rgb(61 155 114 / 20%)` | Foco |

El bloque oscuro declara también `color-scheme: dark`. Estos tokens son la referencia vigente de color y sombras para los componentes descritos más abajo.

### Mode Mapping Guidelines
- **Primary Action & Active States**: In Light Mode, `#16854B` with `#FFFFFF` text. In Dark Mode, `#3D9B72` with `#FFFFFF` text; primary hover uses `#4BAE82`.
- **Secondary Containers & Badges**: In Light Mode, `#E4F3E9` with `#16854B` text. In Dark Mode, `#26332D` with `#83B59C` text.
- **Telemetry Indicators**: In Light Mode, active sensor states derive from `#16854B`. In Dark Mode, accent signals map directly to `#83B59C`.
- **Structural Surfaces**: Contrast is achieved through crisp card plane separation (`#FFFFFF` against `#F5F8F5` in Light; `#1B2420` against `#101513` in Dark).
- **Dark Text & Errors**: Primary text is `#E2E8E4`, secondary text is `#A5B4AA`. Error text uses `#F0A8A3` over `#492725`, with `#87514D` borders.

## Typography

The design system exclusively implements `Inter` across all structural roles, emphasizing clean mechanical neutrality, tabular readiness, and instant scannability during motion.

- **Tabular Figures**: All metric readings, sensor streams, and coordinates must use tabular figures (`font-variant-numeric: tabular-nums`) to prevent layout shift during real-time streaming.
- **Labels & Micro-data**: Technical annotations, sensor IDs, and latency readouts utilize `label-sm` or `label-md` with positive letter tracking and uppercase casing for rapid distinction from narrative body text.
- **Hierarchy Rules**: Primary labels stay locked to primary text tokens; units of measurement (e.g., ms, Hz, m/s²) sit alongside values using `secondary text` colors at 1 to 2 scales below the active metric figure.

## Layout & Spacing

A fluid grid system organizes dynamic sensor streams across varied device factors:
- **Mobile (<768px)**: 4-column layout, compact margins (`1rem`) to prioritize edge-to-edge chart and metric real estate.
- **Tablet (768px–1023px)**: 8-column layout, balanced gutter and margin distribution (`1.25rem` / `1.5rem`).
- **Desktop (≥1024px)**: 12-column layout with high data concurrency, scaling up to a max content bounds of `1440px` with `1.5rem` gutters and `2rem` outer margins.

Spacing follows an explicit 4px baseline rhythm (`0.25rem`), strictly governing component internal padding and visual grouping to maintain dense, dashboard-grade telemetry clarity.

## Elevation & Depth

Visual hierarchy uses tonal surface stacking and subtle low-contrast boundaries instead of diffused drop shadows. This preserves high situational contrast and prevents muddy interfaces in dark mode.

- **Surface Stacking**: Canvas background sits as the base layer (`#101513` Dark / `#F5F8F5` Light). Cards, telemetry modules, and graphs lift to Surface (`#1B2420` Dark / `#FFFFFF` Light).
- **Secondary Containers & Insets**: Embedded sub-modules, waveform tracks, and input regions nest inside surfaces using secondary container fills (`#26332D` Dark / `#E4F3E9` Light).
- **Outlines & Dividers**: Surfaces employ low-contrast 1px perimeter boundaries (`rgb(165 180 170 / 15%)` in Dark; `#DCE7DF` in Light) to ensure structural separation without adding heavy visual weight.
- **Overlay Panels & Tooltips**: Floating telemetry inspector tooltips render with solid surface colors bordered with active indicator tints, keeping edge definition sharp.

## Shapes

The system uses a balanced `roundedness: 2` (base radius `0.5rem` / 8px). This softens raw brutalist edges into an ergonomic, modern athletic tech finish while preserving sharp data alignment.

- **Base Radii (`0.5rem`)**: Buttons, inputs, small metric cards, and telemetry status chips.
- **Medium Radii (`1rem`)**: Multi-metric grouping containers, dashboard analytical cards, and modal sheets.
- **Pill Geometry**: Reserved strictly for dynamic status badges (e.g., "LIVE", "STREAMING", "CALIBRATED") and sensor toggle indicators.

## Components

### Buttons
- **Primary**: Solid primary green fill (`#16854B` Light / `#3D9B72` Dark). Label text uses on-primary (`#FFFFFF` in both modes) set in `label-lg`. Padding: `0.75rem 1.5rem`, border radius `0.5rem`.
- **Secondary / Ghost**: Outline or subtle surface container with primary text color. Active/hover manifests an edge highlight of secondary container tint.

### Chips & Sensor Badges
- **Status Indicator Chip**: Pill-shaped (`rounded-full`), padded `0.25rem 0.75rem`. Background set to secondary container (`#E4F3E9` Light / `#26332D` Dark) with a 6px circular dot using the accent/primary green. Label set in `label-sm`.

### Input Fields
- **Container**: Surface-filled background with a 1px border. Height: `44px` for touch accessibility.
- **Text & Focus**: Default text uses Primary Text; placeholder uses Secondary Text. Focus ring triggers a 1.5px outline in Primary Green (`#16854B` Light / `#3D9B72` Dark) with zero ambient glow. This original structural specification is retained as reference; the implemented focus shadow is recorded in Official CSS Tokens above.

### Cards & Telemetry Containers
- **Structure**: Surface fill with 1px border outline and `1rem` corner radius. 
- **Header Structure**: Contains sensor name in `title-md` (`Primary Text`), pairing real-time frequency/latency stats in `body-sm` (`Secondary Text`).

### Selection Controls (Checkboxes & Radios)
- **Checkboxes**: 20x20px dimension, `0.25rem` radius. Inactive: secondary text border. Active: solid Primary Green fill with white/dark on-primary vector checkmark.
- **Radio Buttons**: 20x20px concentric circles; center dot lights up with Primary Green when engaged.

### Sensor ML Data Streamers (Domain Specific)
- **Signal Waveform Container**: Recessed secondary container fill (`#E4F3E9` Light / `#26332D` Dark). Waveform traces render in Accent Green (`#83B59C`) in Dark Mode or Primary Green (`#16854B`) in Light Mode for unambiguous trajectory analysis.
