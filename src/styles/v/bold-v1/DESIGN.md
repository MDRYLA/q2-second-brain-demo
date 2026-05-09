# DESIGN — Bold v1 "Magazine cover"

> **Single source of truth** dla wariantu `bold-v1`. Każdy ekran w tym wariancie MUSI być zgodny z tym dokumentem.
> Inspiracje: `active/bold-with-drawing-inspo.png`, `active/bold-with-drawing-inspo-2.png` (Parents Day).
> Logo: `active/second-brain-2.png` (czerwony tulipan + żółte arkady + uśmiechnięta twarz).

## Tone

Vibe magazynu / okładki edycji. Każdy dzień otwiera się jak nowa rozkładówka — duży red display tytuł, hand-drawn akcent, body w cream paper card. Wibracja: warm, intimate, playful, ale premium. NIE corporate, NIE sterile. Czuje się ręka rysownika, nie photoshop.

## Palette

```
--bg-deep:        #1F2918  /* deeper green-charcoal — main bg, header sections (zmienione z #2E4A1F po feedbacku Kacpra) */
--bg-card:        #FBF8EE  /* cream paper — cards, content lifted */
--bg-card-warm:   #F5EFD9  /* warm cream variant — secondary cards */
--accent-red:     #D63B2A  /* vintage red — display titles, CTA, hot accents */
--accent-yellow:  #F0C040  /* mustard yellow — highlights, sun, decoration */
--accent-yellow-soft: #F7DD8E /* soft yellow — bg of pills, badges */
--text-on-deep:   #FBF8EE  /* cream — text on dark green */
--text-on-card:   #1A1A1A  /* near-black — text on cream paper */
--text-handwritten: #D63B2A /* red — handwritten notes (intencja, podpisy) */
--text-muted:     rgba(26,26,26,0.55) /* muted on cream */
--text-muted-on-deep: rgba(251,248,238,0.65) /* muted on dark */
--border-subtle:  rgba(26,26,26,0.08)
--border-strong:  #1A1A1A
```

**Don't:** żadnych blue/cyan, żadnego "matowego szarego", żadnych pure black tła (zawsze deep green).

## Typography

3 fonty (z next/font):

```
Display:     Boldonse (Google Fonts) — wszystkie tytuły 28-72px, BOLD, czerwony, condensed
             use: page-title, hero, section-title, big numbers
             tracking: -0.02em na > 40px, -0.01em na 28-40px

Body:        Inter (już w projekcie) — wszystko tekstowe 14-18px
             use: paragrafy, listy, etykiety, przyciski
             weights: 400 regular, 500 medium, 600 semibold, 700 bold
             tracking: 0

Handwritten: Caveat (Google Fonts) — akcenty emocjonalne 18-32px
             use: poranna intencja, notatki check-out, podpisy hand-drawn
             color: --accent-red (zawsze czerwone, NIE zielone)
             rotation: opcjonalnie -1deg do +1deg (skew dla ręcznego feel)
```

**Skala (clamp):**

```
.hero-title     → clamp(40px, 8vw, 72px)  Boldonse, --accent-red, line-height 0.95, letter-spacing -0.03em
.page-title     → clamp(28px, 5vw, 44px)  Boldonse, --accent-red, line-height 1.05
.section-title  → clamp(20px, 3.5vw, 28px) Boldonse, --text-on-deep lub --text-on-card
.eyebrow        → 11px Inter 600 uppercase, letter-spacing 0.12em, --accent-red
.body           → 16px Inter 400, line-height 1.55
.body-sm        → 14px Inter 400, line-height 1.5
.label          → 13px Inter 500, line-height 1.3, --text-muted
.handwritten    → clamp(18px, 2.5vw, 28px) Caveat 500, --accent-red
```

**Don't:** żadnych SF Pro, żadnego serif (Cormorant/Playfair są dla Chrome). Display ZAWSZE Boldonse.

## Spacing

Base 8px. Scale: `4 / 8 / 16 / 24 / 32 / 48 / 64 / 96`.

```
--space-xs:  4px   /* mikro-odstępy ikon */
--space-sm:  8px
--space-md:  16px  /* default gap między elementami */
--space-lg:  24px  /* card padding */
--space-xl:  32px  /* section gap */
--space-2xl: 48px  /* page section breaks */
--space-3xl: 64px  /* hero margin */
--space-4xl: 96px  /* major page divisions */
```

## Radius

```
--radius-pill:   999px  /* TaskChip, badges, tags */
--radius-sm:     8px    /* buttons, inputs */
--radius-md:     12px   /* cards (default — mocno organic, nie ostre) */
--radius-lg:     16px   /* modals, drawers */
--radius-xl:     24px   /* hero cards, big features */
```

