/**
 * The prototype's single icon set — one place, one drawing style.
 *
 * Every icon in the app comes from this module. Nothing else renders an
 * icon: there are no .svg assets under assets/icons/ any more (only the PWA
 * app icons and the favicon, which are platform install artefacts, not UI),
 * no <img> icons, no emoji, and no character glyphs standing in for symbols.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------------
 * The icons this replaced were exported piecemeal from Figma at whatever
 * canvas each one happened to be drawn on, then rendered at a fixed pixel
 * box. Because stroke width is expressed in the *source* canvas's units, a
 * 1.5-unit stroke rendered at wildly different weights depending on how far
 * each asset had to be scaled up:
 *
 *   chevron-right.svg   viewBox 6.5 x 7.5,  rendered 20x20  -> ~4.0px stroke
 *   chevron-up.svg      viewBox 10 x 4,     rendered 20x20  -> ~3.0px stroke
 *   back.svg            viewBox 24 x 24,    rendered 24x24  -> ~1.5px stroke
 *   tick.svg            viewBox 12.8 x 9.8, rendered 12.8   -> ~1.8px stroke
 *
 * So the disclosure chevron and the list-row chevrons rendered two to three
 * times heavier than the app bar's back arrow on the same screen. That is
 * the inconsistency this module removes: every icon is now drawn on one
 * 24x24 canvas, so one declared stroke weight means the same optical weight
 * everywhere.
 *
 * ---------------------------------------------------------------------------
 * SOURCING NOTE — what could and could not be read from Apple
 * ---------------------------------------------------------------------------
 * https://developer.apple.com/sf-symbols/ was fetched, as the brief asked.
 * It is a client-rendered page and yields one usable sentence:
 *
 *   "Symbols come in nine weights and three scales, automatically align with
 *    text, and can be exported and edited using vector graphics tools to
 *    create custom symbols with shared design characteristics and
 *    accessibility features."
 *
 * The linked HIG page (developer.apple.com/design/human-interface-guidelines/
 * sf-symbols) returns only its <title> to a fetch — the same SPA behaviour
 * already recorded at the top of tokens.css for the typography and colour
 * pages. No numeric grid, stroke or optical-size table is published in
 * fetchable form; those live inside the SF Symbols macOS app.
 *
 * So the geometry below is built from the one sentence above plus the
 * conventions that are directly observable in any SF Symbols rendering, and
 * it is stated here as a decision rather than presented as a transcription
 * of Apple's spec:
 *
 *   1. Round terminals. Every open stroke ends in a round cap and every
 *      corner is a round join. This is the single most recognisable SF
 *      Symbols trait and it is applied without exception below.
 *   2. Weight tracks text weight. The set is drawn at four weights matching
 *      the four font weights this prototype's type scale actually uses
 *      (400/500/600/700). Apple ships nine; the other five are not drawn
 *      because no text style here would pair with them, and drawing unused
 *      weights would be speculative.
 *   3. Optical sizing. Relative stroke weight increases as the icon gets
 *      smaller, so a 12px icon does not thin out to a hairline, and eases
 *      off at display sizes so a 40px icon does not read as heavy. This is
 *      what Apple's three scales do; the adjustment table is this build's
 *      own, calibrated by eye against SF Pro's stem weights at each size.
 *   4. Optical square. Symbols are drawn inside roughly x/y 3-21 of the
 *      24-unit canvas rather than filling it, leaving the clearance that
 *      lets an icon sit beside text without crowding it.
 *   5. Alignment with text. Icon box size is derived from the type scale in
 *      tokens.css (--icon-size-*), at roughly 1.2x the font size it sits
 *      beside, so an icon's optical size tracks its label — including when
 *      frame 33's "Text size: Large" control raises --text-scale, which the
 *      old fixed-pixel assets did not follow.
 *
 * DELIBERATELY NOT DONE: the SF Symbols font is not embedded and none of
 * Apple's own symbol artwork is shipped or traced. Apple's licence for those
 * assets is written for apps on Apple platforms; this is a web app. What is
 * matched is the drawing convention, which is not the artwork.
 *
 * ---------------------------------------------------------------------------
 * USING IT
 * ---------------------------------------------------------------------------
 *   import { chevronRight } from '../icons.js';
 *   chevronRight()                                  // default: body size, regular
 *   chevronRight({ size: 'title3', weight: 'semibold' })
 *   chevronRight({ className: 'list-row__chevron' }) // extra class for layout
 *
 * Every function returns an SVG string, the same contract as
 * components/ui.js. Icons are decorative by default (aria-hidden), because
 * every icon in this app sits beside its own visible label or inside a
 * button that carries an aria-label. Pass `label` to make one meaningful.
 *
 * Sizes:  micro | footnote | subheadline | body | title3 | large | hero
 * Weights: regular | medium | semibold | bold
 * Both resolve to classes; the numbers live in components.css so the type
 * scale and the icon scale stay in one stylesheet, not split across two.
 */

