/**
 * THE SCREENSHOT HARNESS. Run this; do not regenerate one inline.
 *
 * It exists because the same harness was being rebuilt from scratch each time
 * a change needed looking at, which cost a hand-approved permission prompt per
 * session and shipped at least one duplicate `const` that threw on the first
 * run. A committed script is reviewable, fixable and diffable; a heredoc is
 * none of those.
 *
 * It is a VERIFICATION AID, not a test. It asserts nothing. It renders the app
 * at a given size, in a given theme, at a given point in the session, and
 * writes PNGs plus a contact sheet so a change can be looked at rather than
 * reasoned about.
 *
 * ---------------------------------------------------------------------------
 * USAGE
 * ---------------------------------------------------------------------------
 *   node scripts/shots.mjs
 *   node scripts/shots.mjs --routes=/tracker --entry=goals,insights \
 *                          --state=now,ahead --theme=light,dark
 *
 * Every option takes a comma-separated list and every combination is shot, so
 * the run above produces 2 entries x 2 states x 2 themes = 8 PNGs plus a sheet.
 *
 *   --routes   App routes, without the `#`.            default /tracker
 *              `--routes=all` is THE SCREEN SURVEY: all 30 screens, once each,
 *              in docs/ROUTES.md's order (not router.js's - the two sequence
 *              /learn/stamp-duty and /mip/adviser differently). It is the only
 *              value that changes how files are NAMED: `NN-screen-name.png`,
 *              zero-padded, numbered by the SURVEY table below. Each screen
 *              carries its own entry there, so the two screens no hash reaches
 *              - 03b and frame 20 - are walked rather than skipped, and frames
 *              20 and 21 are two passes with frame 33's outcome pill flipped
 *              between them.
 *   --browser  `chromium` or `webkit`.                 default chromium
 *              WebKit is the engine closest to the iPhone Safari a participant
 *              is on. Both are already downloaded; neither is a new dependency.
 *   --stitch   `off` or `scroll`.                      default off
 *              `scroll` keeps the frame at its BUILT size - so the action bar
 *              pins and the content overflows exactly as in a session - and
 *              captures the whole screen by scrolling `.screen-content` (or a
 *              sheet's `.bottom-sheet__content`), taking one discrete
 *              screenshot per scrollful and compositing them on a canvas.
 *              Deliberately not `fullPage`, which leaves the scaled bezel
 *              unpainted in WebKit. Writes no contact sheet. Mutually
 *              exclusive with `--fit=content` and `--full`.
 *   --fit      `frame` or `content`.                   default frame
 *              `content` raises `--frame-height` on the live page so a `--full`
 *              shot holds the WHOLE screen instead of stopping at the 393x852
 *              frame. Runtime only, no source file touched. It changes what the
 *              action bar draws (see `fitFrameToContent`), so leave it at
 *              `frame` for anything about that bar.
 *   --entry    How the screen is REACHED. `direct` sets the hash; `goals`
 *              taps the tracker card on /goals; `insights` taps the Mortgage
 *              tab. Those three differ in what the app bar draws (D41) and in
 *              whether the entry is a root or a descent (D40), so a screenshot
 *              that only ever loads the hash misses two of the three.
 *
 *              `mip` is a fourth, and a different kind: it walks the real
 *              Mortgage in Principle flow from the tracker and shoots
 *              whichever result 19b resolves to. It is the ONLY way frames 20
 *              and 21 are reachable at all - both are guarded on figures only
 *              a real 19b run commits, so setting their hash lands on /mip
 *              instead. Frame 33's MIP outcome setting chooses which result.
 *                                                       default direct
 *   --state    `now` or `ahead` - the skip-ahead control's position
 *              (DECISIONS.md D38). `ahead` is applied by pressing the real
 *              control, not by seeding it, so what is captured is what the
 *              control actually does. Ignored where the control is not drawn.
 *                                                       default now
 *   --theme    `light` or `dark`.                        default light
 *   --text     `default` or `large` (frame 33's text size).
 *                                                       default default
 *   --width    Viewport width in px.                     default 390
 *   --height   Viewport height in px.                    default 844
 *   --property Property value to seed, in pounds. Re-derives the whole goal
 *              through the model - deposit target, stamp duty, combined goal,
 *              checkpoint, loan and Loan-to-Value - so a shot can be taken at
 *              a price with no stamp duty (under 300,000), with first-time
 *              buyer relief (up to 500,000) or with it lost (above 500,000).
 *              See DECISIONS.md D70.
 *                                                default the seed's own value
 *   --saved    Deposit balance to seed, in pounds. The shared seed sits
 *              exactly AT the checkpoint, where both skip-ahead positions show
 *              the same figure; `--saved=12000` puts the session below it so
 *              `--state=now,ahead` shoots the two apart.
 *                                                default the seed's own value
 *   --goal     `set` or `none`. `none` clears the committed deposit goal, a
 *              state the late-journey seed cannot otherwise reach. Needed to
 *              shoot both sides of any screen that branches on whether a goal
 *              exists - `/goals` has three states off it (D44).
 *                                                       default set
 *   --assign   `<accountId>:<group>`, e.g. `stocks-isa:deposit`. Files one
 *              account into a group before the first paint, the way a
 *              participant filing it on frame 03 or 03b would. It exists
 *              because frame 03's own states are otherwise unshootable: the
 *              seed always opens with the Stocks and shares ISA unsorted, so
 *              every shot of that screen shows the same row in the same state
 *              and the sorted variants cannot be looked at. Groups are the
 *              four in GROUP_ORDER. Repeatable with commas.
 *                                                       default none
 *   --draft    `none` or `property-cleared`. `property-cleared` puts frame 09's
 *              property field in the cleared-but-not-committed state - the
 *              session GAPS.md G62 was reported against. It is a state no seed
 *              reaches, because it is a DRAFT rather than a set of figures:
 *              every committed key stays exactly as it is and only the screen's
 *              own flag moves (DECISIONS.md D46). Use it to shoot the screens
 *              that read `property-value` live while a goal is committed.
 *                                                       default none
 *   --solve    `date` or `amount` - which of frame 10's two variants step 2 of
 *              3 draws. `date` is the slider (pick a monthly range, solve the
 *              date), `amount` is the date stepper (pick a target year, solve
 *              the monthly amount). The shared seed carries `date`, so `amount`
 *              is the only way to shoot 10b - and 10b's year is now a typed
 *              field, so it is the variant a presentation check has to look at.
 *                                                       default date
 *   --monthly  `pair` or `single` - what the session COMMITTED as the monthly
 *              saving. `pair` is the shared seed's two distinct bounds;
 *              `single` writes one figure to `monthly-low`, `monthly-high` and
 *              `savings-rate` alike, which is what frame 10b's Continue commits
 *              (D135). It is a different axis from `--solve`: that one picks
 *              which variant frame 10 DRAWS, this one picks what reached the
 *              store, and D136 keys step 3's single input and frame 12's single
 *              series on the second rather than the first.
 *                                                       default pair
 *   --error    Names an ERROR state the app can draw, seeded so a screenshot
 *              pass can look at it. Every one is a banner beside a disabled
 *              primary action, and every one is otherwise unreachable from a
 *              seed: they exist only after a participant has typed a figure
 *              the screen rejects, and the shared seed is by definition a
 *              coherent session. `review-all` is the three frame 11 rows at
 *              once - the only screen that can raise more than one.
 *
 *                left-over-exceeds     frame 05, left over above money in
 *                left-over-zero        frame 05, left over at or below zero
 *                property-non-numeric  frame 09, a value the model rejects
 *                saving-ceiling        frame 10, the range above left over
 *                saving-goal-met       frame 10b with NO date to offer at all:
 *                                      a 5% deposit puts the goal below what
 *                                      is already saved, so the cap sits
 *                                      behind the floor and the control is
 *                                      replaced by a statement (D85).
 *                saving-moved-to-cap   frame 10b with a date PAST the cap, which
 *                                      the screen moves down to it and
 *                                      discloses (D86). The mirror of
 *                                      saving-date-below-bound.
 *                saving-near-cap       frame 10b at the last date the list
 *                                      offers - the month the balance reaches
 *                                      the goal unaided (D85).
 *                saving-span-wins      frame 10b where the crossing is far out,
 *                                      so YEAR_LIST_SPAN and not the cap is
 *                                      what ends the year list (D87).
 *                saving-narrow-list    frame 10b where floor and cap are close
 *                                      enough that the whole range sits in one
 *                                      year, so both bounds fall on one month
 *                                      list.
 *                saving-date-below-bound  frame 10b, a date the ceiling cannot
 *                                      reach. NOT reachable by pressing the
 *                                      stepper since D82 bounded it - this is
 *                                      the state a participant lands in when
 *                                      the bound MOVES while they are on
 *                                      another screen. No banner is raised;
 *                                      Continue is disabled and their date
 *                                      stands.
 *                saving-past-date      frame 10b, a target date behind today
 *                review-property       frame 11, the property row
 *                review-pct            frame 11, the deposit % row
 *                review-monthly        frame 11, the monthly range row
 *                review-all            frame 11, all three at once
 *
 *              Each seeds the FIGURE the screen rejects, not the error - the
 *              banner is then raised by the screen's own validation, so a shot
 *              cannot show an error the app would not itself have drawn. It
 *              seeds, so it is refused with `--session=opening`.
 *                                                       default none
 *   --date     Frame 10b's target date, as whole months from today, so the two
 *              sides of D82's bound can be shot. `bound` is the earliest date
 *              the goal is reachable at `left-over`, computed through
 *              `monthsToReachAmount` the way the screen computes it rather than
 *              written here - so it follows the seed instead of going stale
 *              against it. `bound+1`, `bound+2` and so on step above it; a bare
 *              integer is months from today. Only meaningful with
 *              `--solve=amount`.
 *                                                       default none
 *   --list     `month` or `year`: opens that date list before the shot, by
 *              pressing the real trigger the way `--open` presses a real
 *              disclosure header. It exists because D84 replaced the native
 *              `<select>` with an in-page listbox - under D83 the open list was
 *              a platform popup outside the page and could not be captured at
 *              all, which is a thing this harness can now do and could not
 *              before. Only meaningful with `--solve=amount`.
 *                                                       default none
 *   --build    A version chip on frame 33 to press before the shot, e.g.
 *              `--build=v5`. Shows the selected chip and the detail area under
 *              it. Which chip is lit is screen-local state that is never
 *              written to the session (D140), so it can only be reached by
 *              pressing the control.
 *                                                       default none
 *   --diag     `open` presses frame 33's "Diagnostics" chip before the shot, so
 *              the readout is in the picture. It is collapsed on every render
 *              and its open state lives only in the DOM, so - like `--build` -
 *              pressing the control is the only way to reach it.
 *              TEMPORARY: comes out with src/diagnostics.js.
 *                                                       default none
 *   --focus    A whole number of Tab presses to make before the shot, so the
 *              keyboard focus ring is in the picture. Real key presses, since
 *              the ring is on `:focus-visible` and a scripted `.focus()` does
 *              not necessarily raise it. Added for DECISIONS.md D92, where the
 *              question was whether the ring survives the frame's scale
 *              transform.
 *                                                       default none
 *   --session  `seeded` or `opening`. `seeded` writes the shared seed into
 *              sessionStorage before the first paint, which is what every
 *              option above is described against. `opening` writes NOTHING and
 *              lets the app open its own session - `router.js` applying
 *              `OPENING_STAGE` through `stagePatch()` (D48), which is the only
 *              way to see the figures a participant actually meets on a first
 *              load. `--saved`, `--goal` and `--draft` all seed, so they are
 *              refused with `opening` rather than silently ignored.
 *                                                    default seeded
 *   --stage    `setting-up`, `saving` or `ready-to-check` - frame 33's Journey
 *              stage (DECISIONS.md D45). Applied by PRESSING the real control
 *              on `#/settings`, the same way `--state=ahead` presses the real
 *              skip-ahead control, so what is captured is what a facilitator
 *              actually gets rather than a seeded approximation of it. Without
 *              it the harness can only reach the stage a session opens in
 *              (`OPENING_STAGE`), which leaves two of the three unreachable -
 *              and `ready-to-check` is the only way to a checkpoint-reached
 *              Mortgage in Principle result at the seed's own property value.
 *                                        default none, i.e. leave the stage alone
 *   --open     A `data-disclosure-id` to open before the shot, e.g.
 *              `--open=goal-breakdown`. Every disclosure starts closed (D12)
 *              and `resetCollapsibles()` re-closes them on every hash-driven
 *              navigation, so a screenshot cannot otherwise show what is
 *              behind one.
 *
 *              PRESSES THE REAL CONTROL, and has to. Seeding the state key
 *              does nothing: router.js calls `resetCollapsibles()` on the way
 *              in and the flag is false again before the screen first reads
 *              it. That is D12 working correctly, not a bug to route around.
 *              Same reason `--state=ahead` and `--stage` press their controls.
 *                                                       default none
 *   --scroll   `top`, `end`, or a CSS selector (anything starting `.` or `#`),
 *              which is centred in the viewport - for an element in the middle
 *              of a long screen that neither end reaches.
 *              Otherwise: where the screen's scroller is left before the
 *              shot. An axis like the others, so `--scroll=top,end` shoots
 *              both. Added for the screens whose bottom edge is the thing
 *              under review: what clears the tab bar at the end of a long
 *              screen, and whether a dock's `--more-below` fade is drawn.
 *                                                       default top
 *   --out      Output directory.                  default .screenshots/shots
 *   --figures  Also dump every currency string each screen actually rendered,
 *              to stdout and to `figures.txt` beside the PNGs. Read from the
 *              live DOM, not from state, so a screen showing a hard-coded or
 *              stale amount is caught rather than confirmed. This is what to
 *              run after changing a seeded or derived figure - pair it with
 *              `--session=opening` to see what a participant meets on a first
 *              load with nothing restored.
 *   --full     Capture the whole scroller rather than the viewport.
 *   --no-sheet Skip the contact sheet.
 *   --scale    Device pixel ratio.                       default 2
 *   --cover    A cover image: the phone alone, centred, on a fully
 *              transparent ground with no drop shadow, whatever the live page
 *              paints behind the frame (DECISIONS.md D154). Widens the viewport to
 *              the framed breakpoint if `--width` is narrower (no phone is
 *              drawn below it), pins the frame to scale 1, and clips to
 *              `.device-bezel`'s rendered box plus `--cover-margin` on every
 *              side. See `prepareCover`. Refused with `--full`, `--fit=content`
 *              and `--stitch=scroll`.
 *   --cover-margin  Ground around the bezel in a `--cover` shot, in CSS px
 *              at frame scale 1.                         default 120
 *
 * ---------------------------------------------------------------------------
 * OUTPUT
 * ---------------------------------------------------------------------------
 * `.screenshots/` is gitignored, so nothing this writes can be committed by
 * accident. Files are named
 *
 *     <route>__<entry>__<state>__<theme>__<width>w[__large][__full].png
 *
 * and `contact-sheet.png` sits beside them: every shot in one grid, labelled,
 * which is the thing worth looking at when a change is meant to be invisible
 * on some variants and not others.
 *
 * The session seeded is the shared one in `scripts/session-seed.mjs`. Change
 * it there, not here.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import { FULL } from './session-seed.mjs';
import { STAGES } from '../src/stage.js';
import { MOCK_ACCOUNTS, GROUP_ORDER } from '../src/model/accounts.js';
import { BUILD_VERSION } from '../src/cache-version.js';
import {
  depositTarget,
  stampDuty,
  combinedGoal,
  checkpointAmount,
  loanAmount,
  ltv,
  monthsToReachAmount,
  monthsToGoalUnaided,
} from '../src/model/model.js';
// Every seed below carries `buildVersion` (DECISIONS.md D59). `state.js` now
// DISCARDS a stored session whose stamp is not the running build's, so an
// unstamped seed would be thrown away and the harness would silently measure
// a default session instead of the one it set up.

const ROOT = path.resolve('.');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------
const DEFAULTS = {
  routes: '/tracker',
  entry: 'direct',
  session: 'seeded',
  // `chromium` (default) or `webkit`. WebKit is the engine closest to the
  // iPhone Safari participants are on, so a survey pass meant to stand in for
  // what a session looks like is worth taking there; chromium stays the
  // default so every existing invocation renders on the engine it always did.
  browser: 'chromium',
  // `frame` (default) leaves the 393x852 frame exactly as shell.css sets it.
  // `content` raises `--frame-height` at runtime to whatever the screen's own
  // scroller needs, so one `--full` image holds the whole screen instead of
  // truncating at the frame. Runtime only - it writes a CSS custom property on
  // the page's `:root`, touches no source file, and the context is thrown away
  // after the shot. See `fitFrameToContent` for what it costs.
  fit: 'frame',
  // `off` (default) takes one screenshot of the viewport. `scroll` scrolls the
  // screen's own scroller and composites the segments into one tall image, so a
  // whole screen is captured WITHOUT growing the frame - the opposite trade to
  // `--fit=content`. See `captureStitched`.
  stitch: 'off',
  // Frame 12's chart/table toggle (DECISIONS.md D100). The table is a view
  // setting, so it is seeded rather than clicked - a click would need the
  // chart to have rendered first, and the point of the shot is the table.
  view: 'chart',
  state: 'now',
  theme: 'light',
  text: 'default',
  width: '390',
  height: '844',
  out: '.screenshots/shots',
  scale: '2',
  saved: '',
  property: '',
  goal: 'set',
  draft: 'none',
  assign: '',
  solve: 'date',
  monthly: 'pair',
  date: '',
  list: '',
  focus: '',
  error: 'none',
  scroll: 'top',
  stage: '',
  open: '',
  build: '',
  // TEMPORARY, with src/diagnostics.js: `open` presses the Diagnostics chip.
  diag: '',
  // Only read with `--cover`. 120 was chosen to clear the drop shadow
  // `.device-bezel` carried until DECISIONS.md D153 removed it; it is now
  // transparent ground around the bezel at frame scale 1 (D154).
  'cover-margin': '120',
};

/**
 * Every currency string each shot rendered, filled when `--figures` is passed
 * and written to `figures.txt` beside the PNGs. Empty otherwise.
 */
