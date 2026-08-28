# Design system — as built

Reference for building new components in this prototype. Everything below was read out of the
code, not from the spec. Where the code and the tokens disagree, both are recorded here and the
disagreement is listed in **[Drift](#drift)** at the end — do not treat this document as a
description of a tidy system.

Files: `src/css/tokens.css` (values) · `shell.css` (frame, safe area, transitions) ·
`components.css` (shared components) · `screens.css` (per-screen-family) · `src/icons.js` (icons)
· `src/content.js` (copy) · `src/format.js` (figures).

---

## 1. Type

### 1a. The token ladder (`tokens.css`)

Apple Dynamic Type "Large" sizes. Every token is `calc(<px> * var(--text-scale))`.

| Token base | Size / line | Weight token | Used for | In use? |
|---|---|---|---|---|
| `--text-large-title-*` | 34 / 41 | 700 | — | **never** |
| `--text-title1-*` | 28 / 34 | 400 | `.balance-card__amount` (at weight 600) | 1 rule |
| `--text-title2-*` | 22 / 28 | 400 | — | **never** |
| `--text-title3-*` | 20 / 25 | 400 | `.entry-card__title` (at weight 600) | 1 rule |
| `--text-headline-*` | 17 / 22 | 600 | App-bar and form-step titles, `.transaction-row__merchant`, `.disclosure__title`, `.next-steps-card__title` | 5 rules |
| `--text-body-*` | 17 / 22 | 400 | `.not-built` only | 1 rule |
| `--text-callout-*` | 16 / 21 | 400 | — | **never** |
| `--text-subheadline-*` | 15 / 22 | 400 | **The workhorse.** Body copy, list labels, values, buttons, banners | ~50 rules |
| `--text-footnote-*` | 13 / 18 | 400 | Captions, provenance, sublabels, chips, step labels | ~50 rules |
| `--text-caption1-*` | 12 / 16 | 400 | `.legal-text` (regulatory), frame 33 labels | 4 rules |
| `--text-caption2-*` | 11 / 13 | 400 | `.bottom-nav__label` | 1 rule |

`--font-family`: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, Roboto, sans-serif`.

### 1b. The Figma display scale (in `components.css` / `screens.css`, not tokenised)

These sizes are written as literal `calc(<px> * var(--text-scale))` in component rules. They are
the project's own Figma type styles and have **no token**. They are as much a part of the real
system as the ladder above — a new component will usually need one of these, not a token.

| Size / line / weight | Where | Role |
|---|---|---|
| 40 / 44 / 600 | `.figure-display`, `.figure-input__currency`, `.figure-input__value` | The big editable currency headline (05, 05b, 06) |
| 32 / 38 / 600 | `.range-figure__value` (12, 15, 16, 20), `.value-slider__currency` / `__figure` (04, 10) | Slider and range figures |
| 28 / 34 / 600 | `.currency-input__gutter`, `.currency-input__value` | Currency input (09, 09a, 09b) |
| 24 / 30 / 600 | `.screen-title`, `.result-panel__headline` | **Heading/L** — the screen title on every screen |
| 20 / 26 / 600 | `.section-heading`, `.how-this-works-card__title`, `.processing-state__title`, `.savings-question-card__question`, `.status-card__headline` | **Heading/M** — section headings |
| 17 / 26 / 400 | `.body-text-lg`, `.body-text-lg-primary`, `.result-panel__body` | Lead paragraph (17px on a generous 26px leading) |
| 17 / 24 / 600 | 17 rules — `.account-row__name`, `.data-source-row__label`, `.milestone-row__title`, `.radio-option__title`, `.empty-state-card__title`, `.option-comparison-card__amount`, `.next-steps-card__step-title` … | **Heading/S** — the most-used un-tokenised style in the codebase |

### 1c. Frame 33 "Text size: Large"

`state.textSize === 'large'` → `router.js`'s `applyScenarioClasses` puts `.text-large` on the
`.screen` element → `--text-scale: 1.15`. One flat multiplier, +15% (≈ one iOS Dynamic Type step).

**The critical mechanic:** `.text-large` re-declares *every* `--text-*-size`/`-line` token, not just
`--text-scale`. It has to. A custom property whose value references another custom property resolves
that inner `var()` **once, at its own declaration point** (`:root`, where `--text-scale` is `1`) and
inherits the already-substituted value down. Re-declaring `--text-scale` alone never reaches it.
Real properties (`font-size: calc(24px * var(--text-scale))`) resolve fresh at the point of use and
are fine.

> **Rule for new components:** if you write a raw size, use
> `calc(<px> * var(--text-scale))` — never a bare `px`. If you add a *token*, you must also add it
> to the `.text-large` block or it will silently not scale.

---

## 2. Colour

Light mode is **fixed** (D13). Nothing reads `prefers-color-scheme`. `:root` sets
`color-scheme: light` so UA-rendered chrome (form controls, canvas, selection, scrollbars) stays
light on an OS-dark device.

**Why:** the prototype is a research instrument. Participants join a moderated Teams session on
their own devices; two participants seeing different palettes is a confound, not a preference.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#f7f7f8` | Page background; also `.info-banner` and `.segmented-control` fill, and frame 33's card fill |
| `--color-surface` | `#ffffff` | Card, action bar, tab bar, sheet surface |
| `--color-surface-raised` | `#efeff1` | Muted blocks that must read as their own against the page |
| `--color-label` | `#17171c` | Primary text; primary-button fill; proportion-row fill |
| `--color-label-secondary` | `#6b6b74` | Secondary text, captions, provenance |
| `--color-label-tertiary` | `#6c6c73` | `.legal-text`, hints, placeholders, tab labels |
| `--color-label-inverse` | `#ffffff` | Text on a filled control; icon knockout |
| `--color-border-subtle` | `#e2e2e6` | **Decorative only** — dividers, card outlines |
| `--color-border-control` | `#8a8a8c` | **Sole boundary cue** — unselected chip/pill, currency field, radio ring |
| `--color-border-strong` | `#8f8f96` | Control boundaries — checkbox, choice buttons, slider thumb, `card--emphasis` |
| `--color-action-secondary-bg` | `#ffffff` | Secondary button fill |
| `--color-action-secondary-border` | `#8f8f96` | Secondary button border |
| `--color-accent` | `#007aff` | systemBlue — **defined, never used**; reserved for a future Brand theme |
| `--color-accent-neutral` | `#4d4d55` | The Greyscale theme's "on" colour: checked box, selected chip/pill, slider fill, progress fill, **focus ring** |
| `--color-warning` | `#d63228` | Warning-banner border and text |
| `--color-canvas` | `#e5e5ea` | Page behind the device frame (≥768px) |

**Accessibility pass:** `label-tertiary`, `warning`, `border-strong`, `action-secondary-border` were
darkened from their Figma values to clear WCAG 2.2 AA (4.5:1 text, 3:1 non-text UI), measured with a
relative-luminance script. `--color-border-control` was added in the same pass for the cases where a
border is the only boundary. `--color-border-subtle` was deliberately left alone — it is decorative,
not a 1.4.11 case.

A `.theme-dark` palette exists in `tokens.css` with the same accessibility treatment. **No frame 33
control can select it** — Theme offers Greyscale and Brand only. It is kept so the measurements
aren't lost.

---

## 3. Spacing

8pt grid with Apple's 4pt half-step.

| Token | Value | Typical use |
|---|---|---|
| `--space-xs` | 4px | Tight stacks (label→caption), `.info-link` gap |
| `--space-sm` | 8px | Chip gaps, action-bar internal gap, pill gaps |
| `--space-md` | 12px | Row vertical padding, icon↔text gap |
| `--space-lg` | 16px | **Default.** `.screen-content` padding and gap, card row padding |
| `--space-xl` | 20px | Card interior padding (`.balance-card`, `.entry-card`, `.next-steps-card`) |
| `--space-2xl` | 24px | Sheet content padding |
| `--space-3xl` | 32px | `.result-panel` / `.processing-state` vertical padding |
| `--space-4xl` | 40px | Page padding around the device frame |

A **2px** hairline gap is used ~14 times for label→value→caption stacks inside a row
(`.review-row__content`, `.milestone-row__content`, `.stat-row`, …). It is below the scale and
un-tokenised — see [Drift](#drift).

---

## 4. Radii, elevation, dividers

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 8px | Segmented-control segment, highlighted rate band |
| `--radius-md` | 12px | Buttons, info/warning banners, currency field, radio option |
| `--radius-lg` | 16px | `.card`, risk-warning card, processing state |
| `--radius-xl` | 20px | Sheet top corners |
| `--radius-full` | 999px | Chips, pills, progress track, radio circle |
| `--radius-device` | 55px | Device bezel (`shell.css` only) |

**Elevation: there is none.** The only `box-shadow` in the entire codebase is on `.device-bezel`
(`shell.css:279`) — the drop shadow under the mocked phone at ≥768px. Depth inside the app is
carried by surface colour and 1px borders, never by shadow. **A new component should not introduce
one.**

**Dividers** are 1px `--color-border-subtle`, in three forms:
- `.divider` — a standalone `<hr>` element.
- `border-bottom` on a row, with `:last-child`/`:last-of-type` removing it (`.figure-row`,
  `.review-row`, `.option-comparison-card__row`, `.how-this-works-card__row`).
- `border-top` on a row that separates itself from what precedes it (`.list-row`, `.flag-row`,
  `.how-this-works-card__nav`). `.list-row--plain` suppresses it.

---

## 5. Motion

| Token | Value | Curve name |
|---|---|---|
| `--duration-quick` | 200ms | — |
| `--duration-standard` | 300ms | — |
| `--duration-push` | 350ms | — |
| `--ease-standard` | `cubic-bezier(0.42, 0, 0.58, 1)` | easeInEaseOut |
| `--ease-out` | `cubic-bezier(0, 0, 0.58, 1)` | easeOut |
| `--ease-in` | `cubic-bezier(0.42, 0, 1, 1)` | easeIn |
| `--ease-spring` | `cubic-bezier(0.22, 1, 0.36, 1)` | Sheet settle — deliberately **no overshoot** |

| Transition | Mechanic | Duration / curve |
|---|---|---|
| **Push** | `.screen-push-enter` → `@keyframes screen-push-in`, `translateX(100%)` → `0`. ⚠️ **Defined but never applied by any JS — see [D-7](#d-7--push-and-pop-are-both-inert--no-full-screen-navigation-animates)** | 350ms `--ease-standard` |
| **Pop** | **Not implemented.** No pop class, no reverse keyframe | — |
| **Sheet rise** | `.sheet` → `@keyframes sheet-rise`, `translateY(100%)` → `0` | 300ms `--ease-out` |
| **Scrim** | `.sheet-scrim` → `@keyframes scrim-in`, opacity 0 → 1, over `rgba(0,0,0,0.4)` | 300ms `--ease-out` |
| **Sheet drag-settle** | `.sheet-overlay--settling` (`src/sheet-drag.js`) | 300ms `--ease-spring` |
| **Sheet drag-dismiss** | `.sheet-overlay--closing` | 200ms `--ease-in` |
| **Action-bar reveal** | opacity + `translateY(--space-sm)` → 0 | 300ms `--ease-out` |
| **Disclosure chevron** | `transform: rotate(180deg)` when closed | 200ms `--ease-standard` |
| **Spinner** | `processing-spin` 360° | 900ms linear, infinite |

**`prefers-reduced-motion: reduce`:**
- `.screen-push-enter`, `.sheet-scrim`, `.sheet` → `animation-name: cross-fade` at
  `--duration-quick`. Slide and rise become a fade.
- `.action-bar` → `transform: none`, fade only. The rise is decorative; the fade carries the state
  change.
- `.processing-state__spinner` → `animation: none`.
- **Sheet drag still tracks the finger** — responding to a gesture is not decoration. Only the
  settle and the exit become instant, decided in `sheet-drag.js` (it must also skip *waiting* for a
  transition that will not run).

---

## 6. Safe area (D14, as amended)

Two floors, `shell.css`:

```
--frame-safe-top: 59px      /* status-bar area */
--frame-safe-bottom: 34px   /* home indicator */
```

Resolved into one value each, so the screen and the sheet card cannot disagree:

| | `< 768px` (real hardware) | `≥ 768px` (mocked frame) |
|---|---|---|
| `--safe-top` | `env(safe-area-inset-top)` | `max(env(...), 59px)` |
| `--safe-bottom` | `env(safe-area-inset-bottom)` | `max(env(...), 34px)` |

Set on `:root` in the media query, not on `.screen` — the sheet card reads the same values.

**Top:** always `padding-top` on `.screen`. Content scrolls *under* the band and is clipped at it;
the band stays empty background. No status-bar element is ever drawn (D1).

**Bottom — the amendment.** The inset belongs **inside the lowest chrome**, not beneath it. Placing
it under the tab bar left a band of page background below the bar, which read as the app floating
off the bottom edge.

| Screen type | Who carries `--safe-bottom` |
|---|---|
| Has a tab bar (19 full screens) | `.bottom-nav`: `height: calc(56px + inset)` + `padding-bottom: inset` |
| Action bar, no tab bar | `.screen > .action-bar-dock:last-child .action-bar` (rule exists; no screen currently hits it) |
| Neither (19b, 33) | `.screen`'s own `padding-bottom` — the fallback |
| Sheets (03b, 10c, 13b, 29–32) | The sheet's own `.action-bar` (`screens.css:365`) |

`.screen:has(> .bottom-nav)` and `.screen:has(> .action-bar-dock:last-child)` zero `.screen`'s
`padding-bottom` so the two can never double up. Sheets are unaffected either way: the card is
absolute inside `.sheet-overlay`, resolving `inset: 0` against `.screen`'s padding box.

The **scrim deliberately covers the insets** — an inset keeps content clear of system furniture, it
does not stop a background painting there.

---

## 7. Layout shell

- Frame **393 × 852** (the Figma source, not the brief's 390 × 844), bezel 14px.
- One breakpoint at **768px**. Below: frameless, `.screen` is `100vh`. Above: framed, centred,
  `transform: scale(min(1, …))` — shrinks to fit a short viewport, never grows.
- `html, body { overflow: hidden }` — the page never scrolls in either view.
- Scrollbars hidden across the subtree (`scrollbar-width`, `-ms-overflow-style`,
  `::-webkit-scrollbar`) while `overflow-y: auto` is untouched, so wheel, touch, momentum **and
  focus-driven scrolling** all still work.
- `.screen` is a flex column: chrome is `flex: 0 0 auto`, `.screen-content` is `flex: 1 1 auto`
  with its own `overflow-y: auto`.
- **`.screen-content > * { flex: 0 0 auto }`** and the same rule for
  `.bottom-sheet > .bottom-sheet__content > *`. Without it, a row declaring its own `min-height`
  (a 48px touch target) is compressed below its content height instead of the box scrolling, and
  its own border draws through its own text.
- `:focus-visible` → 2px `--color-accent-neutral`, 2px offset, globally in `shell.css`.

---

## 8. Components (`components.css`)

Touch target column: ✅ = `var(--touch-target-min)` (48px) or larger.

### Navigation & chrome

| Component | What it is | Where | States | Target |
|---|---|---|---|---|
| `.app-bar` | 56px bar: leading cell, centred title, trailing cell | Every full screen except the calculator | leading = back / close / none | ✅ 48 (cell is 44 wide, `--action` variant 48) |
| `.form-step-header` | Back + title + close, plus a "Step n of 3" row | 09, 09a, 09b, 10, 10b, 11 | — | ✅ 48 |
| `.bottom-nav` | Bank tab bar, 5 tabs, persistent (D11) | 20 full screens | **three states — see below**: active / enabled-not-active / disabled | ✅ 48 |
| `.action-bar-dock` / `.action-bar` | Pinned primary + optional secondary, **always visible** (D39) | 15 full screens + 7 sheets — counted from the callers, not from the frame list. **Not 20**, which is the end of the MIP flow and carries no onward action (D50) | `.screen.actions-inline` picks the layout mode; dock `--more-below` draws a 56px fade above the bar | ✅ 48 |
| `.bottom-sheet__header` | Grabber bar above a heading + close row, fixed outside the scroller (D19) | 03b, 10c, 29–32 | close glyph present (29–32) or absent (03b, 10c) | ✅ 48 |

**The action bar has no hidden state (D39).** It is visible from first paint on every screen that
has one, and stays visible while the content scrolls beneath it. D17's `opacity: 0` +
`pointer-events: none` pair and the rise transition that carried the reveal are both gone; so is
the accessibility hazard they were carefully working around, since there is no longer any moment at
which the control that moves a participant forward is invisible.

Two layout modes, chosen by `src/action-bar.js` from whether the content overflows:

| Mode | When | The dock | The scroller |
|---|---|---|---|
| **Pinned** | content overflows | bottom of the flex column, above the tab bar | grows under the dock (negative margin) and reserves its measured height as padding |
| **Inline** (`.screen.actions-inline`) | content fits | directly after the last card | stops growing; no negative margin, no reserved padding |

`.bottom-nav` carries `margin-top: auto` so the **tab bar stays at the bottom of the phone screen in
both modes** — it is the bank's furniture, not the screen's, and must not move because a screen's
copy got shorter. Sheets are pinned only: their dock is absolute against a content-sized card, so a
sheet that fits already ends where its content does.

#### `.bottom-nav` has three tab states, not two

| State | Which tabs | Visual | ARIA | Focusable |
|---|---|---|---|---|
| **Active** | Home on `/home`, Goals on `/goals` — at most one, and only on those two routes | Indicator above the icon, **bold** label, **filled** icon variant, `--color-label` | `aria-current="page"` | yes |
| **Enabled, not active** | Whichever of Home / Goals is not the current route | Identical to disabled at rest: `--color-label-tertiary`, weight 400, outline icon, no indicator. Darkens to `--color-label` under a press | none | yes |
| **Disabled** | Payments, Insights, Profile | Same rest appearance as enabled-not-active | `disabled` + `aria-disabled="true"` | no |

**Enabled and disabled are deliberately identical standing still.** Being tappable is communicated
by responding to touch, not by looking different at rest. A tab that looked "available" while
another looked "current" is what the bar used to be, and the problem it caused was precisely that
participants read the available one as the current one.

**The original defect was an absence, not a wrong value.** Nothing set `color` on `.bottom-nav__tab`
at all, so an enabled tab inherited the document's full-strength label colour while a disabled one
was greyed by the **user agent's** own `:disabled` styling. Two treatments, neither chosen — and
Goals on `/home` drew exactly as dark as Home. Every state now declares its own colour;
`.bottom-nav__label` is `color: inherit` so icon and label can never disagree.

**Four cues on the active tab, only one of which is colour** — indicator, weight, filled icon,
colour — so the state does not rest on colour alone.

**The filled icon is a different drawing, not a CSS `fill`.** `TAB_ICONS_ACTIVE` in `icons.js` holds
`houseFill` and `targetFill`, following the existing `starCircle` / `starCircleFill` convention. A
blanket `fill: currentColor` would have been fewer lines and wrong: `target` is two sibling
`<circle>` elements and `fill-rule` applies within a path rather than across siblings, so both would
fill solid and the bullseye would become a disc. Only the two tabs that can *be* active have a
filled variant (rule 6).

**Most routes light nothing.** `TAB_FOR_ROUTE` in `router.js` maps `/home` and `/goals`; every other
route passes `null` and no tab is active. The rest of the app is the "Your first home" journey,
which is a feature reached *from* Home rather than Home itself — lighting Home on all 18 of those
screens claimed the participant was on the bank's home screen mid-way through a mortgage
calculator.

The sheet header is the one place a **48px target deliberately overhangs its own box**. The glyph is
24px, so `.bottom-sheet__close` carries negative right and top margins of half the difference: the
box spills into the card's edge padding and up into the header's, and the *glyph* — not the box —
lands on the body copy's right margin and on the centre of the heading's first line. That overhang
is also why `.bottom-sheet__title-row`'s top padding is `--space-2xl` rather than `--space-lg`: the
padding has to clear the target's 9px of upward spill *and* leave the grabber visibly alone. `13b`
has no heading of its own and takes the same 24px as `padding-top` on its scroller instead.

### Containers

| Component | What it is | Where | States | Target |
|---|---|---|---|---|
| `.card` | White, 1px subtle border, 16px radius | Everywhere | `--emphasis` (strong border), `--muted` (bg fill, frame 33) | n/a |
| `.balance-card` | Label + large amount | 01 | — | n/a |
| `.transactions-card` | Grouped transaction rows | 01 | — | n/a |
| `.entry-card` | Title + body, the feature entry point | 01 | — | n/a |
| `.empty-state-card` | Title + body + optional CTA (D7 fallback) | 06, 12 | — | n/a |
| `.how-this-works-card` | Title, intro, label/value/caption rows, nav row, optional footnote — **a disclosure, closed on load** (D12) | 06, 12, 13, 20, 21 | `--closed` (rotates chevron, hides everything below the title) | ✅ 48 (header, nav row) |
| `.next-steps-card` | Numbered step rows. A row is a `<button>` with a chevron when it declares an action and a plain `<div>` with neither when it does not — 21's three rows are all controls, 20's first is not (D50) | 20, 21 | `--divided` | ✅ 48 |
| `.result-panel` | Centred icon + headline + body | 20, 21 | — | n/a |
| `.processing-state` | Spinner + title + body + caption | 19b | — | n/a |

### Rows

| Component | What it is | Where | States | Target |
|---|---|---|---|---|
| `.list-row` | Label + chevron, top border | 01, 05, 08, 10, 11, 12, 33 | `--plain` (no border) | ✅ 48 |
| `.figure-row` | Label / value / caption, bottom border | 05, 06, 08, 29–32 | `--inline` (single line) | ✅ 48 |
| `.review-row` | Label, value, caption + "Change" link | 10, 10b, 11 | — | ✅ 48 |
| `.checklist-row` | Glyph + label + value + caption | 19 | checked / incomplete (`!` glyph) | ✅ 48 |
| `.stat-row` | Label + value + caption | 15, 16 | — | n/a |
| `.rate-band-row` | Label + sublabel + value | 15, 16 | `--highlighted` (2px `--color-label`) | n/a |
| `.milestone-row` | Icon + title + body, own divider | 15, 16 | `--locked` (secondary text); `button.` variant is tappable | ✅ 64 |
| `.option-comparison-card__row` | Amount + sublabel + technical | 09, 09b | `--selected` (2px `--color-label` box, `aria-current`, hidden "Selected" text) | ✅ 68 |
| `.tick-list__row` | Checkmark-circle + text | 17 | — | n/a |
| `.proportion-row` | Label + value + track + caption | 05, 05b, 06 | — | n/a |

**Marking one row in a set as the current one** has a single treatment: a **2px `--color-label`
box** at `--radius-sm`, with horizontal padding added to inset the content from the new box edge and
the vertical padding left alone. `.rate-band-row--highlighted` (15, 16 — the band matching the
participant's LTV) and `.option-comparison-card__row--selected` (09, 09b — the deposit % the screen
is built from) are the two users. Reach for this rather than a fill, a tint or a check glyph.

Two things come with it, and neither is optional. The row also carries **`aria-current="true"`** and
a **`.visually-hidden` span** naming it as selected — an outline is a shape rather than a colour, so
it is not strictly a 1.4.1 failure, but it is still invisible to a screen reader, and `aria-current`
on a `<div>` with no role is announced inconsistently. And the row **above** the marked one gets
`border-bottom-color: transparent` via `:has(+ …--selected)`, or its 1px divider sits a pixel off
the 2px box and reads as a drawing error. Suppressing by colour rather than by `none` keeps the
height identical, so the fix cannot itself shift the rows.

The marked row is ~3px taller than its neighbours (2px of border where there was none, and a bottom
edge going from a 1px divider to the 2px box). Rows below it shift by that much when the selection
moves; the scroller does not move, because the control that changes the selection re-renders through
`rerenderInPlace`.

### Controls

| Component | What it is | Where | States | Target |
|---|---|---|---|---|
| `.button` | Full-width, 12px radius | Everywhere | `--primary`, `--secondary`, `--choice` (`aria-pressed`), `:disabled` (0.4 opacity) | ✅ 48 |
| `.text-action` | Borderless centred text button | Sheets, action bars | — | ✅ 48 |
| `.chip` | Pill, deposit-% choice | 09, 09a, 09b | `--selected` | ✅ 48 |
| `.pill-segments__option` | Pill, one of N | 33 | `--selected` | ✅ 48 |
| `.segmented-control__segment` | Grouped track, inset selected segment | 10, 10b | `--selected` | ✅ 48 |
| `.checkbox-row` | Hidden native input + 24px box + label | 03 | checked / **indeterminate** / unchecked | ✅ 48 (row) |
| `.radio-option` | 24px circle + title + body | 03b | `aria-checked` | ✅ 72 |
| `.currency-input` | Label + £ gutter + 28px field + hint | 09, 09a, 09b | empty (placeholder) / filled / error | ✅ 48 |
| `.figure-input` | Big centred editable currency + caption | 05, 05b | — | ✅ 48 (input) |
| `.info-link` | Info-circle + underlined label | 08, 12, 13, 15, 16 | — | ✅ 48 |
| `.disclosure` | Header + chevron + content | 05, 05b, 06, 19 | `--closed` (rotates chevron, hides content) | ✅ 48 |
| `.flag-row` | Flag icon + label + chevron — the DUAA pushback control | Most figure screens | — | ✅ 48 |

The checkbox keeps a **real, focusable** `<input>`, visually hidden with `clip-path` — not
`display:none`. It carries `indeterminate`, which exists only as a DOM property, and it is what a
screen reader announces. The focus ring is drawn on the box beside it.

**Two collapsible components, one action name.** `.disclosure` and `.how-this-works-card` both emit
`data-action="toggle-disclosure"` plus a `data-disclosure-id`, so a screen binds
`querySelectorAll` and routes on the id. Frame 06 is the screen that has both, and it is the reason
the id exists: a bare `querySelector` there would wire the first collapsible and leave the second
inert with no error. `disclosureId` is already in `rerenderInPlace`'s `FOCUS_KEY_ATTRS`, so the
toggle that was pressed is the element refocused after the re-render — which is what makes a
collapsible open under the thumb rather than throwing the screen to the top. Every collapsible key
belongs in `COLLAPSIBLE_DEFAULTS` (`src/state.js`), one per screen, or D12's closed-on-load and
reset-on-navigation rules will not reach it.

### Text & feedback

| Component | Role |
|---|---|
| `.screen-title` / `.section-heading` | Heading/L (24/30) and Heading/M (20/26) |
| `.body-text` / `.body-text-lg` / `.body-text-lg-primary` | 15/22, 17/26 secondary, 17/26 primary |
| `.provenance-caption` | 13/18 secondary — **D5**, says where a figure came from |
| `.legal-text` | 12/16 tertiary — regulatory lines, verbatim from `content.js` |
| `.info-banner` | Info-circle + text, page-grey fill |
| `.warning-banner` | Warning triangle + text, `--color-warning` border (D7 fallback) |
| `.risk-warning-card` | 2px strong border — MCOB 3A repossession warning |
| `.progress-bar` | Track + fill + marker + label |
| `.visually-hidden` | Clipped to 1px but left in the accessibility tree — for a visual cue a screen reader would otherwise never receive (09's selected row). Never `display: none` / `visibility: hidden`, which remove it from the tree entirely |

---

## 9. Icons

`src/icons.js` is the **only** source of icons. Verified: no inline `<svg>` outside it, no `<img>`
icons, no emoji, no character glyphs standing in for symbols anywhere in `src/`.

All 27 icons are drawn on one **24×24 canvas** with round caps and round joins. Every function
returns an SVG string and takes `{ size, weight, className, label }`.

```js
import { chevronRight } from '../icons.js';
chevronRight({ size: 'body', className: 'list-row__chevron' })
```

Icons are `aria-hidden` by default — every icon in this app sits beside its own visible label or
inside a button carrying an `aria-label`. Pass `label` to make one meaningful.

**Sizing is derived from the type scale**, at roughly 1.2× the font size the icon sits beside:

| Size class | Box | Pairs with | Optical stroke correction |
|---|---|---|---|
| `micro` | 12px | 11px caption2, stepper controls | +0.95 |
| `footnote` | 16px | 13px footnote | +0.45 |
| `subheadline` | 18px | 15px subheadline | +0.22 |
| `body` | 20px | 17px body / headline | 0 |
| `title3` | 24px | 20px title3, app-bar controls | 0 |
| `large` | 32px | standalone in a card | −0.20 |
| `hero` | 40px | standalone as a screen's illustration | −0.45 |

Weights `regular` / `medium` / `semibold` / `bold` = stroke 1.85 / 2.1 / 2.4 / 2.7 canvas units,
tracking the font weight beside them. The rendered stroke stays ≈1.5px flat across the text-paired
sizes, then grows sub-linearly at display sizes.

**Why the size tokens are plain px, not `calc(… * var(--text-scale))`:** a custom property that
references another custom property freezes at `:root`. `components.css` multiplies by
`--text-scale` in the real `width`/`height` properties instead, where the `var()` resolves fresh.
Icons therefore scale with frame 33's Large setting — which the fixed-pixel SVG assets they
replaced never did.

Shape modifiers: `.icon__fill` (filled + stroked, so round joins soften the corners), `.icon__solid`
(fill only), `.icon__knockout` (reversed out in `--color-label-inverse`), `.icon__dot` (a
zero-length round-capped subpath, so a dot scales with weight), `.icon__dashed`.

Exports: `chevronRight/Left/Up/Down`, `arrowLeft/Right/Up/UpRight`, `xmark`, `minus`, `checkmark`,
`checkmarkCircle`, `circle`, `infoCircle`, `exclamationTriangle`, `lock`, `starCircle`,
`starCircleFill`, `starCircleDashed`, `playCircle`, `chartBarCircle`, `flag`, `photo`, `bullet`,
`house`, `arrowLeftArrowRight`, `target`, `diamond`, plus `TAB_ICONS`.

---

## 10. Rules for a new component

1. **Tokens, never raw values.** Colour, spacing and radius must come from `var(--…)`. For type,
   either a `--text-*` token or `calc(<px> * var(--text-scale))` — never a bare `px` font size.
   If you add a type token, add it to the `.text-large` block too.
2. **48px minimum touch target** (`var(--touch-target-min)`, D1). Put it on the *row*, not the
   glyph — a 24px checkbox inside a 48px row is correct. Never shrink a target to match Figma.
3. **Copy comes from `content.js`.** One key per route, named for what the string *is*
   ("balanceLabel"), never for its position. No literal participant-facing string in a screen
   module. `shared.regulatory`'s four keys are **fixed wording** — never reworded, shortened, or
   dropped from a screen that carries them.
4. **Figures come from the model, through `format.js`.** Screens never compute a figure inline and
   never format one themselves: `formatCurrency`, `formatAccountBalance`, `formatPercent`,
   `formatDigits`, `formatMonthsDuration`, `formatMonthYear`, `formatMonthYearRange`,
   `formatFullDate`. en-GB, £, nearest £1. Rates come from `model/rates.js` as dated constants,
   never fetched.
5. **Every figure carries its provenance.** `read` / `derived` / `estimated` / `entered`, rendered
   as a `.provenance-caption` under the row (D5). It must update when the figure is edited —
   anything derived from an entered value is itself `entered`.
6. **A component only enters `components.css` when 2+ screens need it.** One screen's pattern lives
   in `screens.css`. No speculative abstraction.
7. **Never `visibility: hidden` or `display: none` on anything interactive.** Use `opacity: 0` +
   `pointer-events: none` so it stays focusable and announced.
8. **No `box-shadow`.** Depth is surface colour and 1px borders.
9. **A row with its own `min-height` inside a scroller** needs `flex: 0 0 auto` from its parent
   rule, or it will be compressed below its content and its border will cross its own text.
10. **Longhand vs shorthand:** a `padding`/`margin` shorthand later in the file silently resets a
    longhand set earlier at equal specificity. Win on **specificity**, not source order.

---

## Drift

Where the tokens and the code disagree. Nothing here is fixed — this is a record.

### D-1 · Two parallel type scales

The `--text-*` ladder is Apple's Dynamic Type. The sizes screens actually use for headings and
figures are the project's Figma styles, written raw. They **conflict on the same nominal size**:

| Nominal | Token says | Code uses | Where |
|---|---|---|---|
| 20px | `--text-title3` 20/**25** | 20/**26** | `.section-heading` + 4 others |
| 17px | `--text-body` 17/**22** | 17/**24** (w600) and 17/**26** (w400) | 20 rules |

`17/24 w600` appears in **17 rules** and has no token at all — it is the de facto "Heading/S" of
this app. A future session adding a heading component has no token to reach for and will most
likely hand-roll an 18th copy.

### D-2 · Seven type tokens defined and never used

`--text-large-title-*` (34/41), `--text-title2-*` (22/28), `--text-callout-*` (16/21) are entirely
unconsumed. So are the weight tokens `--text-body-weight`, `--text-footnote-weight`,
`--text-caption1-weight`, `--text-caption2-weight`, `--text-title1-weight`, `--text-title3-weight`
— rules set a literal `font-weight` instead. Only `--text-headline-weight` and
`--text-subheadline-weight` are ever read.

Related: `--text-title1` and `--text-title3` are each used by exactly **one** rule, and both
override the token's own weight (400) with 600.

### D-3 · Slider handle is a 28px touch target — below the 48px minimum

`.value-slider__range` is `height: 44px` with `pointer-events: none`; only
`::-webkit-slider-thumb` / `::-moz-range-thumb` take pointer events, at **28 × 28px**. This is the
one control in the app that fails D1's 48px rule, and it is the primary input on frames 04, 10 and
10b. Everything else measured ✅.

### D-4 · `--color-accent` is defined and never used

`#007aff` systemBlue, reserved for a "Brand" theme that frame 33 offers but nothing implements.
Selecting Brand currently changes nothing on screen.

### D-5 · A 2px gap that is not on the spacing scale

Used ~14 times for label→value→caption stacks (`.review-row__content`, `.milestone-row__content`,
`.stat-row`, `.rate-band-row__content`, `.checklist-row__content`, `.next-steps-card__content`,
`.radio-option__text`, …). It is a real, consistent design decision — the half-step below
`--space-xs` — with no token. Also one-off `6px` (`.how-this-works-card__row`,
`.date-stepper__hint`) and `1px` (`.tick-list__icon`).

### D-6 · Radii below `--radius-sm` are raw

`7px` (`.checkbox-row__box`), `3px` (`.proportion-row__track`/`__fill`), `2px`
(`.bottom-nav__active-rule` at 1px, chart bars, focus ring), `50%` (slider thumb, step circles),
`6px` (`.date-stepper__step`). The scale starts at 8px and has nothing for hairline shapes.

### D-7 · Push and pop are both inert — no full-screen navigation animates

`shell.css` defines `.screen-push-enter` and its `screen-push-in` keyframe, and there is no pop
class or reverse keyframe at all. But the larger finding is that **`.screen-push-enter` is never
applied by any JavaScript** — `grep -rn "screen-push-enter" src/ --include=*.js` returns nothing.
`renderCurrentRoute` sets `container.className = 'screen'` on every navigation and adds only
`.text-large` / `.theme-dark`.

So every full-screen transition in the app is instant. The only motion on navigation is the sheet
rise and scrim fade, which work because `.sheet` and `.sheet-scrim` are written into the seven
sheet screens' own markup. `SPEC.md`'s transition rules describe a horizontal slide with the
outgoing view parallaxing; none of that is wired up, and the parallax was never written.

The `prefers-reduced-motion` block that re-targets `.screen-push-enter` to a cross-fade is
consequently also dead code.

### D-8 · The `.text-large` block is a hand-maintained duplicate

Eleven token pairs are written twice — once in `:root`, once in `.text-large`. The mechanism is
sound and well documented, but a token added to one block and not the other fails silently: it
simply will not scale, with no error. This is the most likely future regression in the file.

### D-9 · `--color-bg` carries three different jobs

Page background, `.info-banner` fill, `.segmented-control` fill — and then, on frame 33 only, the
*card* fill against a whitened page (`.settings-screen` + `.card--muted`). `--color-surface-raised`
exists for "a muted block that must read as its own", which is close to the banner's job, but the
banner does not use it.