const SIZES = new Set(['micro', 'footnote', 'subheadline', 'body', 'title3', 'large', 'hero']);
const WEIGHTS = new Set(['regular', 'medium', 'semibold', 'bold']);

/**
 * Wraps one icon's path data in the shared SVG shell.
 *
 * `fill="none"` and `stroke="currentColor"` are set as presentation
 * attributes rather than CSS so an icon still draws correctly if it is ever
 * rendered before components.css has applied — and `currentColor` is what
 * makes every icon inherit its context's colour, which is why no icon below
 * names a colour of its own. The two exceptions are marked with classes
 * (.icon__knockout, for a glyph reversed out of a filled shape).
 *
 * stroke-width is deliberately NOT set here: it comes from components.css,
 * where the icon's weight and the optical correction for its size are added
 * together in one calc(). A presentation attribute cannot hold a calc().
 */
function icon(name, body, { size = 'body', weight = 'regular', className = '', label = null } = {}) {
  if (!SIZES.has(size)) throw new Error(`icons.js: unknown size "${size}"`);
  if (!WEIGHTS.has(weight)) throw new Error(`icons.js: unknown weight "${weight}"`);

  const classes = ['icon', `icon--${name}`, `icon--${size}`, `icon--${weight}`];
  if (className) classes.push(className);

  // Decorative by default. focusable="false" keeps IE/legacy-Edge from
  // making the <svg> itself a tab stop inside a button.
  const a11y = label
    ? `role="img" aria-label="${label}"`
    : 'aria-hidden="true"';

  return `<svg class="${classes.join(' ')}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" focusable="false" ${a11y}>${body}</svg>`;
}

/* ==========================================================================
   Chevrons

   One chevron, drawn once and rotated in 90-degree steps, so all four are
   guaranteed identical in weight and proportion — the original set had a
   6.5x7.5 chevron-right and a 10x4 chevron-up that shared neither. The
   6.5:13 width-to-height ratio (a 45-degree vertex) is the proportion iOS
   uses for list disclosure indicators.
   ========================================================================== */

export function chevronRight(o) { return icon('chevron-right', '<path d="M9.5 5.5L16 12L9.5 18.5"/>', o); }
export function chevronLeft(o) { return icon('chevron-left', '<path d="M14.5 5.5L8 12L14.5 18.5"/>', o); }
export function chevronUp(o) { return icon('chevron-up', '<path d="M5.5 14.5L12 8L18.5 14.5"/>', o); }
export function chevronDown(o) { return icon('chevron-down', '<path d="M5.5 9.5L12 16L18.5 9.5"/>', o); }

/* ==========================================================================
   Arrows

   Shaft plus a two-segment head, drawn as separate subpaths so the head's
   vertex gets a round join while the shaft keeps round caps at both ends.
   The head is a 45-degree wedge, matching the chevrons above, so an arrow
   and a chevron on the same screen read as the same family.
   ========================================================================== */

/** Back. The app bar's leading control on every pushed screen. */
export function arrowLeft(o) {
  return icon('arrow-left', '<path d="M20 12H4"/><path d="M10.25 5.75L4 12L10.25 18.25"/>', o);
}

export function arrowRight(o) {
  return icon('arrow-right', '<path d="M4 12H20"/><path d="M13.75 5.75L20 12L13.75 18.25"/>', o);
}

export function arrowUp(o) {
  return icon('arrow-up', '<path d="M12 20V4"/><path d="M5.75 10.25L12 4L18.25 10.25"/>', o);
}

