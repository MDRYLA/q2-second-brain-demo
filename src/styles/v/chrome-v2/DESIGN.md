# DESIGN — Chrome v2 "Apple Vision dashboard"

> Single source of truth dla `chrome-v2`. Każdy ekran MUSI być zgodny.
> Inspiracje: `active/chrome-style-inspo.png` (gradient grain blue/red metallic) + Apple Vision OS aesthetic (glass-morphic, dark mode dominant).
> Logo: `active/second-brain-1-{500px,max}.png` (drzewo).

## Tone

Premium tech, futuristic, glass-morphic. Dark mode dominujący, chrome gradient blur tła (animated subtle), cards z backdrop-filter blur. Vibe: dashboard od Apple, ale z chrome gradient (NIE pure black). Każdy element ma subtle glow, glass surface refractive feel.

## Palette

```
--bg-base:        #0E1420  /* deep navy-black — base bg */
--bg-base-2:      #161E32  /* slightly lighter — depth layer */
--gradient-chrome: linear-gradient(135deg, #1A2A4A 0%, #2C3E5C 30%, #4A2D3A 70%, #1F1430 100%)
                  /* chrome-style hero/decoration gradient */

--glass-bg:       rgba(20, 28, 46, 0.55) /* glass card bg z blur */
--glass-border:   rgba(255, 255, 255, 0.08) /* subtle highlight */
--glass-elevated: rgba(28, 38, 58, 0.70) /* hover state */

--accent-blue:    #7CA3D9  /* sky blue — primary accent (active states) */
--accent-blue-hot: #A5C4F2 /* lighter blue — hover */
--accent-red:     #C95B5B  /* desaturated red — warnings, energy */
--accent-bronze:  #B58846  /* matte gold — premium accent (rzadko, key features) */

--text-primary:   #F4F1E8  /* cream — main text */
--text-secondary: rgba(244,241,232,0.75)
--text-muted:     rgba(244,241,232,0.50)
--text-faint:     rgba(244,241,232,0.32)
```

**Sygnatura:** glass cards lifted z chrome gradient blur w tle; subtle glow akcentów.

## Typography

```
Display:     Inter Display (możemy użyć Inter z weight 800 + tracking-tight) — duże tytuły 32-72px
             use: hero stats, big numbers, page titles
             tracking: -0.04em na 60+, -0.02em na 32-60

Body:        Inter — paragrafy 14-16px regular/medium
             SF Pro feel: weights 400/500/600 (NIE 700+ w body)
             line-height 1.5

Mono:        JetBrains Mono — technical labels 11-13px
             use: timestamps, IDs, metrics units (kcal, min, %)

NO serif:    Cormorant nieużywany (to dla Chrome v1, v3)
```

**Skala:**
```
.hero-stat       → clamp(64px, 10vw, 120px) Inter 800, line-height 0.92, letter-spacing -0.045em
.page-title      → clamp(28px, 4vw, 44px) Inter 700, letter-spacing -0.025em
.section-title   → clamp(18px, 2.5vw, 24px) Inter 600
.eyebrow         → 11px Inter 600 uppercase, letter-spacing 0.12em, color --accent-blue
.body            → 15px Inter 400, line-height 1.55
.body-sm         → 13px Inter 400, --text-secondary
.label           → 12px Inter 500
.mono-metric     → 12px JetBrains Mono 500, --accent-bronze /* numerki w cards */
```

## Spacing

```
--space-xs:  4px
--space-sm:  8px
--space-md:  12px  /* tight — vision dashboard nie ma marnowanej przestrzeni */
--space-lg:  20px
--space-xl:  32px
--space-2xl: 48px
--space-3xl: 72px
```

## Radius

Większe radius (Apple feel):
```
--radius-pill: 999px
--radius-sm:   10px  /* buttons */
--radius-md:   16px  /* cards default */
--radius-lg:   22px  /* hero cards */
--radius-xl:   28px  /* modals, sheets */
```

## Shadow + Glass effects

```
--glass-blur:        backdrop-filter: blur(24px) saturate(150%)
--glass-blur-strong: backdrop-filter: blur(40px) saturate(180%)

--shadow-glow-blue:  0 0 0 1px rgba(124,163,217,0.20), 0 8px 32px rgba(124,163,217,0.15)
--shadow-glow-red:   0 0 0 1px rgba(201,91,91,0.20), 0 8px 32px rgba(201,91,91,0.15)
--shadow-card:       0 16px 48px rgba(0,0,0,0.40), 0 4px 12px rgba(0,0,0,0.20)
--shadow-elevated:   0 24px 64px rgba(0,0,0,0.55), 0 8px 16px rgba(0,0,0,0.30)
```

## Components