**Don't:** zero radius (square cards). Bold v1 to organic — wszystko zaokrąglone.

## Shadow

```
--shadow-card:    0 4px 16px rgba(26,26,26,0.10), 0 1px 3px rgba(26,26,26,0.06)
--shadow-elevated: 0 12px 32px rgba(26,26,26,0.18), 0 4px 8px rgba(26,26,26,0.10)
--shadow-hover:   0 8px 24px rgba(214,59,42,0.18), 0 2px 6px rgba(26,26,26,0.08) /* czerwony glow na hover */
```

Cards na cream paper na deep green tle = lekki shadow (cream już sam się "lifted"). Hover wprowadza red glow.

## Components — primitives (per `src/components/v/bold-v1/`)

### Button

```
.btn-primary
  bg: --accent-red
  color: --bg-card
  padding: 14px 28px
  radius: --radius-sm
  font: Inter 600 14px uppercase, letter-spacing 0.06em
  border: none
  shadow: --shadow-card
  hover: bg darken 8%, shadow --shadow-hover, transform translateY(-1px)
  active: transform translateY(0)

.btn-secondary
  bg: transparent
  color: --accent-red
  border: 1.5px solid --accent-red
  padding: 12px 24px (inset border kompensacja)
  font: Inter 600 14px uppercase, letter-spacing 0.06em
  radius: --radius-sm
  hover: bg --accent-red, color --bg-card

.btn-ghost
  bg: transparent
  color: --text-on-card lub --text-on-deep (zależnie od surface)
  padding: 10px 16px
  font: Inter 500 14px (no uppercase)
  hover: bg rgba(214,59,42,0.08)
```

### Card

```
.card-paper
  bg: --bg-card
  color: --text-on-card
  padding: 24px
  radius: --radius-md
  shadow: --shadow-card
  border: 1px solid --border-subtle

.card-paper-hero (dla section-tytułów dnia)
  jak card-paper ale padding: 40px 32px
  radius: --radius-xl
  border-top: 4px solid --accent-red
  z handwritten label nad title

.card-warm (secondary, np. sub-cards)
  bg: --bg-card-warm
  pozostałe jak card-paper
```

### Input + Textarea

```
.input
  bg: --bg-card
  color: --text-on-card
  border: 1.5px solid --border-subtle
  padding: 12px 16px
  radius: --radius-sm
  font: Inter 500 16px
  focus: border --accent-red, outline 3px solid rgba(214,59,42,0.18)

.textarea
  jak input + min-height 96px, resize vertical, padding 16px
```

### Likert4 (4-stopniowa skala "Nie wiem"/słabo/średnio/dobrze)

```
4 ikony hand-drawn SVG (face-confused, face-sad, face-neutral, face-happy)
  size: 56px (desktop), 48px (mobile)
  inactive: stroke --text-muted, fill transparent
  active:   fill --accent-red, stroke --accent-red

5. opcja "Nie wiem" jako pill (radius-pill, font Inter 500 13px) — bg --accent-yellow-soft, color --text-on-card
   active: bg --accent-yellow

Layout: flex row, gap 12px, wrap on mobile
```

### TaskChip (status: brak / połowa / pełen / blokada)

```
.task-chip
  height: 32px (desktop), 36px (mobile — touch target)
  padding: 0 16px
  radius: --radius-pill
  bg: --bg-card-warm
  color: --text-on-card
  border: 1.5px solid --border-subtle
  font: Inter 600 13px

Statusy (active state):
  done:     bg --accent-red, color --bg-card, border --accent-red
  partial:  bg --accent-yellow, color --text-on-card, border --accent-yellow
  blocked:  bg #B83A2A (darker red), color --bg-card, border #B83A2A, opacity 0.85
```

### Modal

```
.modal-backdrop
  bg: rgba(46,74,31,0.78) /* dark green overlay, NIE black */
  backdrop-filter: blur(4px)

.modal-content
  bg: --bg-card
  max-width: 480px
  padding: 32px
  radius: --radius-lg
  shadow: --shadow-elevated
  border-top: 4px solid --accent-red
```

### TagPicker (chipy)

```
chip wybrany:    bg --accent-red, color --bg-card
chip do wyboru:  bg --bg-card-warm, color --text-on-card, border 1px solid --border-subtle
+ button:        bg transparent, border 1.5px dashed --accent-red, color --accent-red, padding 6px 12px, radius pill
```

## Layout architecture

### Desktop (≥768px)

