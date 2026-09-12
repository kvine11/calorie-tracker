# Design System — Calorie Tracker

Direction: **Oxide**. Created 2026-09-07 by `/design-consultation`, replacing the
"Organic" warm-paper system from the 2026-08-07 redesign.

## Product Context

- **What this is:** A personal calorie and macro tracker. A summer-long full-stack
  learning project — React + Vite frontend, Spring Boot + Postgres backend.
- **Who it's for:** The author, primarily. Secondarily anyone reading the repo or
  watching a demo in an interview.
- **Space:** Nutrition tracking. Peers: MyFitnessPal, Cal AI, Cronometer.
- **Project type:** Web app, desktop-first. Mobile is a deliberate later pass
  (see CLAUDE.md "Platform target").

## The one memorable thing

**The ring.** Everything else defers to it. When a decision is contested, the
tiebreak is whichever option makes the calorie ring more of the thing you
remember.

## Aesthetic Direction

- **Direction:** Industrial/Utilitarian, dark. An instrument, not a lifestyle app.
- **Decoration level:** Minimal. Typography, one accent, and a single radial wash
  behind the ring. No texture, no blur, no shadows on dark.
- **Mood:** Calm, precise, legible at 2am. The numbers are the content, so they
  get the typographic weight that photography carries in competitor apps.
- **Researched:** myfitnesspal.com (white + electric blue `#0B5CFF`, black bands),
  calai.app (near-black app, three separate macro rings in red/amber/blue,
  photography-led), cronometer.com.

## Safe choices (category literacy)

- **A ring as the primary calorie visualisation.** Universal in this category;
  breaking it would cost recognisability for no gain.
- **Dark ground.** Cal AI and the current AI-nutrition wave are here. It also
  happens to suit luminous data.
- **A stacked bar for macro composition.** Reads instantly, no legend required.

## Risks (where this gets its own face)

- **Jade accent, not blue.** MyFitnessPal owns blue, Cal AI's fat ring is blue,
  most health apps default to it. Jade is a deliberate half-step off the
  category's teal — close enough to read as health, far enough not to be
  Cronometer. **Gain:** immediate non-genericness. **Cost:** jade-on-dark is
  adjacent to territory some wellness apps already occupy; it is the least
  differentiated of the three directions considered.
- **One ring, not four.** Cal AI repeats the donut three times for P/C/F. That
  quadruples the visual noise and demotes the hero to one-of-four. Here: one
  circle (the instrument), one line (the energy bar), one ruled table (the
  ledger). **Gain:** the ring stays the memorable thing. **Cost:** macro
  proportions are marginally slower to read in a bar than in a dial.
- **Per-meal arcs are one hue in luminance steps, not six hues.** Six categorical
  colours turn a segmented ring into a clown pie and destroy the single colour
  memory. **Gain:** the ring reads as one object. **Cost:** meal identity can no
  longer be read from arc colour alone — the legend and hover carry it, and the
  legend dots are correspondingly less distinct.

## Typography

- **Display/Hero:** Familjen Grotesk 700 — humanist grotesque with genuine warmth
  in the letterforms, so it softens a cool ground without going rounded-and-friendly
  the way Quicksand did. Used for the calorie numeral and the date.
- **Body / UI / Labels:** Familjen Grotesk 400–600. One family throughout; the
  least type complexity to maintain, and its x-height holds up in dense numeric rows.
- **Data/Tables:** Same family with `font-variant-numeric: tabular-nums`. Every
  number in the app — calories, grams, percentages — is tabular. Non-negotiable.
- **Loading:** `https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400..700`
- **Scale:** ring numeral 42px · page title 30px · body 15px · rows 14px ·
  small 13px · micro 11px uppercase `0.16em` tracking. (Tightened from hero 52 /
  h1 38 in the 2026-09-12 compact pass.)

## Color

- **Approach:** Restrained. One accent. Colour is rare and always means something.

```css
--color-bg:          #0E1113;  /* ground */
--color-surface:     #161A1D;  /* cards */
--color-surface-2:   #1E2327;  /* inputs, hovered rows, dialogs */
--color-divider:     rgba(230,239,241,.10);

--color-text:        #E6EFF1;  /* never pure #FFF on dark */
--color-text-2:      rgba(230,239,241,.66);
--color-text-3:      rgba(230,239,241,.42);

--color-accent:      #2DD4A7;  /* jade — the ring, focus rings, primary button */
--on-accent:         #08110E;
--ring-track:        rgba(230,239,241,.09);
--ring-wash:         rgba(45,212,167,.09);
```

- **Ring arc ramp** (one hue, brightest first): `#7FF0D2 · #2DD4A7 · #20AA85 ·
  #178768 · #10644C · #0A4433`
- **Macros** (deliberately off the arc ramp so the energy bar never reads as more
  meals): protein `#7BDCA8` · carbs `#FFC24B` · fats `#8FA0AC`
- **Contrast:** text on ground ≈ 15:1; secondary ≈ 8:1; muted ≈ 4.3:1 and therefore
  restricted to ≥13px non-essential labels that never carry a value. Accent on
  ground ≈ 8.9:1, safe for text as well as for large shapes.