const figureDump = [];

function parseArgs(argv) {
  const flags = { ...DEFAULTS, full: false, sheet: true, figures: false, cover: false };
  for (const arg of argv) {
    if (arg === '--full') { flags.full = true; continue; }
    if (arg === '--cover') { flags.cover = true; continue; }
    if (arg === '--no-sheet') { flags.sheet = false; continue; }
    if (arg === '--figures') { flags.figures = true; continue; }
    const m = arg.match(/^--([a-z-]+)=(.*)$/);
    if (!m) {
      console.error(`Unrecognised argument: ${arg}\nRun with no arguments for the defaults, or read the header of this file.`);
      process.exit(1);
    }
    const [, key, value] = m;
    if (!(key in DEFAULTS)) {
      console.error(`Unknown option --${key}. Known: ${Object.keys(DEFAULTS).map((k) => `--${k}`).join(', ')}, --full, --no-sheet, --figures, --cover.`);
      process.exit(1);
    }
    flags[key] = value;
  }
  return flags;
}

const list = (value) => value.split(',').map((s) => s.trim()).filter(Boolean);

/** The month/year a date `n` months from today lands on - for the 10b date states. */
function monthsFromToday(n) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + n, 1);
  return { targetMonth: d.getMonth() + 1, targetYear: d.getFullYear() };
}

/**
 * D82's bound, in whole months from today: the earliest date the seed's goal is
 * reachable at its own `left-over`. Computed through the model exactly as
 * `calculator-saving.js` computes it, so a shot named `--date=bound` is the
 * date the screen will actually treat as the bound rather than a number written
 * here that drifts the moment the seed changes.
 */
/** The seed's goal re-derived at a different deposit percentage. */
function goalAt(pct) {
  const pair = { 'property-value': FULL['property-value'], 'deposit-pct': { value: pct, provenance: 'entered' } };
  const target = depositTarget(pair);
  const goal = combinedGoal(pair);
  return {
    'deposit-pct': pair['deposit-pct'],
    'deposit-target': { value: target.value, provenance: target.provenance },
    'combined-goal': { value: goal.value, provenance: goal.provenance },
  };
}

/**
 * D85's cap in whole months: the month the balance reaches the goal unaided,
 * rounded DOWN the way the screen rounds it. Null where there is none.
 */
function capMonths() {
  const unaided = monthsToGoalUnaided(FULL);
  return unaided.error || !Number.isFinite(unaided.value) ? null : Math.floor(unaided.value);
}

function boundMonths() {
  const months = monthsToReachAmount({
    startingBalance: FULL['saved-toward-deposit'].value,
    targetAmount: combinedGoal(FULL).value,
    monthlyAmount: FULL['left-over'].value,
  });
  return Number.isFinite(months) ? Math.max(0, Math.ceil(months)) : 0;
}

const args = parseArgs(process.argv.slice(2));

// GIT BASH REWRITES A LEADING SLASH INTO A WINDOWS PATH before this script
// ever sees it, so `--routes=/tracker` arrives as `/C:/Program Files/Git/tracker`
// and every shot is silently skipped as an unknown route. Caught here with the
// fix in the message, because the failure is otherwise invisible: the run
// completes, writes nothing, and blames the route.
for (const route of list(args.routes)) {
  if (/^\/?[A-Za-z]:[\\/]/.test(route) || route.includes('Program Files')) {
    console.error(
      `--routes was rewritten by the shell to "${route}".\n` +
      'Git Bash converts a leading slash into a Windows path. Drop the slash\n' +
      '(--routes=tracker), or set MSYS_NO_PATHCONV=1, or run it from PowerShell.',
    );
    process.exit(1);
  }
}