### Button
```
.btn-primary
  bg: --accent-blue, color: --bg-base
  padding: 14px 28px, radius: --radius-sm
  font: Inter 600 14px
  shadow: --shadow-glow-blue
  hover: bg --accent-blue-hot, transform translateY(-1px)

.btn-secondary
  bg: --glass-bg, color: --text-primary
  border: 1px solid --glass-border
  backdrop-filter: var(--glass-blur)
  padding: 12px 24px, radius: --radius-sm
  hover: bg --glass-elevated

.btn-ghost
  bg: transparent, color --text-secondary
  hover: color --accent-blue
```

### Card (glass)
```
.glass-card
  bg: --glass-bg
  backdrop-filter: var(--glass-blur)
  border: 1px solid --glass-border
  padding: 20 24
  radius: --radius-md
  shadow: --shadow-card
  position: relative
  /* highlight at top edge */
  &::before { content '', position absolute, top 0, left 0, right 0, height 1px,
              bg linear-gradient(to right, transparent, rgba(255,255,255,0.20), transparent) }

.glass-card-elevated
  bg: --glass-elevated
  backdrop-filter: var(--glass-blur-strong)
  shadow: --shadow-elevated

.glass-card-accent (rzadko, key feature)
  border: 1px solid rgba(124,163,217,0.30)
  shadow: --shadow-glow-blue
```

### Input + Textarea
```
.input
  bg: --glass-bg
  backdrop-filter: var(--glass-blur)
  color: --text-primary
  border: 1px solid --glass-border
  padding: 12 14, radius: --radius-sm
  font: Inter 500 15px
  focus: border --accent-blue, shadow --shadow-glow-blue

.textarea
  jak input + min-height 100px
```

### Likert4
```
4 ikony minimalist (NIE hand-drawn — Apple-style line icons z San Francisco family)
  size: 44px circle
  inactive: stroke rgba(244,241,232,0.40), bg --glass-bg
  active: bg --accent-blue, color --bg-base, shadow --shadow-glow-blue, scale(1.06)
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)

5. "Nie wiem" jako mała pill — bg glass + border subtle
```

### TaskChip
```
glass-card variant, mała:
  height 30, padding 0 14, radius --radius-pill
  bg --glass-bg, backdrop-blur, border 1px solid --glass-border
  font: Inter 500 12px
  done: bg rgba(124,163,217,0.18), color --accent-blue-hot, border --accent-blue
  partial: bg rgba(181,136,70,0.18), color --accent-bronze, border --accent-bronze
  blocked: bg rgba(201,91,91,0.18), color --accent-red, border --accent-red
```

### Modal (sheet)
```
.modal-content
  bg: --glass-card-elevated
  backdrop-filter: var(--glass-blur-strong)
  max-width: 560
  padding: 32
  radius: --radius-xl (28px — Apple sheet feel)
  shadow: --shadow-elevated

.modal-backdrop
  bg: rgba(14,20,32,0.65)
  backdrop-filter: blur(8px) /* even backdrop is blurred */
```

### TagPicker
```
chips glass-style:
  selected: bg --accent-blue, color --bg-base, shadow --shadow-glow-blue
  unselected: glass-card mała, color --text-secondary
  + button: glass-card z dashed border --accent-blue color
```

## Layout architecture

### Desktop (≥768px)
```
Background: gradient chrome animated (subtle 60s loop) + grain texture noise overlay 0.03 opacity
Topbar 64px floating glass-card (margin 16 from edges, full-width minus margins, radius --radius-md)
  - Brand drzewo monochromatic mini + "Second Brain" Inter 600 18px
  - Nav inline center: glass pills (Dziś / Check-in / Check-out / Plan / Wiedza)
    Active: glass-card-accent z blue glow
  - Right: theme toggle + profile avatar (glass circle)

Main: padding 24 32, max-width 1200 centered
  Cards layout: grid-template-columns auto-fit minmax(320px, 1fr), gap 16
  Hero card large (full-width on grid) z hero-stat number

Floating bottom-right: FAB Quick capture (glass-card circle 56px, blue glow)
```

### Mobile (<768px)
```
Background: gradient chrome static + grain
Topbar 52px floating glass (margin 12)
Main padding 16
Bottom nav 64px floating glass-card (margin 12, radius --radius-md)
  4 ikony primary + FAB w środku (raised 8px above)
```

## Illustrations

Brak hand-drawn. Decoration:
- Grain texture overlay (`grain.png` — subtle noise, 4% opacity, multiply blend)
- Animated gradient mesh w tle (CSS gradient-animation 60s loop)
- Logo drzewo monochromatic (--accent-bronze stroke)

Lokalizacja: `src/components/v/chrome-v2/decorations/`.

## Iconography

San Francisco-style outlined SVG icons, weight 1.5px, rounded line-cap.
- Można użyć Lucide `strokeWidth={1.5}` jako baseline (Lucide pasuje do Apple aesthetic)
- Active state: filled variant gdzie dostępne, color --accent-blue

Lokalizacja: `src/components/v/chrome-v2/icons/`.

