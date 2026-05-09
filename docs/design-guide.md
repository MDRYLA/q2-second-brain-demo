# Design Guide — Q2 Second Brain (public demo)

(Pełny design guide w private upstream. Tu skrót — projekt ma DWA warianty UI:)

## Wariant `bold-v1` (Magazine cover)
- **Fonty:** Boldonse (display), Caveat (handwritten accents), system-ui (body)
- **Paleta:** cream paper `#f8f7f4` + accent red `#c8392f` + navy `#1a1a1a`
- **Komponenty:** hand-drawn flower SVGs (FlowerXxx), border-top accents, cream paper sections
- **Mood:** warm, editorial, magazine-cover

## Wariant `chrome-v2` (Apple Vision)
- **Fonty:** Cormorant Garamond (display serif), JetBrains Mono (numerics), Inter (body)
- **Paleta:** glass-morphic dark `rgba(20,28,46,0.55)` + Baby Blue accent `#7CA3D9`
- **Komponenty:** numbered sections (CSS counter 001-N), floating glass tiles, ShieldCheck icons
- **Mood:** futuristic, refined, Apple Vision aesthetic

## Współdzielone
- **Spacing:** 4px base, multiples (4, 8, 12, 16, 24, 32, 48, 64)
- **Border radius:** 8px (cards), 4px (inputs), 999px (pills)
- **Shadows:** minimal — borders preferred over shadows
- **Motion:** delikatne, <250ms, ease-out; brak gamification animations (badges, streaks)

Per-variant CSS tokens w `src/styles/v/<variant>/tokens.css`.