/**
 * `--routes=all`: THE SCREEN SURVEY - every screen in the prototype, once each,
 * in `docs/ROUTES.md`'s order.
 *
 * ROUTES.MD'S ORDER, NOT `router.js`'s. The two hold the same 30 routes and
 * sequence two of them differently (`/learn/stamp-duty` and `/mip/adviser`),
 * and ROUTES.md's is the facilitator-facing one a numbered set of images is
 * read against. `index` is therefore written here rather than derived from
 * position, so inserting a screen is a deliberate renumbering rather than a
 * silent shift of every file after it.
 *
 * `entry` is how that screen is REACHED, and two of them are not reachable by
 * setting a hash:
 *   - `/consent/move-account` (03b) is guarded on `selectedAccountId`, which
 *     only a tap on an account row writes.
 *   - `/mip/result/likely` (20) is guarded on `borrow-high`, which only a real
 *     19b run commits.
 * Both are walked as a participant walks them. Nothing here seeds a key, stubs
 * a guard, or writes to storage.
 *
 * `outcome` presses frame 33's Mortgage in Principle control before the flow
 * starts. It is needed because `mip-running.js` reads TWO things - below the
 * checkpoint the position decides and the pill is ignored (D51); at or above it
 * `resultOutcome` decides - so reaching frame 20 needs the skip-ahead control
 * pressed AND the pill on Likely, and frame 21 is the same walk with the pill
 * flipped. That is the "two passes" this list encodes as two rows.
 */
const SURVEY = [
  { index: 1, name: 'home', route: '/home' },
  { index: 2, name: 'journey', route: '/journey' },
  { index: 3, name: 'consent', route: '/consent' },
  { index: 4, name: 'consent-move-account', route: '/consent/move-account', entry: 'account' },
  { index: 5, name: 'position', route: '/position' },
  { index: 6, name: 'position-summary', route: '/position/summary' },
  { index: 7, name: 'goals', route: '/goals' },
  { index: 8, name: 'goal-check', route: '/goal-check' },
  { index: 9, name: 'calculator-property', route: '/calculator/property' },
  { index: 10, name: 'calculator-saving', route: '/calculator/saving' },
  { index: 11, name: 'calculator-exit', route: '/calculator/exit' },
  { index: 12, name: 'calculator-review', route: '/calculator/review' },
  { index: 13, name: 'calculator-result', route: '/calculator/result' },
  { index: 14, name: 'learn-ltv', route: '/learn/ltv' },
  { index: 15, name: 'learn-ltv-video', route: '/learn/ltv/video' },
  { index: 16, name: 'tracker', route: '/tracker' },
  { index: 17, name: 'mip', route: '/mip' },
  { index: 18, name: 'mip-about', route: '/mip/about' },
  { index: 19, name: 'mip-pre-check', route: '/mip/pre-check' },
  { index: 20, name: 'mip-running', route: '/mip/running' },
  { index: 21, name: 'mip-result-likely', route: '/mip/result/likely', entry: 'mip', state: 'ahead', outcome: 'likely' },
  { index: 22, name: 'mip-result-not-yet', route: '/mip/result/not-yet', entry: 'mip', state: 'ahead', outcome: 'not-yet' },
  { index: 23, name: 'mip-adviser', route: '/mip/adviser' },
  { index: 24, name: 'assumptions-saving', route: '/assumptions/saving' },
  { index: 25, name: 'assumptions-deposit', route: '/assumptions/deposit' },
  { index: 26, name: 'assumptions-borrowing', route: '/assumptions/borrowing' },
  { index: 27, name: 'assumptions-sources', route: '/assumptions/sources' },
  { index: 28, name: 'assumptions-costs', route: '/assumptions/costs' },
  { index: 29, name: 'learn-stamp-duty', route: '/learn/stamp-duty' },
  { index: 30, name: 'settings', route: '/settings' },
];

/**
 * True when `--routes=all` asked for the survey. It is the only thing that
 * changes how a file is NAMED, so every other invocation keeps `shotName`'s
 * variant-describing filename exactly as it was.
 */
const SURVEY_MODE = list(args.routes).length === 1 && list(args.routes)[0] === 'all';
const SURVEY_BY_ROUTE = new Map(SURVEY.map((s) => [s.route, s]));

const ROUTES = SURVEY_MODE
  ? SURVEY.map((s) => s.route)
  : list(args.routes).map((r) => (r.startsWith('/') ? r : `/${r}`));

/**
 * `--saved` moves the session's deposit balance before anything is rendered.
 *
 * IT EXISTS BECAUSE `--state=now,ahead` IS OTHERWISE NEARLY INERT. The shared
 * seed sits exactly AT `checkpoint-amount`, so "Now" and "Further along" put
 * the same figure on screen and the only difference between the two shots is
 * which segment is filled. Passing a balance below the checkpoint - the
 * position the control was built to move a session out of - makes the two
 * states show what they actually do. The default is the seed's own value, so
 * this changes nothing unless it is asked for.
 */
const SAVED = args.saved === '' ? null : Number(args.saved);

/**
 * `--property` re-derives the whole deposit goal from a property value, so a
 * shot can be taken at a price the shared seed does not cover (DECISIONS.md
 * D70). Added because the stamp duty in the goal is a FUNCTION of the property
 * value and has three regions worth looking at - below the 300,000 nil-rate
 * band where there is no tax at all, between there and 500,000 where
 * first-time buyer relief applies, and above 500,000 where it is lost - and
 * `--saved` moves the position within a goal rather than the goal itself.
 *
 * EVERY DEPENDENT FIGURE IS RE-DERIVED THROUGH THE MODEL, not typed here, so a
 * shot cannot show a goal the model would not have produced. That is the whole
 * point: a fixture that disagreed with `combinedGoal()` would make a screenshot
 * evidence of nothing.
 */
const PROPERTY = args.property === '' ? null : Number(args.property);
if (args.property !== '' && !Number.isFinite(PROPERTY)) {
  console.error('--property must be a number, e.g. --property=500001.');
  process.exit(1);
}
if (SAVED !== null && !Number.isFinite(SAVED)) {
  console.error('--saved must be a number, e.g. --saved=12000.');
  process.exit(1);
}

/**
 * `--goal=none` clears the committed deposit goal, which is a state the seed
 * cannot otherwise reach: `session-seed.mjs` is a late-journey session by
 * definition, so every route that branches on "has this participant set a
 * goal yet" would only ever be shot on one side of the branch. `/goals` has
 * three states off that question (DECISIONS.md D44) and two of them need this.
 *
 * It clears the same four keys frame 09's empty variant leaves null, so the
 * result is a session that has walked in but not committed, rather than an
 * incoherent one with a target and no property value.
 */
const GOAL_STATES = ['set', 'none'];
if (!GOAL_STATES.includes(args.goal)) {
  console.error(`Unknown --goal "${args.goal}". One of: ${GOAL_STATES.join(', ')}.`);
  process.exit(1);
}
const NO_GOAL_KEYS = ['property-value', 'deposit-pct', 'deposit-target', 'checkpoint-amount'];

/**
 * `--assign=stocks-isa:deposit` files an account before the first paint.
 *
 * Validated against the real account ids and the real GROUP_ORDER rather than
 * a list typed here, so a renamed account or a new group fails loudly at the
 * argument instead of silently seeding an assignment no screen reads.
 *
 * It writes `accountSelectionEdited` alongside, because a filing the
 * participant did is exactly what that flag records - leaving it false would
 * seed a session claiming 'read' provenance for figures a participant moved
 * (DECISIONS.md D5), which is the state the app itself never produces.
 */
const ASSIGN = {};
if (args.assign !== '') {
  for (const pair of list(args.assign)) {
    const [id, group] = pair.split(':');
    if (!MOCK_ACCOUNTS.some((a) => a.id === id)) {
      console.error(`--assign: no account "${id}". Known: ${MOCK_ACCOUNTS.map((a) => a.id).join(', ')}.`);
      process.exit(1);
    }
    if (!GROUP_ORDER.includes(group)) {
      console.error(`--assign: no group "${group}". One of: ${GROUP_ORDER.join(', ')}.`);
      process.exit(1);
    }
    ASSIGN[id] = group;
  }
}

/**
 * `--draft=property-cleared` is deliberately NOT a figure change, and that is
 * the point of having it. `--goal=none` clears four keys; this clears none. It
 * sets frame 09's own draft flag and leaves every committed figure standing,
 * which is exactly the state G62 was reported against and exactly what D46
 * fixed: the participant is re-typing a property value they have already
 * committed, and no screen behind them may notice.
 *
 * Shooting it is how the fix is checked by eye rather than by assertion - the
 * screens that read `property-value` live (11, 12, 13, 15/16) must look
 * identical to their ordinary state.
 */
const DRAFT_STATES = ['none', 'property-cleared'];
if (!DRAFT_STATES.includes(args.draft)) {
  console.error(`Unknown --draft "${args.draft}". One of: ${DRAFT_STATES.join(', ')}.`);
  process.exit(1);
}
/**
 * WHICH VARIANT OF STEP 2 OF 3, and why it is an override here rather than a
 * change to the shared seed. `solveFor` selects one of frame 10's two variants
 * and nothing else reads it, so it is exactly the kind of key CLAUDE.md's seed
 * rule keeps out of `session-seed.mjs`: one script's variant selector belongs
 * in that script's own overrides. `overlap.test.mjs` and `action-bar.test.mjs`
 * already pass it in their own row lists for the same reason.
 */
const DATE_LISTS = ['', 'month', 'year'];
if (!DATE_LISTS.includes(args.list)) {
  console.error(`Unknown --list "${args.list}". One of: ${DATE_LISTS.filter(Boolean).join(', ')}.`);
  process.exit(1);
}

if (args.focus !== '' && !/^[1-9][0-9]*$/.test(args.focus)) {
  console.error(`--focus takes a whole number of Tab presses, not "${args.focus}".`);
  process.exit(1);
}

const MONTHLY_SHAPES = ['pair', 'single'];
if (!MONTHLY_SHAPES.includes(args.monthly)) {
  console.error(`Unknown --monthly "${args.monthly}". One of: ${MONTHLY_SHAPES.join(', ')}.`);
  process.exit(1);
}

const SOLVE_FOR = ['date', 'amount'];
if (!SOLVE_FOR.includes(args.solve)) {
  console.error(`Unknown --solve "${args.solve}". One of: ${SOLVE_FOR.join(', ')}.`);
  process.exit(1);
}