/** Diagonal "trending upward". Frame 06's deposit status, frame 21's result. */
export function arrowUpRight(o) {
  return icon('arrow-up-right', '<path d="M5.2 18.8L18.8 5.2"/><path d="M9.4 5.2H18.8V14.6"/>', o);
}

/* ==========================================================================
   Marks
   ========================================================================== */

/** Close / dismiss. */
export function xmark(o) {
  return icon('xmark', '<path d="M6.2 6.2L17.8 17.8"/><path d="M17.8 6.2L6.2 17.8"/>', o);
}

/**
 * The dash of a mixed-state checkbox. Its own icon rather than a CSS bar so
 * it carries the same round terminals and the same weight as the checkmark
 * it alternates with inside the same box.
 */
export function minus(o) {
  return icon('minus', '<path d="M5.5 12H18.5"/>', o);
}

/**
 * Bare checkmark, for a control that supplies its own container — the
 * consent checkbox, whose filled box this reverses out of.
 */
export function checkmark(o) {
  return icon('checkmark', '<path d="M4.6 12.4L9.6 17.4L19.4 6.6"/>', o);
}

/** Checkmark inside a ring. A completed/confirmed state, not a control. */
export function checkmarkCircle(o) {
  return icon(
    'checkmark-circle',
    '<circle cx="12" cy="12" r="9"/><path d="M7.6 12.25L10.65 15.3L16.4 8.9"/>',
    o
  );
}

/** Empty ring. An item not yet satisfied (frame 19), and the profile tab.
 *  Also a step still ahead on frame 18's process timeline. */
export function circle(o) {
  return icon('circle', '<circle cx="12" cy="12" r="9"/>', o);
}

/**
 * Ring with a solid centre. "You are at this point in a sequence" — frame
 * 18's process timeline marks the Mortgage in Principle step with it.
 *
 * The inner disc carries `.icon__fill` and the ring does not, the same
 * construction `targetFill` uses: two sibling circles cannot share a
 * `fill-rule`, so filling both would give a solid blob rather than a dot
 * inside a ring. Named for what it draws rather than reusing `targetFill`,
 * which is the Goals tab's active glyph and means something else.
 *
 * Deliberately NOT a checkmark or a star: a step the participant has
 * reached is not a step they have completed, and this timeline has no
 * completed state at all (DECISIONS.md D36).
 */
export function circleDot(o) {
  return icon(
    'circle-dot',
    '<circle cx="12" cy="12" r="9"/><circle class="icon__fill" cx="12" cy="12" r="4"/>',
    o
  );
}

/**
 * Information.
 *
 * The lowercase i is a stem plus a dot. The dot is a zero-length subpath
 * with a round cap rather than a <circle>, so it is drawn by the stroke
 * engine and therefore scales with the icon's weight exactly as the stem
 * does — a filled <circle> would keep one fixed radius across all four
 * weights and look wrong at semibold. .icon__dot widens it slightly
 * relative to the stem, which is how SF Pro's own lowercase i is drawn.
 */
export function infoCircle(o) {
  return icon(
    'info-circle',
    '<circle cx="12" cy="12" r="9"/><path class="icon__dot" d="M12 7.55V7.55"/><path d="M12 11.1V16.6"/>',
    o
  );
}

/**
 * Warning triangle.
 *
 * The corners are explicit 2-unit arcs rather than relying on
 * stroke-linejoin, because a round join on a 60-degree vertex gives a
 * radius of only half the stroke width — far tighter than the generous
 * corner rounding that makes Apple's triangle read as a triangle rather
 * than a caution sign. Trim distance along each edge is r / tan(30deg).
 */
export function exclamationTriangle(o) {
  return icon(
    'exclamation-triangle',
    '<path d="M10.267 6.207A2 2 0 0 1 13.733 6.207L20.067 17.193A2 2 0 0 1 18.33 20.2H5.67A2 2 0 0 1 3.933 17.193Z"/>' +
      '<path d="M12 9.9V14.2"/><path class="icon__dot" d="M12 17.3V17.3"/>',
    o
  );
}