```
[ Sidebar 240px fixed left ]  [ Main content, max-width 1080, centered ]
  - Brand logo top (tulipan SVG 80px)
  - Nav items pionowo, każdy = ikona-rysunek + label Inter 600 15px
  - Active item: bg --accent-red soft (rgba 0.12), color --accent-red, left border 3px solid --accent-red
  - Settings/theme toggle dolny narożnik
```

### Mobile (<768px)

```
[ Top bar 56px: brand logo małe + hamburger ]
[ Main content, padding 16px ]
[ Bottom nav 64px: 4 ikony primary (Dziś, Check-in, Check-out, Plan) + FAB pośrodku (Quick capture) ]
[ Drawer slides from right gdy hamburger ]
```

Breakpoint: 768px (taki sam jak obecny — kompatybilność z mobile-first patterns w lib).

## Illustrations

Hand-drawn SVG-y w `src/components/v/bold-v1/illustrations/`:
- `tulip.svg` — tulipan z logo (akcent w hero)
- `arches.svg` — żółte arkady (akcent dolny sekcji)
- `flower-bloom.svg` — kwiat w kieliszku (Dashboard hero, Journal pustego dnia)
- `sun-rays.svg` — słońce (Quote of the day card)
- `book-open.svg` — otwarta księga (Wiedza)
- `tree-bare.svg` — drzewo bez liści (Konstytucja)

Format: SVG inline. Kolory: `currentColor` lub `--accent-red`/`--accent-yellow`. Style: krzywe, organic, nieperfekcyjne (świadomy crayon-feel).

## Iconography

NIE Lucide (zbyt techniczne, generyczne). Użyj custom hand-drawn SVG dla nawigacji + ikon akcji:

Pliki: `src/components/v/bold-v1/icons/`:
- `today.svg` (słońce z rays)
- `check-in.svg` (kawa z parą)
- `check-out.svg` (księżyc)
- `plan.svg` (kalendarz hand-drawn)
- `journal.svg` (pióro)
- `wiedza.svg` (księga otwarta)
- `more.svg` (3 kropki ozdobnie)
- `close.svg` (X krzywy)
- `add.svg` (+ z motywem rośliny)
- `search.svg` (lupa hand-drawn)

Stroke: 1.5-2px, line-cap round, line-join round.

## Mobile adaptations

- Display: clamp() już handluje (40px na mobile vs 72px desktop)
- Cards: padding redukowany do 20px (z 24px) na mobile
- Bottom nav: 64px wysokość, 4 ikony + FAB
- TaskChip: 36px touch target (vs 32px desktop)
- Modal: full-screen na <480px (max-width: 100vw, radius 0 top corners)
- Hero card: na mobile padding 24px 20px, ilustracja zmniejszona do 60% szerokości

## Don't (anti-patterns dla bold-v1)

❌ Lucide icons — zawsze hand-drawn SVG (powyższa lista lub nowe w stylu)
❌ Cormorant/Playfair font — to dla Chrome, NIE Bold
❌ Square cards (radius 0) — Bold v1 to ZAWSZE rounded ≥8px
❌ Pure black bg lub pure white card — używaj --bg-deep i --bg-card
❌ Cyan/blue akcenty — wyłącznie red+yellow w tej palecie
❌ Sans-serif handwritten substitution — handwritten ZAWSZE Caveat
❌ Drop shadow > 16px — przesadzone, łamie premium feel
❌ Hard 90deg corners w buttons — zawsze radius-sm minimum
❌ Generic "OK" / "Cancel" buttons — copy specifically: "Zapisz", "Anuluj", "Dodaj wpis"

## Information Patterns (KRYTYCZNE — wzorce prezentacji informacji powtarzane na wszystkich ekranach)

Wzorce poniżej są **zdefiniowane raz, używane wszędzie** — to gwarancja spójności wewnątrz wariantu. Każdy ekran konstruuje treść z tych klocków, nigdy nie improwizuje.

### Page header (na każdym ekranie głównym)

```
<header className="bv1-page-header">
  <p className="bv1-eyebrow">{eyebrow}</p>      // np. "PORANEK · 2026-05-07"
  <h1 className="bv1-page-title">{title}</h1>   // Boldonse 28-44px, accent-red
  {subtitle && <p className="bv1-page-subtitle">{subtitle}</p>}  // Caveat 18-24px, accent-red, italic
</header>
```

CSS: padding-bottom 32px, border-bottom 1px solid rgba(251,248,238,0.08), margin-bottom 32px.

### Section header (każda sekcja w ekranie)

```
<SectionHeader>{title}</SectionHeader>     // Boldonse uppercase 20-28px, color text-on-deep, mb 16px
                                            // optional: thin red line pod (border-bottom 2px solid accent-red, width 32px)
```