/** `--date`: a bare month count, or `bound` / `bound+N` resolved through the model. */
let DATE_MONTHS = null;
if (args.date !== '') {
  const m = args.date.match(/^bound(?:\+(\d+))?$/);
  DATE_MONTHS = m ? boundMonths() + Number(m[1] ?? 0) : Number(args.date);
  if (!Number.isFinite(DATE_MONTHS)) {
    console.error(`--date must be a whole number of months from today, or "bound", or "bound+N". Got "${args.date}".`);
    process.exit(1);
  }
}

/**
 * THE SEVEN ERROR STATES, SEEDED AS FIGURES RATHER THAN AS ERRORS (D78).
 *
 * Each entry writes the out-of-range FIGURE a participant would have typed and
 * stops there. No entry writes a banner, a flag or an error string: the screen
 * runs its own validation over what it finds and raises the banner itself, so
 * a shot taken this way is a shot of the app's behaviour and not of a fixture
 * dressed up as one. That matters more here than usual, because the whole
 * point of the pass these were added for is to look at what the error state
 * draws.
 *
 * Every value is measured against the shared seed's own figures - `money-in`
 * 2600 and `left-over` 1150 - rather than being a constant chosen here, so a
 * change to `session-seed.mjs` cannot leave one of these quietly in range.
 * `deposit-pct` is put outside DEPOSIT_PCT_OPTIONS' ends the same way.
 *
 * `saving-past-date` is the one that is not a figure: frame 10b's error is
 * raised from a calendar comparison, so the seed is the year itself.
 */
const ERROR_STATES = {
  none: () => ({}),
  'left-over-exceeds': () => ({
    // frame 05 re-runs `leftOver()` over an 'entered' override, which fails
    // when it is above money in. Value kept, not nulled - that is the model's
    // own behaviour, so the field can still show what was typed.
    'left-over': { value: FULL['money-in'].value + 1000, provenance: 'entered' },
  }),
  'left-over-zero': () => ({
    // The model's second rejection on the same figure: `leftOver()` fails
    // 'not-positive' at or below zero, and keeps the value so the field can
    // still show what was typed.
    'left-over': { value: 0, provenance: 'entered' },
  }),
  'property-non-numeric': () => ({
    // `depositTarget()` rejects a non-positive property value.
    'property-value': { value: 0, provenance: 'entered' },
  }),
  'saving-ceiling': () => ({
    'monthly-low': { value: FULL['left-over'].value + 100, provenance: 'entered' },
    'monthly-high': { value: FULL['left-over'].value + 400, provenance: 'entered' },
  }),
  'saving-goal-met': () => ({
    // A 5% deposit on the seed's own property: a 14,000 goal against 21,000
    // already saved. Derived through the model rather than written here, so it
    // follows the seed.
    ...goalAt(0.05),
  }),
  'saving-moved-to-cap': () => ({
    // Forty months past the cap, computed from the model so it is past it
    // whatever the seed holds.
    ...monthsFromToday((capMonths() ?? 0) + 40),
  }),
  'saving-near-cap': () => ({
    ...monthsFromToday(capMonths() ?? 0),
  }),
  'saving-span-wins': () => ({
    // Barely anything saved, so the balance takes ninety years to reach the
    // goal unaided and the twenty-year span is the tighter of the two bounds.
    'saved-toward-deposit': { value: 1000, provenance: 'read' },
  }),
  'saving-narrow-list': () => ({
    // Saved high enough that the whole range collapses into one year, which is
    // where the month list is bounded at BOTH ends.
    'saved-toward-deposit': { value: 27000, provenance: 'read' },
  }),
  'saving-date-below-bound': () => ({
    // ONE MONTH UNDER THE FLOOR, computed from the model rather than picked, so
    // it is under it by exactly one month whatever the seed holds. It does not
    // shoot an error: since D83 the screen MOVES the date to the floor and
    // discloses the move (`dateMovedToEarliest`), so this is the shot of that
    // disclosure. Kept under `--error` rather than moved to `--date` because
    // `--date` seeds a date the control could produce and this one seeds a date
    // it could not.
    ...monthsFromToday(Math.max(0, boundMonths() - 1)),
  }),
  'saving-past-date': () => ({
    targetMonth: 1,
    targetYear: new Date().getFullYear() - 1,
  }),
  'review-property': () => ({ 'property-value': { value: 0, provenance: 'entered' } }),
  'review-pct': () => ({ 'deposit-pct': { value: 0.99, provenance: 'entered' } }),
  'review-monthly': () => ({
    'monthly-low': { value: FULL['left-over'].value + 100, provenance: 'entered' },
    'monthly-high': { value: FULL['left-over'].value + 400, provenance: 'entered' },
  }),
  'review-all': () => ({
    'property-value': { value: 0, provenance: 'entered' },
    'deposit-pct': { value: 0.99, provenance: 'entered' },
    'monthly-low': { value: FULL['left-over'].value + 100, provenance: 'entered' },
    'monthly-high': { value: FULL['left-over'].value + 400, provenance: 'entered' },
  }),
};
if (!(args.error in ERROR_STATES)) {
  console.error(`Unknown --error "${args.error}". One of: ${Object.keys(ERROR_STATES).join(', ')}.`);
  process.exit(1);
}
const ENTRIES = list(args.entry);
const STATES = list(args.state);
const THEMES = list(args.theme);
const TEXTS = list(args.text);
const SCROLLS = list(args.scroll);
const WIDTH = Number(args.width);
const HEIGHT = Number(args.height);
const SCALE = Number(args.scale);
const OUT = path.resolve(args.out);

const ENTRY_KINDS = ['direct', 'goals', 'insights', 'mip'];
for (const entry of ENTRIES) {
  if (!ENTRY_KINDS.includes(entry)) {
    console.error(`Unknown --entry "${entry}". One of: ${ENTRY_KINDS.join(', ')}.`);
    process.exit(1);
  }
}
for (const state of STATES) {
  if (state !== 'now' && state !== 'ahead') {
    console.error(`Unknown --state "${state}". One of: now, ahead.`);
    process.exit(1);
  }
}
for (const scroll of SCROLLS) {
  if (scroll !== 'top' && scroll !== 'end' && !scroll.startsWith('.') && !scroll.startsWith('#')) {
    console.error(`Unknown --scroll "${scroll}". One of: top, end, or a CSS selector starting . or #.`);
    process.exit(1);
  }
}
if (!Number.isFinite(WIDTH) || !Number.isFinite(HEIGHT) || !Number.isFinite(SCALE)) {
  console.error('--width, --height and --scale must be numbers.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// The same static server the tests use: ES modules need a real origin.
// ---------------------------------------------------------------------------
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.join(ROOT, p === '/' ? 'index.html' : p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve([server, `http://127.0.0.1:${server.address().port}`]));
  });
}

/**
 * Walks the app to `route` the way `entry` says to.
 *
 * `goals` and `insights` are real taps rather than hash writes, because that
 * is the only way the router records the entry as a descent or as a tab root
 * (D40) - and that is what decides whether the app bar draws a back chevron
 * (D41). Seeding the hash directly would give a third result that no
 * participant ever sees.
 */
async function navigate(page, base, route, entry, state, outcome = null) {
  // FRAME 33'S OUTCOME PILL, PRESSED. `resultOutcome` is a frame 33 toggle with
  // a real on-screen control, so the survey flips it the way a facilitator does
  // rather than writing the key - the same rule `--stage`, `--open` and
  // `--build` already follow. It has to happen BEFORE the flow starts, because
  // `mip-running.js` reads the value at the moment 19b resolves.
  if (outcome) {
    await page.goto(`${base}/#/settings`);
    await page.waitForTimeout(300);
    const pill = await page.$(`[data-action="set-outcome"][data-value="${outcome}"]`);
    if (!pill) throw new Error(`frame 33 has no Mortgage in Principle outcome pill for '${outcome}'`);
    await pill.click();
    await page.waitForTimeout(250);
  }

  // FRAME 03b, REACHED BY TAPPING AN ACCOUNT. The sheet is guarded on
  // `selectedAccountId`, which nothing but a tap on a row writes - deep-linking
  // it lands back on `/consent` (verified in WebKit on an empty session). The
  // first enabled row is used; which account it is does not change the screen's
  // layout, only the name in its heading.
  if (entry === 'account') {
    await page.goto(`${base}/#/consent`);
    await page.waitForTimeout(300);
    const row = await page.$('[data-action="open-account"]:not([disabled])');
    if (!row) throw new Error('no enabled account row on /consent to open frame 03b with');
    await row.click();
    await page.waitForTimeout(400);
    return;
  }

  // THE ONLY HONEST WAY TO REACH FRAMES 20 AND 21. Both results are guarded on
  // figures that ONLY a real `/mip/running` pass commits (`ROUTES.md`: frame 20
  // "still redirects - it needs `borrow-high`, which only a real 19b run
  // commits"), so setting the hash lands on `/mip` instead. This walks the four
  // taps a participant takes and lets 19b self-resolve, which is also what
  // makes the result read against whatever goal the session actually holds
  // rather than against a seeded one.
  if (entry === 'mip') {
    await page.goto(`${base}/#/tracker`);
    await page.waitForTimeout(300);
    // WHICH RESULT IS DECIDED BEFORE THE FLOW STARTS, NOT AFTER IT. Under D51
    // the check is offered at any savings position and the CHECKPOINT decides
    // the outcome, so a session below it resolves to frame 21 whatever happens
    // downstream. `--state=ahead` therefore has to be applied here, on the
    // tracker, rather than by the post-navigate step every other entry uses -
    // by the time the flow lands on a result there is no control left to press.
    if (state === 'ahead') {
      const control = await page.$('[data-action="set-skip-ahead"][data-value="ahead"]');
      if (control) {
        await control.click();
        await page.waitForTimeout(350);
      }
    }
    await page.click('[data-action="check-mip"]');
    await page.waitForTimeout(300);
    await page.click('[data-action="start-check"]');   // frame 17
    await page.waitForTimeout(300);
    await page.click('[data-action="start-check"]');   // frame 19
    // 19b self-resolves in ~3s. Waited on the hash rather than on a fixed
    // sleep, so a change to that timing does not silently shoot the spinner.
    await page.waitForFunction(
      () => window.location.hash.startsWith('#/mip/result/'),
      null,
      { timeout: 15000 },
    );
    await page.waitForTimeout(350);
    return;
  }
  if (entry === 'direct' || route !== '/tracker') {
    await page.goto(`${base}/#${route}`);
    await page.waitForTimeout(300);
    return;
  }
  if (entry === 'goals') {
    await page.goto(`${base}/#/goals`);
    await page.waitForTimeout(300);
    await page.click('[data-action="open-deposit-tracker"]');
  } else {
    await page.goto(`${base}/#/home`);
    await page.waitForTimeout(300);
    await page.click('.bottom-nav__tab[data-tab="insights"]');
  }
  await page.waitForTimeout(350);
}