/**
 * Padlock, closed.
 *
 * Drawn for completeness of the set — see the audit note in DECISIONS.md
 * D15. The prototype's one "locked" state (frame 15's milestone that
 * unlocks at the 75% checkpoint) is drawn in the reference PNG as a dashed
 * ring around a faint star, not as a padlock, so starCircleDashed below is
 * what that row renders. Swapping it for this would be redesigning the
 * frame, not restyling its icon.
 */
export function lock(o) {
  return icon(
    'lock',
    '<path d="M8 10.6V7.9A4 4 0 0 1 16 7.9V10.6"/>' +
      '<rect x="4.6" y="10.6" width="14.8" height="9.4" rx="2.6"/>',
    o
  );
}

/* ==========================================================================
   Stars and the milestone family

   One star path, used bare and in three ring treatments. Five points,
   outer radius 8.5 and inner radius 4.0 about the canvas centre — a fuller
   star than the geometric 0.382 inner ratio, which is what keeps it
   legible at 20px and matches how Apple's star reads.

   Filled variants are filled AND stroked in the same colour: the stroke's
   round joins are what round off the five points, which is how a filled SF
   symbol gets its soft corners.
   ========================================================================== */

/* The star, at the scale it sits at inside a ring — which is the only way
   this app uses it. A bare full-canvas star is not exported: nothing renders
   one, and SPEC.md's "no speculative abstraction" rule applies to this
   module as much as to components/ui.js. */
const STAR_INSET =
  'M12 7.09L13.458 10.354L17.012 10.731L14.358 13.126L15.097 16.624L12 14.84L8.903 16.624L9.642 13.126L6.988 10.731L10.542 10.354Z';

/**
 * Star in an outlined ring. Frame 02's "what you'll get out of this" rows,
 * and the milestone a participant has just reached (frames 15, 16).
 */
export function starCircle(o) {
  return icon(
    'star-circle',
    `<circle cx="12" cy="12" r="9"/><path class="icon__fill" d="${STAR_INSET}"/>`,
    o
  );
}

/**
 * Star reversed out of a solid disc — a milestone already passed.
 * .icon__knockout paints the star in --color-label-inverse so it stays
 * legible against the filled disc in either palette, rather than being
 * hardcoded white as the old asset was.
 */
export function starCircleFill(o) {
  return icon(
    'star-circle-fill',
    `<circle class="icon__fill" cx="12" cy="12" r="10.8"/><path class="icon__knockout" d="${STAR_INSET}"/>`,
    o
  );
}

/** Star in a dashed ring — a milestone not yet unlocked (frame 15). */
export function starCircleDashed(o) {
  return icon(
    'star-circle-dashed',
    `<circle class="icon__dashed" cx="12" cy="12" r="9"/><path d="${STAR_INSET}"/>`,
    o
  );
}

/* ==========================================================================
   Content glyphs
   ========================================================================== */

/** Video. Frames 13, 13b, 18's media placeholders. */
export function playCircle(o) {
  return icon(
    'play-circle',
    '<circle cx="12" cy="12" r="9"/><path class="icon__fill" d="M10 7.9L16.7 12L10 16.1Z"/>',
    o
  );
}

/** Chart. Frame 13's "see it as a diagram" row. */
export function chartBarCircle(o) {
  return icon(
    'chart-bar-circle',
    '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M8.4 15.6V12.9"/><path d="M12 15.6V10.5"/><path d="M15.6 15.6V8.7"/>',
    o
  );
}

/** Flag. The DUAA "something doesn't look right" pushback control. */
export function flag(o) {
  return icon(
    'flag',
    '<path d="M6.5 3.6V20.4"/><path d="M6.5 4.9H18.4L15.4 8.9L18.4 12.9H6.5"/>',
    o
  );
}

/** Picture. Frame 02's illustration placeholder. */
export function photo(o) {
  return icon(
    'photo',
    '<rect x="3.2" y="5" width="17.6" height="14" rx="3"/>' +
      '<circle cx="8.9" cy="10.2" r="1.6"/>' +
      '<path d="M4.6 17.8L10.6 11.6L15 16L17 14L19.4 16.4"/>',
    o
  );
}