**Wyjątek od Bold rule:** Lucide tutaj OK (chrome-v2 jest tech, nie hand-drawn).

## Mobile adaptations

- Glass blur weakened na low-end (matchMedia prefers-reduced-transparency)
- Hero stat clamp robi (120 → 64px)
- Gradient mesh static (not animated) na mobile (perf)
- Cards padding 16 (z 20-24)
- Backdrop-filter ma fallback solid bg z opacity 0.85 dla starszych browser

## Don't

❌ Pure white text — używaj cream (#F4F1E8) z opacity dla hierarchii
❌ Hand-drawn illustrations — to dla Bold
❌ Solid color cards (no glass) — TYLKO glass-card variants
❌ Sharp corners (radius < 10) — Apple = soft
❌ Boldonse / Cormorant — to dla Bold/Chrome v1
❌ Saturated full-bleed colors — używaj glass + accent glow
❌ Bento mixed-size grid — używaj uniform grid z glass cards
❌ Logo: tulipan — drzewo, ale w monochromatic stroke

## Information Patterns (KRYTYCZNE — wzorce prezentacji informacji)

Wzorce zdefiniowane raz, używane wszędzie. Każdy ekran konstruuje treść z tych klocków, nigdy nie improwizuje.

### Page header

```
<header className="cv2-page-header">
  <p className="cv2-eyebrow">{eyebrow}</p>      // 11px uppercase tracked, accent-blue
  <h1 className="cv2-page-title">{title}</h1>   // Inter 800, 28-44px, text-primary
  {subtitle && <p className="cv2-page-subtitle">{subtitle}</p>}  // Inter 400 16px text-secondary
</header>
```

### Section header (z thin blue glow line pod)

```
<SectionHeader>{title}</SectionHeader>     // Inter 700 18-22px, color text-primary
                                            // ::after thin blue 32px line z glow box-shadow
```

### Form group

```
<FormGroup label="Co dziś zrobisz?" helper="Max 200 znaków">
  <Textarea value={...} onChange={...} />  // glass bg + blur, blue glow on focus
</FormGroup>
```

### Bullet list (priorytety, zadania)

```
<ol className="cv2-bullet-list">
  <li className="cv2-bullet-item">       // glass card z blur
    <span className="cv2-bullet-num">01</span>      // mono, accent-blue
    <span className="cv2-bullet-content">{text}</span>
    <TaskChip status={...} />
  </li>
</ol>
```

### Task chip (4 stany Apple Vision style)

- `none`: glass-bg + glass-border, text-secondary
- `half`: bg rgba(181,136,70,0.18), border bronze, color bronze
- `full`: bg rgba(124,163,217,0.18), border blue, color blue-hot, **box-shadow blue glow**
- `blocked`: bg rgba(201,91,91,0.18), border red, color red

### Empty state

```
<EmptyState icon={<Lucide />} title="Brak zapisów" description="..." />
```

Icon: Lucide w accent-blue z drop-shadow blue glow.

### Action row

```
<ActionRow>
  <Button variant="ghost">Anuluj</Button>
  <Button variant="primary">Zapisz</Button>  // blue gradient + blue glow shadow
</ActionRow>
```

### Modal (glass-morphic)

```
<div className="cv2-modal-backdrop">       // rgba(14,20,32,0.78) + backdrop-filter blur(12px)
  <div className="cv2-modal-card">          // glass-elevated + backdrop-filter blur(32px) saturate(160%)
    {/* content */}
  </div>
</div>
```

### Read-only field (archiwum)

```
<dl className="cv2-readonly-list">
  <div className="cv2-readonly-field">     // border-bottom glass-border
    <dt className="cv2-readonly-label">{label}</dt>   // 11px uppercase tracked accent-blue
    <dd className="cv2-readonly-value">{value}</dd>   // 16px text-primary
  </div>
</dl>
```

### Loading skeleton

```
<div className="cv2-skeleton" style={{ width: 200, height: 24 }} />
```

CSS: bg rgba(244,241,232,0.06), animation cv2-shimmer 1.4s infinite linear (opacity pulse).

### Spójność fontów

ZERO `font-family:` w client components. Inter + JetBrains Mono importowane TYLKO w root layout (`src/app/layout.tsx`) — chrome-v2 layout.tsx nie dodaje custom fontów. Klasy używają `var(--cv2-font-body)` i `var(--font-mono)`.

## Compliance check

- [ ] Background: chrome gradient widoczny na każdej page
- [ ] Wszystkie cards = glass-card variants (NIE solid bg)
- [ ] Topbar/bottom-nav floating glass (nie solid)
- [ ] Backdrop-filter blur działa (test w DevTools, fallback solid bg gdy unsupported)
- [ ] Akcenty blue glow na active states
- [ ] Logo drzewo monochromatic
- [ ] Lucide icons OK (waga 1.5px)
- [ ] Grain texture overlay subtle