/**
 * Open a disclosure by PRESSING its header, after the screen has settled.
 * Seeding its state key does nothing - `resetCollapsibles()` runs on every
 * hash-driven navigation (D12) and the flag is false again before the screen
 * reads it - so this presses the control the participant would press, the
 * same way `--state=ahead` and `--stage` do.
 */
async function openDisclosure(page) {
  if (args.open === '') return;
  const sel = `[data-action="toggle-disclosure"][data-disclosure-id="${args.open}"]`;
  const btn = await page.$(sel);
  if (!btn) {
    console.warn(`  note: --open=${args.open} found no disclosure on this screen; shot taken closed.`);
    return;
  }
  await btn.click();
  await page.waitForTimeout(250);
}

/**
 * Open one of frame 10b's date lists by PRESSING its trigger, for the same
 * reason `openDisclosure` presses a real header: the list's placement is
 * decided at open time from the space measured then (D84), so a shot of a list
 * forced open any other way would be a shot of a state the app never produces.
 */
async function openDateList(page) {
  if (args.list === '') return;
  const trigger = await page.$(`[data-list="${args.list}"]`);
  if (!trigger) {
    console.warn(`  note: --list=${args.list} found no date list on this screen; shot taken closed.`);
    return;
  }
  await trigger.click();
  await page.waitForTimeout(250);
}

/**
 * `--build`: presses one of frame 33's build chips, so the selected state and
 * the detail area under it can be looked at.
 *
 * PRESSES THE CHIP, like `--open` and `--list` above, rather than seeding
 * anything. It cannot be seeded even in principle: which chip is lit is
 * screen-local draft state held in a closure and deliberately never written to
 * `sessionStorage` (D140), so pressing the control is the only way the state
 * exists at all.
 */
async function selectBuild(page) {
  if (args.build === '') return;
  const chip = await page.$(`[data-action="select-version"][data-value="${args.build}"]`);
  if (!chip) {
    console.warn(`  note: --build=${args.build} found no such chip on this screen; shot taken at rest.`);
    return;
  }
  await chip.click();
  await page.waitForTimeout(250);
}

/**
 * `--diag=open`: presses frame 33's Diagnostics chip so the readout is shown.
 *
 * TEMPORARY, AND IT LEAVES WITH THE DIAGNOSTIC. Same shape as `selectBuild`
 * above and for the same reason: the chip's open state is held in the DOM and
 * reset on every render, so it cannot be seeded - the control has to be
 * pressed. Warns rather than throwing on a route that has no such chip, so a
 * multi-route run is not aborted by one screen that cannot show it.
 */
async function openDiagnostics(page) {
  if (args.diag !== 'open') return;
  const chip = await page.$('.diag-block__toggle');
  if (!chip) {
    console.warn('  note: --diag=open found no Diagnostics chip on this screen; shot taken at rest.');
    return;
  }
  await chip.click();
  await page.waitForTimeout(250);
}

/**
 * `--focus`: presses Tab n times so the shot carries a visible focus ring.
 *
 * REAL TAB PRESSES, NOT `.focus()`. shell.css draws the ring on
 * `:focus-visible` only, which a scripted focus does not necessarily satisfy -
 * a shot taken after `el.focus()` can show no ring at all and would be
 * evidence of nothing. Added for D92: the frame is drawn through a scale
 * transform, and a focus ring is the one piece of chrome the browser draws
 * rather than the stylesheet, so whether it survives the transform is a thing
 * to be looked at rather than assumed.
 */
async function tabTo(page) {
  if (args.focus === '') return;
  for (let i = 0; i < Number(args.focus); i += 1) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(150);
}

/**
 * `--fit=content`: grows the device frame so one image holds the whole screen.
 *
 * WHY IT IS NEEDED. The frame is a FIXED 393x852 logical box (D92) and
 * `.screen-content` scrolls inside it. A `--full` shot at a desktop width is
 * therefore full-page in the PAGE's sense and still truncated in the SCREEN's -
 * it captures the whole document, and the document contains a phone showing
 * one scrollful. Raising `--frame-height` is what makes the two mean the same
 * thing.
 *
 * GROWN BY THE OVERFLOW, NOT SET TO A CONTENT HEIGHT. The frame also holds
 * chrome that does not scroll - a step header, a pinned action bar, the tab bar
 * - so `scrollHeight - clientHeight` is exactly the part that does not fit
 * without this needing to know which of those a given screen draws. Twice,
 * because growing the frame reflows the screen and can release a little more.
 *
 * `--frame-scale` IS PINNED TO 1 FIRST. shell-scale.js sizes the frame to the
 * WINDOW, so a frame grown past the window would be scaled straight back down
 * to fit and the shot would be the same truncation at a smaller size.
 *
 * WHAT IT COSTS, AND IT IS NOT NOTHING: a screen whose content no longer
 * overflows draws its action bar in the visible/fits state rather than the
 * hidden-with-scroll-affordance state (D17), and the `--more-below` fade is
 * gone. A fitted shot is the right picture of a SCREEN and the wrong picture of
 * that bar. `--fit=frame` (the default) is what to use for anything about the
 * action bar's own behaviour.
 *
 * Runtime only: two custom properties on the live page's `:root`, in a context
 * that is closed after the shot. No source file is touched.
 */
async function fitFrameToContent(page) {
  if (args.fit !== 'content') return null;

  const height = await page.evaluate(async () => {
    const root = document.documentElement;
    const px = (n) => Number.parseFloat(getComputedStyle(root).getPropertyValue(n)) || 0;
    const CAP = 12000; // a runaway screen should give a big PNG, not a hung run
    const frame = () => document.querySelector('.bottom-sheet__content, .screen-content');

    root.style.setProperty('--frame-scale', '1');

    let height = px('--frame-height');
    for (let pass = 0; pass < 2; pass += 1) {
      const s = frame();
      if (!s) break;
      const overflow = s.scrollHeight - s.clientHeight;
      if (overflow <= 1) break;
      height = Math.min(CAP, height + overflow);
      root.style.setProperty('--frame-height', `${height}px`);
      // Two frames: one for the custom property, one for the reflow it causes.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    return height;
  });

  // THE VIEWPORT IS THEN GIVEN ROOM, AND THIS IS NOT OPTIONAL.
  //
  // A grown frame that sits below the fold is captured BLANK. `fullPage`
  // stitches by scrolling, and `.device-bezel` is a `transform: scale()` layer
  // (shell.css) - WebKit does not repaint a transformed layer for that stitch,
  // so the first run of this produced a 2880x6028 PNG with a correct phone in
  // the top 1800px and pure white under it. Verified, not guessed.
  //
  // Growing the viewport HEIGHT is layout-neutral here, which is why it is safe
  // to do rather than a compromise: the frame is a fixed logical box, the
  // width (unchanged) is what picks the >=768px framed branch, and the only
  // thing height fed was shell-scale.js's scale, which is pinned to 1 above.
  // MEASURED OFF `#app-frame`, NOT off `documentElement.scrollHeight`. `html`
  // is `overflow: hidden` (shell.css), which clamps that figure to the viewport
  // - it returned exactly 900 on a 900-tall window holding a 2900-tall frame,
  // so the resize below was a no-op and the shot came back blank a second time
  // in exactly the same 190KB. The frame's own layout box plus the body gutter
  // above and below it is the height the page actually needs.
  const docHeight = await page.evaluate(() => {
    const frame = document.getElementById('app-frame');
    if (!frame) return document.documentElement.scrollHeight;
    const body = getComputedStyle(document.body);
    const pad = Number.parseFloat(body.paddingTop) + Number.parseFloat(body.paddingBottom);
    return Math.ceil(frame.getBoundingClientRect().height + (Number.isFinite(pad) ? pad : 0));
  });
  await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(docHeight, HEIGHT), 30000) });

  // shell-scale.js debounces `resize` by SETTLE_MS (100ms) and then writes its
  // own `--frame-scale`, so the two properties are re-pinned AFTER that lands
  // rather than before it overwrites them.
  await page.waitForTimeout(250);
  await page.evaluate((h) => {
    const root = document.documentElement;
    root.style.setProperty('--frame-scale', '1');
    root.style.setProperty('--frame-height', `${h}px`);
  }, height);
  await page.waitForTimeout(200);

  return height;
}

/**
 * `--cover`: THE PHONE ALONE, ON A TRANSPARENT GROUND. Returns the clip box.
 * DECISIONS.md D154.
 *
 * THE GROUND IS ALPHA 0, AND IT IS NOT THE LIVE PAGE'S. A cover is placed on
 * whatever background the document it goes into has, so it must not carry the
 * prototype's own. `html` and `body` both paint (`--color-bg`, and
 * `--color-canvas` at framed widths), so their backgrounds are cleared here and
 * the caller passes `omitBackground: true` to drop the browser's default white
 * as well - neither alone is enough. The bezel's `box-shadow` is turned off in
 * the same stylesheet: D153 removed it from shell.css, but a shadow on a
 * transparent ground bakes semi-transparent black into the margins, and the
 * cover should not depend on it staying removed. The result owes nothing to
 * what `--color-canvas` is set to. The phone's rounded outer corners come out
 * with soft-edged alpha, which is intended: it lets the cover anti-alias onto
 * any background. The bezel and the screen stay fully opaque.
 *
 * SO THE SCALE AND GUTTER ARE PINNED, as `fitFrameToContent` pins the scale:
 * `--frame-scale` to 1, which makes `--cover-margin` a length in the same
 * logical px the bezel is declared in, and `--frame-gutter` to the margin, so
 * the ground above the bezel exists in the page rather than being clipped into
 * the body padding. Layout inside the frame is identical at every scale (D92),
 * so this changes the magnification of the screen and nothing about it.
 *
 * THE CLIP IS THE BEZEL'S RENDERED BOX, measured with `getBoundingClientRect()`
 * - in viewport CSS px, the same space `page.screenshot({ clip })` takes - and
 * never its declared 421x880. That box includes any transform, so the clip
 * stays on the bezel even if the pin is ever removed.
 *
 * Runtime only: two custom properties on `:root` and one injected stylesheet,
 * on the live page, in a context that is closed after the shot. These are
 * capture-time overrides by the harness. No source file is touched.
 */