- **Elevation without glass:** no `backdrop-filter`, no drop shadows (invisible on
  near-black). Surfaces separate by a ~4% lightness step plus a 1px hairline.

## Spacing

- **Base unit:** 4px. Values in `index.css` are literal multiples of 4.
- **Density:** Compact. Rows are 40–44px; the ring card is the one generous surface.
- **Only what works:** nothing ships as a disabled "soon" placeholder. A feature
  appears in the interface when its backend exists.

## Layout

- **Approach:** Grid-disciplined. A 56px sticky top bar (mark, Today/History
  tabs, Quick add ⌘K) over a 1120px content column. Today is two columns — a
  300px ring card, then the log form and the meal ledger — collapsing to one at
  ≤960px.
- **Border radius:** sm 8px · md 16px (cards, palette) · full 9999px (inputs,
  buttons, pills).
- **Alignment:** everything is left-aligned to the grid **except the ring's centre
  number**, which is the only centred element in the app. That is what makes it
  read as the hero rather than as one more card.

## Motion

- **Approach:** Intentional. The ring is the only element allowed a flourish.
- **Library:** `framer-motion` (already a dependency).
- **Add a meal — three beats, ~500ms total.** The order matters: the row lands
  first so the eye is led list → ring.
  1. Row enters: `y 8 → 0`, `opacity 0 → 1`, 220ms `cubic-bezier(.22,1,.36,1)`.
     Rows beneath reflow with a `layout` spring (stiffness 380, damping 34).
  2. New arc draws from length 0 at the ring's current endpoint, 340ms expo-out,
     80ms after the row.
  3. Centre number counts up 450ms ease-out-quart with one `scale 1 → 1.035 → 1`
     pulse peaking at 260ms. **Nothing else on the page ever scales.**
- **Macro bar:** segment widths 280ms `cubic-bezier(.4,0,.2,1)`; grams count 320ms.
- **Delete:** row `opacity → 0, height → 0` 200ms ease-in; remaining arcs re-sweep
  340ms rather than snapping.
- **Ring draw-in** (date change / mount): dash sweep 620ms
  `cubic-bezier(.16,1,.3,1)`, arcs staggered 45ms chronologically.
- **Switching day:** the ledger crossfades 140ms and the ring redraws. Rows never
  mass-exit and mass-enter; per-row enter/exit is reserved for add and delete.
- **Shared highlights:** the active tab and the selected day are one element each
  that slides between positions (`layoutId`, spring 380/34).
- **View switch:** Today ↔ History fades with a 6px rise, 180ms.
- **Overlays:** the palette backdrop fades 120ms and its panel rises 8px; the
  toast rises 12px and a hairline drains over its lifetime. No overlay scales.
- **Must NOT animate:** typeahead result rows (fade the container 90ms, stagger
  nothing — staggered search results feel slow, and fast logging is the point of
  the app); hairlines; sidebar hover beyond a 90ms background change; macro
  colours; the hero number's font-size.
- **Reduced motion:** handled globally in `index.css`; count-ups snap, the ring
  renders complete.

## Implementation notes

Every colour in this codebase is a CSS custom property in `index.css`'s `:root` —
there are no hardcoded hex values in any component. A palette change is that one
block plus the font import. The component-level exceptions are `CalorieRing.jsx`
(stroke width, caps, the `SEG_COLORS` ramp) and `macros.js` (macro trio).
Easing curves and the layout spring live in `frontend/src/motion.js`.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-07 | Dark ground | User call. A ring and a macro bar are luminous data; they read as instruments on dark and go flat on cream. |
| 2026-09-07 | The ring is the one memorable thing | User call, and the part of the existing UI they already liked. |
| 2026-09-07 | Direction Oxide over Safelight / Graphite & Citron | User picked from three live mockups. Safelight (warm dark + ember + serif numeral) was the recommendation, backed by two independent design passes converging; Oxide was chosen as the calmer answer. |
| 2026-09-07 | One-hue luminance ramp for arcs; butt caps; 13px stroke | From the independent second pass. Six categorical hues make a clown pie; round caps turn small meals into floating pills; a thin ring reads as a bezel, a thick one as a fitness band. |
| 2026-09-07 | Macro trio off the arc ramp | So the energy bar sitting inches below the ring never reads as three more meals. |
| 2026-09-12 | Top bar replaces the 238px sidebar | User call. Only two destinations were real; a sidebar for two items spent a quarter of the width on navigation, and a top bar is already most of the way to the planned mobile tab bar. |
| 2026-09-12 | Removed Search, Settings, every "soon" item, the ring's meal legend | User asked for only what's necessary and working. Search duplicated the log form and ⌘K; Settings' toggles never persisted; the legend repeated the ledger beside it. |
| 2026-09-07 | Ring is always 100% full | There is no goal entity in the schema. The ring answers "where did today's calories come from", not "how much have I failed by" — which also frees the accent from ever meaning "bad". |