/**
 * List bullet. The one place the app used a literal "•" as an ornament
 * (frame 04's assumptions card). Solid, no stroke — a bullet has no
 * terminals to round — and drawn small within the canvas so it sits at a
 * bullet's optical size when rendered at a text-matched box.
 */
export function bullet(o) {
  return icon('bullet', '<circle class="icon__solid" cx="12" cy="12" r="2.4"/>', o);
}

/* ==========================================================================
   Bank tab bar (frame 01's five tabs, now on every journey screen)

   These keep exactly the shapes the reference PNG draws — a house, a
   two-way transfer, concentric rings, a rhombus, a ring — redrawn on the
   shared canvas at the shared weight. What each tab depicts is frame 01's
   design and is not changed here; only how it is drawn is.
   ========================================================================== */

export function house(o) {
  return icon('house', '<path d="M12 3.6L20.4 12H17.28V20.4H6.72V12H3.6Z"/>', o);
}

export function arrowLeftArrowRight(o) {
  return icon(
    'arrow-left-arrow-right',
    '<path d="M3.6 8.4H20.4"/><path d="M16.8 12L20.4 8.4L16.8 4.8"/>' +
      '<path d="M20.4 15.6H3.6"/><path d="M7.2 19.2L3.6 15.6L7.2 12"/>',
    o
  );
}

export function target(o) {
  return icon('target', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>', o);
}

export function diamond(o) {
  return icon('diamond', '<path d="M12 3.2L20.8 12L12 20.8L3.2 12Z"/>', o);
}

/**
 * Lookup for the tab bar, so ui.js's bottomNavHTML can stay a loop over the
 * five tabs rather than a switch. Profile reuses `circle` — frame 01 draws
 * that tab as a plain ring, and inventing a person glyph for it would be a
 * design change, not a restyle.
 */
/**
 * FILLED VARIANTS FOR THE TWO TABS THAT CAN BE ACTIVE.
 *
 * Apple's tab bars swap an outline symbol for its filled twin on the selected
 * tab, and that swap is one of the three cues `.bottom-nav__tab--active`
 * carries (indicator, bold label, filled icon — see components.css). The
 * existing `starCircle` / `starCircleFill` pair is the same convention: a
 * separate export rather than a flag on `icon()`, because "filled" is a
 * different drawing, not a different rendering of the same one.
 *
 * A blanket `fill: currentColor` in CSS would have been fewer lines and wrong
 * for `target`: it is two sibling `<circle>` elements, and `fill-rule` applies
 * within a path rather than across siblings, so both would fill solid and the
 * bullseye would become an unrecognisable disc. Filling only the inner circle
 * keeps the ring and reads as "on".
 *
 * Home, Goals and Insights are here — the three tabs that can be active.
 * Insights joined them when it was pointed at /tracker; without a filled
 * twin, `bottomNavHTML` looked up `TAB_ICONS_ACTIVE.insights`, found
 * `undefined` and called it, so the tab bar threw on the one route the tab
 * is lit. Payments and Profile are still disabled and can never be active,
 * so a filled variant for either would be a drawing nothing renders
 * (DESIGN.md rule 6).
 */
export function houseFill(o) {
  return icon('house-fill', '<path class="icon__fill" d="M12 3.6L20.4 12H17.28V20.4H6.72V12H3.6Z"/>', o);
}

export function targetFill(o) {
  return icon(
    'target-fill',
    '<circle cx="12" cy="12" r="9"/><circle class="icon__fill" cx="12" cy="12" r="5"/>',
    o
  );
}

// A single path, so the filled twin is the same geometry carrying
// `icon__fill` — the `houseFill` case, not the `targetFill` one, which had to
// fill only its inner circle to keep the ring.
export function diamondFill(o) {
  return icon('diamond-fill', '<path class="icon__fill" d="M12 3.2L20.8 12L12 20.8L3.2 12Z"/>', o);
}

export const TAB_ICONS = {
  home: house,
  payments: arrowLeftArrowRight,
  goals: target,
  insights: diamond,
  profile: circle,
};

/** The active-tab drawing, keyed the same way. Only the live tabs have one. */
export const TAB_ICONS_ACTIVE = {
  home: houseFill,
  goals: targetFill,
  insights: diamondFill,
};