async function prepareCover(page) {
  await page.addStyleTag({
    content: `
      html, body { background: transparent !important; }
      .device-bezel { box-shadow: none !important; }
    `,
  });
  const pin = () => page.evaluate((margin) => {
    const root = document.documentElement;
    root.style.setProperty('--frame-scale', '1');
    root.style.setProperty('--frame-gutter', `${margin}px`);
  }, COVER_MARGIN);
  const measure = () => page.evaluate(() => {
    const bezel = document.querySelector('.device-bezel');
    if (!bezel) return null;
    const r = bezel.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
  });

  await pin();
  await page.waitForTimeout(200);
  let box = await measure();
  if (!box) throw new Error('--cover found no .device-bezel on the page');

  // The clip has to lie inside the viewport - there is no page scroll to reach
  // past it - so the window is grown to hold the bezel plus the margin on
  // every side. shell-scale.js debounces `resize` by SETTLE_MS (100ms) and
  // then rewrites both properties, so they are re-pinned after it lands.
  //
  // SIZED FROM THE BEZEL, NOT FROM WHERE IT SITS BEFORE THE RESIZE. The bezel
  // is centred, so growing the window moves its left edge too; a width taken
  // from the pre-resize `right + margin` left less than the margin on the left
  // for any margin above ~174px, and the clip started off the page. Width is
  // `bezel + 2 x margin` and height is the same, since the gutter puts exactly
  // the margin above it.
  //
  // AND ONE PX WIDER WHEN THE BEZEL WOULD BE CENTRED ON A HALF PIXEL.
  // `getBoundingClientRect()` reports the half (173.5 at 768), but Chromium
  // paints the 421px bezel at a whole CSS px, so the clip came out 241 device
  // px left of the bezel and 239 right at scale 2. Measured, not guessed. The
  // parity is decided from the width the window is about to be, not from the
  // position measured before it.
  const viewport = page.viewportSize();
  let needW = Math.max(viewport.width, Math.ceil(box.width + COVER_MARGIN * 2));
  if (!Number.isInteger((needW - box.width) / 2)) needW += 1;
  const needH = Math.max(viewport.height, Math.ceil(box.height + COVER_MARGIN * 2));
  if (needW !== viewport.width || needH !== viewport.height) {
    await page.setViewportSize({ width: needW, height: needH });
    await page.waitForTimeout(250);
    await pin();
    await page.waitForTimeout(200);
    box = await measure();
  }

  const clip = {
    x: box.left - COVER_MARGIN,
    y: box.top - COVER_MARGIN,
    width: box.width + COVER_MARGIN * 2,
    height: box.height + COVER_MARGIN * 2,
  };
  const size = page.viewportSize();
  if (clip.x < 0 || clip.y < 0 || clip.x + clip.width > size.width || clip.y + clip.height > size.height) {
    throw new Error(`--cover clip ${JSON.stringify(clip)} does not fit the ${size.width}x${size.height} viewport`);
  }
  return clip;
}

/**
 * `--stitch=scroll`: THE WHOLE SCREEN, AT THE FRAME'S REAL SIZE.
 *
 * `--fit=content` grows the frame so one shot holds everything, which changes
 * what the action bar draws (D17: content that no longer overflows gets the
 * inline bar, not the pinned one). This is the other trade: the frame stays at
 * its built size, the app overflows and pins exactly as it does in a session,
 * and the SCROLLER is moved instead - one screenshot per scrollful, composited
 * here. Nothing about the page's layout is touched.
 *
 * NOT `fullPage`. Playwright's own stitch does not repaint the `transform:
 * scale()` bezel layer in WebKit - it produced a correct phone in the top
 * segment and pure white below it. Every segment here is a discrete
 * `page.screenshot()` of a settled viewport, composited on a canvas.
 *
 * ---------------------------------------------------------------------------
 * WHAT REPEATS, AND WHY IT IS NOT WHAT IT LOOKS LIKE
 * ---------------------------------------------------------------------------
 * `.action-bar-dock` reappears at the bottom of every segment. It is NOT
 * `position: sticky` - audited across all 30 routes, NOTHING in this app is
 * sticky or fixed. It is a flex SIBLING of the scroller with a negative top
 * margin (components.css, "in pinned mode it overlaps the end of the content"),
 * so it paints over the scroller's last 81px or 137px on every screen that
 * pins it. Same symptom, different cause, and a sticky-only audit misses it.
 *
 * It is suppressed with `visibility: hidden` for the content segments, which
 * reveals the content beneath it and reflows NOTHING - `display: none` would
 * have changed the layout this pass is meant to preserve. It is then taken
 * ONCE, from a final extra shot at the end of the scroll with the dock
 * restored, and composited at `maxScroll + dockTop` - the exact place it sits
 * when a participant reaches the bottom. What it covers there is the
 * scroller's own bottom padding, not content: `action-bar.test.mjs` already
 * asserts the bar is clear of the last content element at the end of scroll.
 *
 * `.sheet-scrim` also intersects the scroller's box on the 8 sheet routes and
 * is deliberately NOT suppressed: it is the dim backdrop BEHIND the sheet, so
 * it never paints over the content being captured. Checked, not assumed.
 */
async function captureStitched(page, file) {
  const geom = await page.evaluate(() => {
    const s = document.querySelector('.bottom-sheet__content, .screen-content');
    if (!s) return null;
    const r = s.getBoundingClientRect();
    // The tail is everything from the top of the pinned dock down: the dock
    // itself plus the tab bar under it. Where a screen draws no dock (frames
    // 08, 12, 21 and /settings - D50/D52/D53), it starts at the scroller's
    // own bottom edge and is just the tab bar, which the same maths covers.
    const dock = document.querySelector('.action-bar-dock');
    let tailTop = Math.round(r.bottom);
    if (dock) {
      const dr = dock.getBoundingClientRect();
      if (dr.height > 0 && dr.top < r.bottom) tailTop = Math.round(dr.top);
    }
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      scrollHeight: Math.round(s.scrollHeight),
      clientHeight: Math.round(s.clientHeight),
      viewportH: window.innerHeight,
      viewportW: window.innerWidth,
      tailTop,
      hasDock: !!dock && tailTop < Math.round(r.bottom),
    };
  });

  if (!geom) {
    await page.screenshot({ path: file });
    return { segments: 1, stitched: false, reason: 'no scroll container on this screen' };
  }

  const maxScroll = Math.max(0, geom.scrollHeight - geom.clientHeight);
  const positions = [];
  for (let y = 0; y < maxScroll; y += geom.clientHeight) positions.push(y);
  positions.push(maxScroll); // always ends exactly at the bottom

  const setDock = (visible) => page.evaluate((v) => {
    const dock = document.querySelector('.action-bar-dock');
    if (dock) dock.style.visibility = v ? '' : 'hidden';
  }, visible);

  const shotAt = async (y) => {
    await page.evaluate((top) => {
      const s = document.querySelector('.bottom-sheet__content, .screen-content');
      if (s) s.scrollTop = top;
    }, y);
    // Long enough for action-bar.js to re-measure and for any scroll-linked
    // class to settle before the pixel is taken.
    await page.waitForTimeout(220);
    return (await page.screenshot()).toString('base64');
  };

  const segments = [];
  for (const y of positions) {
    await setDock(false); // re-applied per segment: the bar is re-mounted on mutation
    segments.push(await shotAt(y));
  }
  await setDock(true);
  const tail = await shotAt(maxScroll);

  // Composited in a throwaway page rather than in the app's own: drawing a
  // canvas into the page under capture would mutate the thing being measured.
  const context = await browser.newContext({ viewport: { width: 600, height: 600 }, serviceWorkers: 'block' });
  const blank = await context.newPage();
  const dataUrl = await blank.evaluate(async (input) => {
    const { segs, tailB64, g, positions: pos, dsf, maxScroll: ms } = input;
    const load = (b64) => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('segment failed to decode'));
      img.src = `data:image/png;base64,${b64}`;
    });
    const imgs = await Promise.all(segs.map(load));
    const tailImg = await load(tailB64);

    const totalH = g.top + g.scrollHeight + (g.viewportH - g.bottom);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(g.viewportW * dsf);
    canvas.height = Math.round(totalH * dsf);
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const put = (img, sy, sh, dy) => {
      if (sh <= 0) return;
      ctx.drawImage(img, 0, Math.round(sy * dsf), W, Math.round(sh * dsf), 0, Math.round(dy * dsf), W, Math.round(sh * dsf));
    };

    // 1. The chrome above the scroller (app bar / step header), from the first
    //    segment only - it does not move.
    put(imgs[0], 0, g.top, 0);

    // 2. The content, strip by strip. Each segment contributes only the rows
    //    the previous one did not already cover, which is what makes the
    //    clamped final position (it overlaps its predecessor) join seamlessly
    //    instead of duplicating a band.
    let contentY = 0;
    for (let i = 0; i < pos.length; i += 1) {
      const s = pos[i];
      const availableEnd = s + g.clientHeight;
      if (availableEnd <= contentY) continue;
      const srcOffset = contentY - s;
      const h = availableEnd - contentY;
      put(imgs[i], g.top + srcOffset, h, g.top + contentY);
      contentY = availableEnd;
    }

    // 3. The tail - pinned dock (once) plus tab bar - from the shot taken at
    //    the end of the scroll with the dock restored.
    put(tailImg, g.tailTop, g.viewportH - g.tailTop, ms + g.tailTop);

    return canvas.toDataURL('image/png');
  }, { segs: segments, tailB64: tail, g: geom, positions, dsf: SCALE, maxScroll });
  await context.close();

  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));

  return {
    segments: positions.length,
    stitched: true,
    positions,
    dockSuppressed: geom.hasDock,
    tailTop: geom.tailTop,
    contentHeight: geom.scrollHeight,
    totalHeight: geom.top + geom.scrollHeight + (geom.viewportH - geom.bottom),
  };
}

const slug = (route) => route.replace(/^\//, '').replace(/\//g, '-') || 'root';

function shotName({ route, entry, state, theme, text, scroll }) {
  const parts = [slug(route), entry, state, theme, `${VIEWPORT_WIDTH}w`];
  if (args.goal === 'none') parts.splice(1, 0, 'no-goal');
  if (args.draft !== 'none') parts.splice(1, 0, args.draft);
  if (args.view !== 'chart') parts.splice(1, 0, `view-${args.view}`);
  if (args.solve !== 'date') parts.splice(1, 0, `solve-${args.solve}`);
  if (args.monthly !== 'pair') parts.splice(1, 0, `monthly-${args.monthly}`);
  if (args.error !== 'none') parts.splice(1, 0, `error-${args.error}`);
  if (args.date !== '') parts.splice(1, 0, `date-${args.date.replace('+', 'plus')}`);
  if (args.list !== '') parts.splice(1, 0, `list-${args.list}`);
  if (text !== 'default') parts.push(text);
  if (scroll !== 'top') parts.push(`scroll-${scroll}`);
  if (args.full) parts.push('full');
  if (COVER) parts.push('cover');
  return `${parts.join('__')}.png`;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });

// `opening` and the seeding options are mutually exclusive by definition - the
// whole point of `opening` is that nothing is written - so a run that asks for
// both is refused rather than quietly resolved in one direction.
const OPENING = args.session === 'opening';
if (!['seeded', 'opening'].includes(args.session)) {
  console.error(`--session must be 'seeded' or 'opening', got '${args.session}'`);
  process.exit(1);
}
if (OPENING) {
  const seeding = [
    SAVED !== null && '--saved',
    args.goal !== 'set' && '--goal',
    args.draft !== 'none' && '--draft',
    args.solve !== 'date' && '--solve',
    args.error !== 'none' && '--error',
    args.date !== '' && '--date',
  ].filter(Boolean);
  if (seeding.length) {
    console.error(
      `--session=opening writes no state, so ${seeding.join(', ')} cannot apply.
` +
      'Drop it, or use --session=seeded.',
    );
    process.exit(1);
  }
}

// Say so rather than let it look like a bug in the control: with the session
// already at the checkpoint, both skip-ahead positions carry the same figure.
const savedNow = SAVED ?? FULL['saved-toward-deposit'].value;
if (!OPENING && STATES.includes('now') && STATES.includes('ahead') && savedNow >= FULL['checkpoint-amount'].value) {
  console.log(
    `note: the session is at or past the checkpoint (${savedNow} vs ${FULL['checkpoint-amount'].value}),\n` +
    '      so "now" and "ahead" will show the same figure and differ only in which\n' +
    '      segment is selected. Pass --saved=12000 to shoot the two apart.\n',
  );
}

/**
 * `--stage` names one of frame 33's three journey stages, or is empty for
 * "leave whatever the session already has". Validated against `STAGES` itself
 * rather than against a second list, so a stage added to `src/stage.js` is
 * immediately reachable here.
 */
const STAGE = args.stage === '' ? null : args.stage;
if (STAGE && !STAGES.includes(STAGE)) {
  console.error(`--stage must be one of ${STAGES.join(', ')}, got '${STAGE}'.`);
  process.exit(1);
}

// `--browser`. Validated against the engines actually imported rather than a
// second list, so the error names what can be launched instead of what was
// once written down here.
const ENGINES = { chromium, webkit };
if (!(args.browser in ENGINES)) {
  console.error(`--browser must be one of ${Object.keys(ENGINES).join(', ')}, got '${args.browser}'.`);
  process.exit(1);
}
if (!['frame', 'content'].includes(args.fit)) {
  console.error(`--fit must be 'frame' or 'content', got '${args.fit}'.`);
  process.exit(1);
}
if (!['off', 'scroll'].includes(args.stitch)) {
  console.error(`--stitch must be 'off' or 'scroll', got '${args.stitch}'.`);
  process.exit(1);
}

/**
 * `--stitch=scroll` and `--fit=content` are two answers to the same question
 * and disagree about the frame, so asking for both is refused rather than
 * silently resolved in one direction - the same treatment `--session=opening`
 * gets against the seeding options.
 */
const STITCH = args.stitch === 'scroll';
if (STITCH && args.fit === 'content') {
  console.error('--stitch=scroll and --fit=content are mutually exclusive: one grows the frame, the other scrolls inside it.');
  process.exit(1);
}
if (STITCH && args.full) {
  console.error('--stitch=scroll does its own compositing; --full (Playwright fullPage) does not repaint the scaled bezel in WebKit and must not be combined with it.');
  process.exit(1);
}
if (STITCH && SCROLLS.length > 1) {
  console.error(`--stitch=scroll captures the whole scroller, so --scroll must name one position (got ${SCROLLS.join(', ')}).`);
  process.exit(1);
}

/**
 * `--cover`. Each of the three options it refuses already decides what bounds
 * the capture - Playwright's full page, a grown frame, a composite - and
 * `fitFrameToContent` resizes the window back to `--width`, which would drop a
 * widened cover below the framed breakpoint.
 */
const COVER = args.cover;
const COVER_MARGIN = Number(args['cover-margin']);
if (COVER && (STITCH || args.fit === 'content' || args.full)) {
  console.error('--cover sets its own clip, so it cannot be combined with --full, --fit=content or --stitch=scroll.');
  process.exit(1);
}
if (COVER && !(Number.isFinite(COVER_MARGIN) && COVER_MARGIN >= 0)) {
  console.error(`--cover-margin must be a number of px, 0 or more, got '${args['cover-margin']}'.`);
  process.exit(1);
}

/**
 * The width the context opens at. `--width` itself, except under `--cover`,
 * where it is raised to the framed breakpoint: below it shell.css draws no
 * phone at all (`#app-frame, .device-bezel { display: contents }`).
 *
 * The breakpoint is READ FROM shell.css's `--frame-breakpoint`, the token
 * shell-scale.js reads, rather than written here as a third copy of 768.
 */
function framedBreakpoint() {
  const css = fs.readFileSync(path.join(ROOT, 'src/css/shell.css'), 'utf8');
  const m = css.match(/--frame-breakpoint:\s*(\d+)px/);
  if (!m) {
    console.error('--cover could not read --frame-breakpoint from src/css/shell.css.');
    process.exit(1);
  }
  return Number(m[1]);
}
const VIEWPORT_WIDTH = COVER ? Math.max(WIDTH, framedBreakpoint()) : WIDTH;

/** Per-screen stitch facts, printed as a table at the end of a stitched run. */
const stitchReport = [];

const [server, base] = await startServer();
const browser = await ENGINES[args.browser].launch();
const shots = [];
const skipped = [];