### Form group (każde pole formularza)

```
<FormGroup label="Co dziś zrobisz?" helper="Max 200 znaków">
  <Textarea value={...} onChange={...} />
</FormGroup>
```

CSS: display flex column, gap 6px. Label: uppercase 11px tracked 0.10em, accent-red. Helper: italic 12px text-muted-on-deep.

### Bullet list (priorytety, zadania)

```
<ol className="bv1-bullet-list">
  <li className="bv1-bullet-item">
    <span className="bv1-bullet-num">01</span>      // mono accent-red
    <span className="bv1-bullet-content">{text}</span>
    <TaskChip status={...} />                        // po prawej
  </li>
</ol>
```

### Task chip (wszędzie gdzie status zadania)

4 stany w paletcie bold-v1:
- `none`: bg-card-warm, border-subtle, color text-on-card
- `half`: bg accent-yellow, color text-on-card
- `full`: bg accent-red, color bg-card
- `blocked`: bg accent-red-dark, color bg-card, opacity 0.85

### Empty state

```
<EmptyState
  iconSrc="/v/bold-v1/icons/flower-glass.png"
  title="Brak zapisów"
  description="Twoja pierwsza intencja pojawi się tutaj"
/>
```

CSS: text-align center, padding-y 48px, max-width 320px mx auto. Title: handwritten Caveat 24px accent-red. Description: body-sm text-muted-on-deep.

### Action row (bottom każdego formularza)

```
<ActionRow>
  <Button variant="ghost" onClick={onCancel}>Anuluj</Button>
  <Button variant="primary" onClick={onSave}>Zapisz</Button>
</ActionRow>
```

CSS: display flex, gap 12px, justify-content flex-end (right-aligned). Mobile: justify-content space-between, full-width buttons.

### Modal (popups, confirmations)

```
<div className="bv1-modal-backdrop" onClick={onClose}>
  <div className="bv1-modal-card" onClick={stopProp}>
    <h2 className="bv1-section-title on-card">{title}</h2>
    {children}
    <ActionRow>...</ActionRow>
  </div>
</div>
```

CSS backdrop: rgba(31,41,24,0.78) + backdrop-filter blur(4px). Card: bg-card, max-width 480px, padding 32px, radius-lg, border-top 4px solid accent-red, shadow-elevated.

### Read-only field (archiwum journal)

```
<dl className="bv1-readonly-list">
  <div className="bv1-readonly-field">
    <dt className="bv1-readonly-label">Energia rano</dt>
    <dd className="bv1-readonly-value">{value}</dd>
  </div>
</dl>
```

### Loading skeleton

```
<div className="bv1-skeleton" style={{ width: 200, height: 24 }} />
```

CSS: bg rgba(251,248,238,0.08), animation bv1-shimmer 1.4s infinite linear.

### Mobile bottom nav

Już zdefiniowane w tokens.css `.bv1-mobile-bottom-nav` + `.bv1-mobile-nav-item`. Każdy ekran NIE definiuje własnego — używa ze Shell.

### Spójność fontów

ZERO `font-family:` w client components ani w `screens/<route>.css`. Fonty importowane TYLKO w `src/app/v/bold-v1/layout.tsx` przez next/font, eksponowane jako `--font-display-bold`, `--font-body`, `--font-handwritten`. Klasy CSS używają tych zmiennych przez `--bv1-font-display` etc.

## Compliance check (per ekran)

Przed commitem ekranu w wariancie bold-v1:

- [ ] Wszystkie kolory z palette (grep: `#[0-9A-F]{3,6}` poza tokens.css i SVG ilustracji = 0)
- [ ] Wszystkie fonty z listy: Boldonse / Inter / Caveat (nic innego)
- [ ] Wszystkie buttony używają `<Button variant="primary|secondary|ghost">` z `components/v/bold-v1/Button.tsx`
- [ ] Wszystkie cards używają `<Card variant="paper|paper-hero|warm">`
- [ ] Wszystkie inputy/textarea używają `<Input>` / `<Textarea>`
- [ ] Wszystkie task statusy używają `<TaskChip status="...">`
- [ ] Mobile layout testowany na 375px (bottom nav + FAB widoczne, content nie rozjeżdża się)
- [ ] Hand-drawn ilustracja na każdej stronie TIER 1 (przynajmniej 1)
- [ ] Handwritten Caveat użyte na: poranna intencja (check-in), notatka czego się nauczyłem (check-out), Quote of the day akcent
- [ ] Logo: `/active/second-brain-2.png` lub jego SVG version (NIE drzewo)