try {
  for (const route of ROUTES) {
    // In survey mode the route carries its own recipe, so the product loops
    // below collapse to the one combination that screen is reached by. Outside
    // it nothing changes: `ENTRIES` and `STATES` are the lists `--entry` and
    // `--state` built, exactly as before.
    const spec = SURVEY_MODE ? SURVEY_BY_ROUTE.get(route) : null;
    const entriesHere = spec ? [spec.entry ?? 'direct'] : ENTRIES;
    const statesHere = spec ? [spec.state ?? 'now'] : STATES;
    const outcomeHere = spec?.outcome ?? null;

    for (const entry of entriesHere) {
      // /tracker is the only screen with two doors into it; asking for a
      // `goals` or `insights` entry anywhere else would silently shoot the
      // same thing twice under two names.
      if (entry !== 'direct' && entry !== 'mip' && entry !== 'account' && route !== '/tracker') {
        skipped.push(`${route} via ${entry} - only /tracker has more than one entry`);
        continue;
      }
      if (entry === 'mip' && !route.startsWith('/mip/result/')) {
        skipped.push(`${route} via mip - the flow ends on a result, not on ${route}`);
        continue;
      }
      if (entry === 'account' && route !== '/consent/move-account') {
        skipped.push(`${route} via account - the account tap opens frame 03b, not ${route}`);
        continue;
      }
      for (const theme of THEMES) {
        for (const text of TEXTS) {
          for (const state of statesHere) {
            const context = await browser.newContext({
              viewport: { width: VIEWPORT_WIDTH, height: HEIGHT },
              deviceScaleFactor: SCALE,
              serviceWorkers: 'block',
            });
            if (OPENING) {
              // NOTHING IS SEEDED, AND NOTHING MAY BE WRITTEN BEFORE THE FIRST
              // LOAD. `isNewSession()` is just `!restoredFromStorage`, which
              // `load()` sets from the mere PRESENCE of the storage key - so a
              // pre-write of any kind, theme included, makes the app treat the
              // tab as a restored session and skip `OPENING_STAGE` entirely
              // (D48). An earlier version of this branch wrote theme and text
              // size up front and silently shot the empty calculator instead
              // of the opening one.
              //
              // So the session is opened FIRST, on its own, and the two frame
              // 33 settings are merged into what the app itself persisted. The
              // load that follows is a restored session by then, which is
              // correct: the stage has already been applied and written.
              //
              // THE WARM-UP RUNS ON THE SHOT'S OWN PAGE, NOT A SECOND ONE.
              // `sessionStorage` is per-TAB, not per-context, so a warm-up in
              // a separate page is thrown away when that page closes - the
              // first version of this did exactly that, and every `--theme=dark`
              // opening shot came out light while still looking plausible.
              // Deferred to `openSession` below, after the page exists.
            } else {
              const seed = { ...FULL, theme: theme === 'dark' ? 'dark' : 'greyscale', textSize: text };
              if (PROPERTY !== null) {
                const pair = {
                  'property-value': { value: PROPERTY, provenance: 'entered' },
                  'deposit-pct': FULL['deposit-pct'],
                };
                const target = depositTarget(pair);
                const tax = stampDuty(pair);
                const goal = combinedGoal(pair);
                const checkpoint = checkpointAmount(pair);
                const loan = loanAmount(pair);
                const value = ltv(pair);
                Object.assign(seed, {
                  'property-value': pair['property-value'],
                  'deposit-target': { value: target.value, provenance: target.provenance },
                  'stamp-duty': { value: tax.value, provenance: tax.provenance },
                  'combined-goal': { value: goal.value, provenance: goal.provenance },
                  'checkpoint-amount': { value: checkpoint.value, provenance: checkpoint.provenance },
                  'loan-amount': { value: loan.value, provenance: loan.provenance },
                  ltv: { value: value.value, provenance: value.provenance },
                });
              }
              if (SAVED !== null) {
                seed['saved-toward-deposit'] = { ...FULL['saved-toward-deposit'], value: SAVED };
              }
              if (args.goal === 'none') {
                for (const key of NO_GOAL_KEYS) seed[key] = { value: null, provenance: null };
              }
              if (args.draft === 'property-cleared') seed.propertyValueCleared = true;
              if (Object.keys(ASSIGN).length > 0) {
                seed.accountAssignments = { ...(FULL.accountAssignments ?? {}), ...ASSIGN };
                seed.accountIncluded = { ...(FULL.accountIncluded ?? {}) };
                for (const [id, group] of Object.entries(ASSIGN)) {
                  if (group === 'deposit') seed.accountIncluded[id] = true;
                }
                seed.accountSelectionEdited = true;
              }
              seed.solveFor = args.solve;
              // WHAT WAS COMMITTED, WHICH IS NOT WHAT `--solve` SELECTS (D136).
              // `--solve` picks which variant frame 10 DRAWS; the shared seed
              // still commits two distinct bounds either way, so step 3 and
              // frame 12 render the pair on both. The single-value state is
              // reached by committing one figure to both bounds, which is what
              // frame 10b's Continue now does - so it needs its own axis.
              if (args.monthly === 'single') {
                const one = FULL['savings-rate'] ?? seed['monthly-low'];
                seed['monthly-low'] = { ...one };
                seed['monthly-high'] = { ...one };
                seed['savings-rate'] = { ...one };
              }
              if (args.view !== 'chart') seed.chartView = args.view;
              if (args.date !== '') Object.assign(seed, monthsFromToday(DATE_MONTHS));
              // LAST, so an error state's figure is not overwritten by
              // `--property`'s re-derivation above. `--error` and `--property`
              // both write `property-value`, and the error is the thing the
              // run asked for.
              Object.assign(seed, ERROR_STATES[args.error]());
              await context.addInitScript((v) => {
                try { sessionStorage.setItem('yfh-state', JSON.stringify(v)); } catch {}
              }, { ...seed, buildVersion: BUILD_VERSION });
            }
            const page = await context.newPage();
            try {
              if (OPENING) {
                // One load with empty storage: the app applies OPENING_STAGE
                // and persists it. Then the two frame 33 settings go in on top,
                // in this same tab, and `navigate` reloads onto them.
                await page.goto(base, { waitUntil: 'networkidle' });
                await page.waitForFunction(() => {
                  try { return sessionStorage.getItem('yfh-state') !== null; } catch { return false; }
                }, null, { timeout: 5000 });
                await page.evaluate((v) => {
                  const stored = JSON.parse(sessionStorage.getItem('yfh-state'));
                  sessionStorage.setItem('yfh-state', JSON.stringify({ ...stored, ...v }));
                }, { theme: theme === 'dark' ? 'dark' : 'greyscale', textSize: text });
                // AND RELOAD, or the patch is invisible. `state.js` reads
                // storage once at module load, so writing to sessionStorage
                // under a running app changes nothing the app will ever read -
                // and `navigate` only sets a hash, which the router handles
                // in-document without re-reading state. Without this reload
                // every opening shot rendered light and default while the
                // stored theme said otherwise.
                await page.reload({ waitUntil: 'networkidle' });
              }

              // FRAME 33'S OWN CONTROL, PRESSED. Applied after the session
              // exists either way - an opening session has just persisted
              // `OPENING_STAGE`, a seeded one has just been written - because
              // `stagePatch()` builds from a fresh `defaultState()` and
              // overwrites every key it owns, so pressing it last is what
              // makes the stage the thing on screen. `navigate` re-enters from
              // the requested entry point afterwards.
              if (STAGE) {
                await page.goto(`${base}#/settings`, { waitUntil: 'networkidle' });
                const control = await page.$(`[data-action="set-stage"][data-value="${STAGE}"]`);
                if (!control) {
                  skipped.push(`${route} - frame 33 draws no "${STAGE}" stage control`);
                  continue;
                }
                await control.click();
                await page.waitForTimeout(300);
              }
              await navigate(page, base, route, entry, state, outcomeHere);

              const landed = await page.evaluate(() => window.location.hash);
              if (landed !== `#${route}`) {
                skipped.push(`${route} via ${entry} - the app redirected to ${landed || '#'}`);
                continue;
              }

              // After the redirect check, so a shot that never reached its
              // screen does not report a missing disclosure as well.
              await openDisclosure(page);
              await openDateList(page);
              await selectBuild(page);
              await openDiagnostics(page);
              await tabTo(page);

              if (state === 'ahead' && entry !== 'mip') {
                const control = await page.$('[data-action="set-skip-ahead"][data-value="ahead"]');
                if (!control) {
                  skipped.push(`${route} - no skip-ahead control, so "ahead" is not a state it has`);
                  continue;
                }
                await control.click();
                await page.waitForTimeout(300);
              }

              // THE FRAME DOES NOT SCROLL, THE SCREEN INSIDE IT DOES
              // (shell.css). So an end-of-scroll shot moves `.screen-content`
              // - or a sheet's own `.bottom-sheet__content` - rather than the
              // window, and the pause after it is long enough for
              // action-bar.js to re-measure and settle the `--more-below`
              // fade, which is part of what such a shot is taken to show.
              for (const scroll of SCROLLS) {
                await page.evaluate((where) => {
                  const s = document.querySelector('.bottom-sheet__content, .screen-content');
                  if (!s) return;
                  // A SELECTOR SCROLLS TO AN ELEMENT. `top` and `end` reach the
                  // two ends of a screen, which is all most shots need, but an
                  // element in the middle of a long screen is unreachable by
                  // either - and the tracker's milestone rows are exactly that.
                  // Anything beginning `.` or `#` is treated as a selector and
                  // centred in the viewport.
                  if (where.startsWith('.') || where.startsWith('#')) {
                    const el = document.querySelector(where);
                    if (el) {
                      s.scrollTop = el.offsetTop - s.clientHeight / 2 + el.offsetHeight / 2;
                    }
                    return;
                  }
                  s.scrollTop = where === 'end' ? s.scrollHeight : 0;
                }, scroll);
                await page.waitForTimeout(300);

                // Fitted LAST, after every state-setting step above and after
                // the scroll, so what it measures is the screen as it will be
                // shot rather than as it first painted.
                await fitFrameToContent(page);

                const name = spec
                  ? `${String(spec.index).padStart(2, '0')}-${spec.name}.png`
                  : shotName({ route, entry, state, theme, text, scroll });
                const file = path.join(OUT, name);
                if (STITCH) {
                  const result = await captureStitched(page, file);
                  stitchReport.push({ name, route, ...result });
                } else if (COVER) {
                  const clip = await prepareCover(page);
                  await page.screenshot({ path: file, clip, omitBackground: true });
                  console.log(`    cover clip: ${clip.width}x${clip.height} CSS px at x=${clip.x}, y=${clip.y}`);
                } else {
                  await page.screenshot({ path: file, fullPage: args.full });
                }
                shots.push({ name, file, route, entry, state, theme, text, scroll });
                console.log(`  ${name}`);

                // `--figures` DUMPS WHAT THE SCREEN ACTUALLY RENDERS, as text.
                // A PNG answers "does it look right"; this answers "is that
                // the figure the model produced", which is the question a
                // change to a seeded or derived amount actually raises. Read
                // from the live DOM rather than from state, so a screen that
                // renders a stale or hard-coded string is caught by the same
                // pass - the point of SPEC.md's "no number hardcoded in a
                // screen" rule is only testable against what is on screen.
                if (args.figures) {
                  const found = await page.evaluate(() => {
                    const root = document.querySelector('.bottom-sheet, .screen') || document.body;
                    const seen = new Set();
                    for (const m of (root.innerText || '').matchAll(/£[\d,]+(?:\.\d{2})?/g)) seen.add(m[0]);
                    // AN INPUT'S VALUE IS NOT IN `innerText`, and frame 09's
                    // property field is the one figure this whole dump most
                    // needs to see - the participant's own committed amount,
                    // rendered back into the control they typed it in. Read
                    // separately and tagged, so a field showing something the
                    // rest of the screen disagrees with is visible rather than
                    // absent.
                    for (const el of root.querySelectorAll('input')) {
                      if (el.value) seen.add(`[field: ${el.value}]`);
                    }
                    return [...seen];
                  });
                  figureDump.push({ name, route, entry, state, figures: found });
                  console.log(`    figures: ${found.length ? found.join('  ') : '(none)'}`);
                }
              }
            } finally {
              await context.close();
            }
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Contact sheet: every shot in one labelled grid.
  //
  // Built by rendering an HTML page in the same browser and screenshotting it,
  // rather than by pulling in an image library - this repo has no runtime
  // dependencies and the one dev dependency it does have can already do it.
  // -------------------------------------------------------------------------
  // A stitched run writes no contact sheet even without `--no-sheet`: its
  // images are the full screens, so a grid of them is a composite of thirty
  // screens rather than a way of looking at one.
  if (args.sheet && !STITCH && shots.length > 0) {
    const THUMB = 260;
    const cards = shots.map((s) => {
      const data = fs.readFileSync(s.file).toString('base64');
      const caption = [s.entry, s.state, s.theme, s.text === 'default' ? null : s.text, s.scroll === 'top' ? null : `scrolled to ${s.scroll}`]
        .filter(Boolean).join(' / ');
      return `
        <figure>
          <img src="data:image/png;base64,${data}" alt="${s.name}" />
          <figcaption><b>${s.route}</b><span>${caption}</span></figcaption>
        </figure>`;
    }).join('');

    const html = `
      <style>
        body { margin: 0; padding: 24px; background: #f2f2f7; font: 13px -apple-system, "Segoe UI", system-ui, sans-serif; color: #1c1c1e; }
        h1 { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
        p.meta { margin: 0 0 20px; color: #6c6c70; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(${THUMB}px, 1fr)); gap: 20px; }
        figure { margin: 0; }
        img { width: 100%; display: block; border-radius: 10px; border: 1px solid #d1d1d6; background: #fff; }
        figcaption { display: flex; flex-direction: column; gap: 2px; padding-top: 8px; line-height: 1.35; }
        figcaption span { color: #6c6c70; }
      </style>
      <h1>Your first home - ${shots.length} shot${shots.length === 1 ? '' : 's'} at ${WIDTH}x${HEIGHT}</h1>
      <p class="meta">${new Date().toISOString().slice(0, 16).replace('T', ' ')} - route / entry / skip-ahead state / theme</p>
      <div class="grid">${cards}</div>`;

    const context = await browser.newContext({
      viewport: { width: Math.min(1400, 24 * 2 + THUMB * Math.min(shots.length, 4) + 20 * 3), height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const sheet = path.join(OUT, 'contact-sheet.png');
    await page.screenshot({ path: sheet, fullPage: true });
    await context.close();
    console.log(`  contact-sheet.png`);
  }
} finally {
  await browser.close();
  if (args.figures && figureDump.length > 0) {
    const lines = figureDump.map(
      (d) => `${d.route}  [${d.entry}/${d.state}]\n    ${d.figures.length ? d.figures.join('  ') : '(no currency figure rendered)'}`,
    );
    const dumpFile = path.join(OUT, 'figures.txt');
    fs.writeFileSync(dumpFile, lines.join('\n') + '\n');
    console.log(`\n${dumpFile}`);
  }

  await new Promise((resolve) => server.close(resolve));
}

if (STITCH && stitchReport.length > 0) {
  console.log('\nStitch (segments = discrete screenshots composited; dock = pinned action bar suppressed in all but the tail):');
  for (const r of stitchReport) {
    console.log(
      `  ${r.name.padEnd(30)} ${String(r.segments).padStart(2)} seg  ` +
      `content ${String(r.contentHeight ?? '-').padStart(5)}  total ${String(r.totalHeight ?? '-').padStart(5)}  ` +
      `${r.dockSuppressed ? `dock@${r.tailTop}` : 'no dock'}${r.stitched ? '' : `  (${r.reason})`}`,
    );
  }
}

console.log(`\n${shots.length} shot${shots.length === 1 ? '' : 's'} -> ${path.relative(ROOT, OUT)}`);
for (const note of skipped) console.log(`  skipped: ${note}`);
if (shots.length === 0) process.exitCode = 1;
