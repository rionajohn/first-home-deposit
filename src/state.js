/**
 * Central state store: the build-spec.md section 6 variables, the
 * navigation/journey flags build-spec.md section 1 and 2 reference, and the
 * frame 33 scenario controls (build-spec.md section 7). Persisted to
 * sessionStorage so a page refresh doesn't lose a participant's progress
 * mid-session; router.js clears it on #/reset for the next participant.
 *
 * Every section 6 entry is shaped { value, provenance } — see
 * src/model/model.js for how these are read and combined. Nothing in this
 * file computes a figure; it only holds the current value of each one - the
 * seeded ones below included, whose values come from src/model/.
 */

import { MOCK_POSITION, accountFigures } from './model/accounts.js';
import { leftOver } from './model/model.js';
import { BUILD_VERSION } from './cache-version.js';

const SECTION_6_KEYS = [
  'saved-toward-deposit',
  'emergency-fund',
  'unassigned',
  'money-in',
  'essential-spending',
  'left-over',
  'property-value',
  'deposit-pct',
  'deposit-target',
  // DECISIONS.md D70. `stamp-duty` and `combined-goal` are section 6 figures
  // this build adds: `deposit-target` keeps its own meaning (what goes down
  // against the property, which every mortgage figure still sizes against) and
  // `combined-goal` is what actually has to be saved.
  'stamp-duty',
  'combined-goal',
  'loan-amount',
  'ltv',
  'monthly-low',
  'monthly-high',
  'savings-rate',
  'months-to-target',
  'on-track-for',
  'checkpoint-amount',
  'borrow-low',
  'borrow-high',
  'max-property',
];

export const STORAGE_KEY = 'yfh-state';

/**
 * Every accordion / disclosure / expandable section in the app, and the one
 * state each of them is in when its screen loads: closed.
 *
 * WHY CLOSED, AND WHY IN ONE PLACE
 * These previously defaulted to open, matching the reference PNGs (frames
 * 05, 05b, 06 and 19 all draw their disclosures expanded, chevron up) and
 * build-spec.md section 2's "breakdown open / closed — opens by default"
 * row. That is now deliberately overridden: a section that is already open
 * cannot show whether a participant would have chosen to open it, and
 * "did they go looking for the breakdown" is one of the things these
 * sessions are meant to observe. Starting closed makes every expansion a
 * participant action rather than a default. Recorded as an intentional
 * deviation in DECISIONS.md D12 and GAPS.md G30 — the affected frames are
 * exempt from the screenshot-comparison pass.
 *
 * WHY IT IS NOT ENOUGH TO CHANGE THE DEFAULTS
 * This store is persisted to sessionStorage and survives navigation, so an
 * accordion a participant opened on frame 05 would still be open when they
 * came back to frame 05 by the app bar's back control. `resetCollapsibles()`
 * below is called by router.js on every hash-driven navigation, so a screen
 * is closed every time it is *entered*, including on back navigation, while
 * a screen re-rendering itself in place (a toggle handler calling its own
 * `render`) bypasses the router and correctly keeps what the participant
 * just opened.
 *
 * Open state is therefore never persisted in any meaningful sense: it is
 * written to sessionStorage as part of the store, but it is overwritten with
 * `false` before any screen next reads it.
 *
 * Add a new disclosure? Add its key here and it inherits both rules.
 */
const COLLAPSIBLE_DEFAULTS = {
  // Frame 05 (What we can see) — build-spec.md section 1's "Toggle
  // the breakdown" row: breakdownOpen only, no figure changes.
  breakdownOpen: false,
  // Frame 06 (What we found) — same accordion pattern, its own key so
  // opening/closing one screen's disclosure doesn't affect the other's.
  summaryDisclosureOpen: false,
  // DECISIONS.md D70's second amendment. The tracker's "What makes up your
  // goal" disclosure. Closed on load like every other one (D12).
  goalBreakdownOpen: false,
  // Frame 19 (Before you run the check) — its three chevron sections.
  mipAskedOpen: false,
  mipBenefitsOpen: false,
  mipAwareOpen: false,
  // The "How we worked this out" card (components/ui.js's
  // howThisWorksCardHTML) on frames 06, 12, 13, 20 and 21. One key each, for
  // the same reason 05 and 06 have separate breakdown keys: opening the card
  // on the results screen must not pre-open it on the tracker or the LTV
  // explainer, or the second screen stops measuring anything.
  //
  // Frame 06 now holds TWO collapsibles — its breakdown above and this card —
  // so its toggle handler routes on `data-disclosure-id` rather than binding
  // the first match.
  summaryHowWeWorkedOpen: false,
  resultHowWeWorkedOpen: false,
  ltvHowWeWorkedOpen: false,
  mipLikelyHowWeWorkedOpen: false,
  mipNotYetHowWeWorkedOpen: false,
};

/**
 * The figures that are already there when the session starts.
 *
 * THIS APP ASSUMES THE PARTICIPANT'S ACCOUNTS ARE CONNECTED. It is their main
 * bank, so the account activity has already been read by the time any screen
 * renders: there is no linking step to complete and no state in which the
 * bank has read nothing. These four were previously seeded by frame 03's
 * "Agree and continue" (money-in, essential-spending and the three account
 * totals) and frame 05's Continue (left-over), which left every screen ahead
 * of those two able to be reached with nulls - the whole reason the deleted
 * general mode existed.
 *
 * Values come from src/model/, never computed here: MOCK_POSITION is the
 * mock current-account activity, accountFigures sums the mock accounts by
 * group, and leftOver applies build-spec.md section 4's own rule to the
 * first two.
 *
 * Provenance follows DECISIONS.md D5 exactly as it did before: read for what
 * was read, derived for what follows from it. A participant's own edit
 * overwrites both value and provenance in the ordinary way.
 */
function seededFigures() {
  const read = {
    'money-in': { value: MOCK_POSITION.moneyIn, provenance: 'read' },
    'essential-spending': { value: MOCK_POSITION.essentialSpending, provenance: 'read' },
  };
  const derived = leftOver(read);
  return {
    ...read,
    'left-over': { value: derived.value, provenance: derived.provenance },
    ...accountFigures({ accountAssignments: {}, accountIncluded: {}, accountSelectionEdited: false }),
  };
}

/**
 * A brand new session, computed fresh on every call. Exported for
 * `src/stage.js`, which builds frame 33's Journey stage patches from a fresh
 * one rather than layering onto the current store - that is what makes a stage
 * change idempotent in both directions. Callers must not mutate what they get
 * back; every writer in this app spreads into a new object instead.
 */
export function defaultState() {
  const figures = {};
  for (const key of SECTION_6_KEYS) {
    figures[key] = { value: null, provenance: null };
  }

  return {
    ...figures,
    ...seededFigures(),

    // THE BUILD THAT WROTE THIS SESSION (DECISIONS.md D59).
    //
    // Not a figure, not a scenario control and not read by any screen. It is
    // the stamp `load()` compares to decide whether a restored session belongs
    // to the build now running. It lives INSIDE the store rather than wrapping
    // it so that everything which already reads the stored object - the six
    // browser harnesses, and `shots.mjs`'s spread over a stored session -
    // keeps working on the same shape.
    buildVersion: BUILD_VERSION,

    // THE DAY THIS SESSION'S DATES ARE MEASURED FROM (DECISIONS.md D97).
    //
    // Stamped once, here, and never rewritten by a screen. Every calendar date
    // the app renders derives from it - `formatMonthYear`, `formatYear` and
    // `formatMonthYearRange` all take it as their `fromDate`.
    //
    // NOT `RATES.asAt`, WHICH IS WHAT /tracker USED AND WHY THIS EXISTS. D3
    // pins the Bank Rate so figures cannot drift between sessions, and that
    // reasoning was applied to the rendering date as well - a different fact.
    // A rate is pinned so figures hold still; a "today" must be current or
    // every date derived from it is wrong. On 31 August 2026 the tracker's
    // "On track for" dates were a full calendar month early for exactly that
    // reason. `RATES.asAt` keeps its provenance job on frames 29/30/31.
    //
    // DERIVED AT RENDER, NEVER CACHED. No module holds a `const TODAY`, so a
    // discard-and-restart is visible immediately rather than at the next
    // reload.
    sessionAnchor: new Date().toISOString().slice(0, 10),

    // Navigation / journey flags (build-spec.md section 1 and 2)
    journeyStarted: false,
    solveFor: null, // 'date' | 'amount'
    returnFrame: null,

    // WHERE THE PARTICIPANT ENTERED THE FLOW THEY ARE IN, and the only thing
    // the app-bar close X reads. '/home' or '/goals' for the journey itself,
    // and '/tracker' once they open the Mortgage in Principle flow from the
    // tracker - that flow's five X-bearing screens exit back to the tracker,
    // not out to frame 01, so the tracker is genuinely their entry point. Null
    // for a session that has not entered anything yet (a typed URL, a
    // facilitator opening frame 33), which the X falls back to /home on.
    //
    // NOT `returnFrame`, which answers a different question. `returnFrame` is a
    // single scratch slot recording which screen opened the sheet you are
    // looking at; roughly twenty forward controls overwrite it, so by the time
    // a participant reaches frame 21 it says '/mip/result/not-yet', not where
    // they came in. The X needs the one fact that does NOT change as they move
    // through the flow, which is why this is written once on entry and left
    // alone. See DECISIONS.md D30.
    journeyEntryPoint: null,

    // `history.length` at the moment the journey was entered, so the exit can
    // go back over the flow's entries instead of overwriting the last one.
    // Recorded on the same click as `journeyEntryPoint` and read only by
    // `exitFlow`. See DECISIONS.md D32 for what this does and does not
    // guarantee - it is an approximation, deliberately, and it fails safe.
    flowEntryHistoryLength: null,
    goalSaved: false,
    mipUnlocked: false,
    journeyPaused: false, // frame 10c "Save and leave" — build-spec.md section 1
    goal: null, // 'house' | 'other' — frame 06's "Is a house still your goal right now?" decision
    calculatorEntered: false,
    lisaCapBreached: false, // DECISIONS.md D6 — property-value > LISA_CAP_PROPERTY_VALUE, frame 09b
    ltvVideoSeen: false, // frame 13b (build-spec.md section 2's "video-unseen / video-seen" variant of frame 13's explainer row)

    // Frame 19 (Before you run the check) — build-spec.md section 1's own
    // "Run the check -> checkRunAt set; soft search recorded" row, plus the
    // three chevron disclosures (see COLLAPSIBLE_DEFAULTS below for why
    // they start closed).
    checkRunAt: null,
    softSearchRecorded: false,

    ...COLLAPSIBLE_DEFAULTS,

    // Frame 03 (Your accounts)
    accountAssignments: {}, // accountId -> group, set by 03b moves (src/model/accounts.js)
    accountIncluded: {}, // accountId -> boolean, set by the "Select all accounts" row
    // Has the participant changed which accounts are counted — by the
    // "Select all accounts" row or by a 03b move? Drives the provenance of
    // saved-toward-deposit / emergency-fund / unassigned (DECISIONS.md D5):
    // read while untouched, entered once it is true. See accountFigures() in
    // src/model/accounts.js.
    accountSelectionEdited: false,
    selectedAccountId: null, // set before opening 03b

    // Frame 10b (Date stepper variant) — the target date isn't a build-spec.md
    // section 6 figure in its own right (only the months-to-target/savings-rate
    // solved from it are), so it's held here as plain UI state, seeded on
    // first render.
    targetMonth: null, // 1-12
    targetYear: null,

    // Frame 10b — DID THE APP MOVE THE PARTICIPANT'S TARGET DATE?
    //
    // Replaces `targetYearCleared` (DECISIONS.md D83). That key existed because
    // the year was a TYPED field and could sit empty mid-edit, which is frame
    // 09's `propertyValueCleared` case exactly. The year is a `<select>` now: it
    // always holds one of its own options, so there is no half-made state to
    // keep out of the store and no draft to track.
    //
    // What replaced it is a different kind of flag. The date is floored at the
    // earliest date the goal is reachable by, and an edit on ANOTHER screen -
    // essentials, money in, property value, deposit percentage, the saved total
    // - can move that floor past a date the participant already picked. The
    // date is then moved to the new floor, and this records that it happened so
    // the screen can say so on arrival (`dateMovedToEarliest` in content.js).
    // D46's rule, met the way D46 asks: the replacement is visible.
    //
    // CLEARED BY THE PARTICIPANT PICKING A DATE, not by a timeout and not by
    // navigating. The disclosure has to survive the arrival it describes, and it
    // must not outlive the value it describes.
    //
    // NOT IN `stage.js`'s STAGE_KEYS, for the reason `targetYear` itself is
    // not: a stage patch does not write the target date, so a flag about that
    // date has no business being restored beside figures that are not.
    dateMovedToEarliest: false,

    // Frame 10b — DID THE APP MOVE THE DATE DOWN TO THE CAP?
    //
    // `dateMovedToEarliest`'s mirror at the other end of the list (DECISIONS.md
    // D86, closing GAPS.md G102). The list is capped at the month the balance
    // reaches the goal unaided (D85), and an upstream edit - a higher saved
    // total, a lower property value, a lower deposit percentage - can move that
    // cap behind a date the participant already picked. The date is moved down
    // to the cap, and this records that it happened so the screen can say so.
    //
    // MUTUALLY EXCLUSIVE WITH `dateMovedToEarliest`, and enforced rather than
    // assumed: a selection cannot be below the floor and above the cap at the
    // same time, so each move writes its own flag and clears the other in the
    // same patch. Neither survives the participant picking a date.
    dateMovedToCap: false,

    // Frame 09 (Property and deposit) — IS THE PROPERTY VALUE FIELD SITTING
    // EMPTY WHILE THE PARTICIPANT RE-TYPES IT?
    //
    // Screen-local draft state, held here for the same reason targetMonth is
    // and under the same rule: a draft never writes to a section 6 figure.
    // Frame 09 used to record an empty field by writing `property-value: null`,
    // which left the store holding a half-made edit beside a committed
    // `deposit-target` - a combination no downstream screen expects and no
    // guard tests for. Frames 11, 12 and 15/16 all read `property-value` live
    // and all three fabricated £0 figures from it. See GAPS.md G62 and
    // DECISIONS.md D46.
    //
    // The committed figure is left alone while this is true. Frame 09's
    // Continue is already disabled on an empty field, so an empty value was
    // never committable; it is now not recordable either.
    propertyValueCleared: false,

    // Frame 11 (Check your figures) - THE SAME DRAFT RULE, ON THE THREE OTHER
    // FIELDS THAT SCREEN CAN NOW CLEAR (DECISIONS.md D62).
    //
    // Frame 11's rows edit in place, so each of them has the two ways of being
    // empty that `propertyValueCleared` above describes, and each takes the
    // same answer: the committed figure is left standing, the emptiness is
    // recorded here, and "See what this means" is disabled until the field
    // holds a number again. Without these, `formatCurrency(null)` would render
    // a cleared row as £0 on frames 12, 15 and 16 - GAPS.md G62's defect
    // arriving by a fourth route.
    //
    // THERE IS NO `propertyValueCleared` TWIN HERE. Frame 11's property-value
    // field is the same figure frame 09's field writes, so it reuses frame 09's
    // key rather than adding a second one that could disagree with it: a row
    // left empty on 11 is the same draft frame 09 would show as its 09a empty
    // variant, and either screen's commit resolves it.
    depositPctCleared: false,
    savedSoFarCleared: false,
    monthlyLowCleared: false,
    monthlyHighCleared: false,

    // --- The skip-ahead control (src/skip-ahead.js, DECISIONS.md D38) ------
    //
    // A RESEARCH AFFORDANCE. Not a build-spec.md variable, not a feature, and
    // not part of what is being tested — it is how a moderated session reaches
    // the tracker's later state and the Mortgage in Principle screens beyond
    // it without saving toward the goal for real. The control lives on /goals
    // and nowhere else.
    //
    // `skippedAhead` is which of the two positions is showing.
    // `skipAheadStash` holds the starting position's figures verbatim while
    // the later one is showing, so moving back is a restore rather than a
    // second derivation — see skip-ahead.js for the whole of the reasoning and
    // for which figures are in it.
    //
    // Both are cleared by `resetState()` along with everything else, so the
    // next participant starts at "Now" whatever the last one left the control
    // on.
    skippedAhead: false,
    skipAheadStash: null,

    // Frame 33 scenario controls (build-spec.md section 7) — testing only,
    // not part of the feature being tested.
    // DECISIONS.md D73. Frame 12's growth-chart range, in months; null is the
  // "Max" chip, resolved at render from the participant's own projection.
  //
  // NOT IN `COLLAPSIBLE_DEFAULTS`, and it was, briefly. That object is reset by
  // `resetCollapsibles()` on every hash-driven navigation (D12), so a range the
  // participant had chosen was silently thrown away the moment they opened a
  // sheet and came back. It is a view setting, not a disclosure: it should
  // persist for the session exactly as theme and text size do, which is why it
  // sits with them.
  chartRangeMonths: 24,

    // Frame 12's plotted series and view (DECISIONS.md D100). View settings on
    // exactly `chartRangeMonths`' terms: they change what the chart draws and
    // never what the model projects, they are not section 6 figures, and they
    // are not in `STAGE_KEYS`.
    //
    // `chartSeries` DEFAULTS TO 'low', AND THAT IS LOAD-BEARING (the plan's
    // 7.6). The comparison card now follows this selection rather than being
    // hard-wired to `monthly-low`, which is a trade against D72's "the
    // conservative end is the one that cannot disappoint". D72's intent
    // survives only because the default is the conservative end: a participant
    // who touches nothing meets the conservative picture and reaches the
    // optimistic one by choosing it. Change this default and that trade is
    // undone.
    chartSeries: 'low', // 'low' | 'high'
    chartView: 'chart', // 'chart' | 'table'
    // Which point on frame 12's line carries the guide, the value and the date.
    // Null means "the last point in the window", which is the at-rest state:
    // one point is ALWAYS active, because on touch there is no hover and
    // nothing would otherwise hint the chart responds (the plan's 6.6.2b).
    // Reset to null whenever the window changes - an index into a 24-point
    // array names a different month once the window moves.
    chartActiveIndex: null,
    theme: 'greyscale', // 'greyscale' | 'brand'
    textSize: 'default', // 'default' | 'large'
    stage: 'setting-up', // 'setting-up' | 'saving' | 'ready-to-check'
    resultOutcome: 'likely', // 'likely' | 'not-yet'
  };
}

/**
 * WAS THIS STORE BUILT FRESH, OR RESTORED FROM A REFRESH?
 *
 * `router.js` opens a new session in a stage rather than empty (DECISIONS.md
 * D48, `OPENING_STAGE` in src/stage.js), and it has to be able to tell the two
 * cases apart. A session restored from sessionStorage is a participant part-way
 * through - re-applying an opening stage to it would discard whatever they had
 * entered, which is the exact thing persisting the store exists to prevent.
 *
 * False from a fresh `defaultState()`, true the moment a stored session is read
 * back, and false again after `resetState()` - which makes a new session by
 * definition, and is what `#/reset` runs between participants.
 */
let restoredFromStorage = false;

function load() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const stored = JSON.parse(raw);

    // A SESSION FROM ANOTHER BUILD IS DISCARDED WHOLE, NOT MERGED
    // (DECISIONS.md D59, GAPS.md G66).
    //
    // The merge below is what made this necessary: a STORED value wins over a
    // freshly seeded one, so a session carried across a deploy kept rendering
    // whatever figures the previous build seeded, indefinitely, with nothing
    // on screen to say so. `money-in` was the one that surfaced it; every
    // seeded figure had the same exposure.
    //
    // DISCARDED WHOLE is the load-bearing word, and it is what makes this
    // acceptable where the version check G66 rejected was not. That one would
    // have re-applied the opening stage OVER a restored store, and
    // `stagePatch()` writes only `STAGE_KEYS` - leaving `targetMonth`,
    // `solveFor`, `journeyStarted` and the rest of a real session sitting
    // beside a fresh goal, a combination no screen expects. Replacing the
    // store entirely cannot produce that: what comes back is exactly a first
    // load, which every screen already handles.
    //
    // `restoredFromStorage` deliberately stays false here, so `isNewSession()`
    // is true and `router.js`'s `openSession()` applies the opening stage to
    // the fresh store - the same path a genuine first load takes. That also
    // closes G66's original half: the Insights tab stops redirecting.
    //
    // An UNSTAMPED session takes this branch too (`undefined !== 'vNN'`),
    // which is what retires every session written before this change.
    if (stored.buildVersion !== BUILD_VERSION) {
      console.warn(
        `[yfh] Stored session was written by build ${stored.buildVersion ?? '(unstamped)'}; ` +
        `this build is ${BUILD_VERSION}. Discarding it and starting a new session.`,
      );
      const fresh = defaultState();
      // Written back immediately so the discard happens once rather than on
      // every subsequent load in this tab.
      persist(fresh);
      return fresh;
    }

    // A SESSION ANCHORED TO ANOTHER MONTH IS DISCARDED THE SAME WAY
    // (DECISIONS.md D97). The same branch, for a second reason.
    //
    // Calendar dates need a "today", and durations did not. A stale anchor
    // produces wrong years with NOTHING ON SCREEN TO REVEAL IT, so a screenshot
    // taken during a session could not be interpreted afterwards - which is the
    // failure mode this whole date conversion introduces and has to answer.
    //
    // MONTH GRANULARITY, NOT DAY. Every date derives from a month floor
    // (`formatMonthYear` and `dateAtMonths` both build from the 1st), so a day
    // change moves nothing on screen and discarding on one would retire a
    // multi-day facilitator setup for no gain. Never discarding is the failure
    // mode above.
    //
    // DISCARDED WHOLE RATHER THAN RE-STAMPED, and that is the load-bearing
    // choice. Re-stamping keeps the session and silently moves every projected
    // date, so a screenshot taken before the boundary and one taken after
    // disagree with nothing on screen to say why. D59's own reasoning applies
    // unchanged: what comes back is exactly a first load, which every screen
    // already handles. The cost is a session lost across a month boundary,
    // which no moderated session spans.
    //
    // IT ALSO BOUNDS THE FRAME 10 TRANSITIONAL STATE (the plan's 3.3). That
    // screen is frozen and still reads the wall clock; because this discard
    // keeps `sessionAnchor` in the current month, the two cannot name different
    // months while a participant is looking at them.
    const anchorMonth = String(stored.sessionAnchor ?? '').slice(0, 7);
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (anchorMonth !== currentMonth) {
      console.warn(
        `[yfh] Stored session was anchored to ${stored.sessionAnchor ?? '(unstamped)'}; ` +
        `this month is ${currentMonth}. Discarding it and starting a new session.`,
      );
      const fresh = defaultState();
      persist(fresh);
      return fresh;
    }

    restoredFromStorage = true;
    // Merge over defaultState() so a stored value from an older shape never
    // leaves a newly-added key undefined. Unchanged: a same-build restore
    // behaves exactly as it did before this check existed.
    return { ...defaultState(), ...stored };
  } catch {
    return defaultState();
  }
}

/**
 * True while nothing has been restored into this store - a first page load, or
 * a session just reset. Read by `router.js` and by nothing else.
 */
export function isNewSession() {
  return !restoredFromStorage;
}

function persist(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage unavailable (private browsing, storage full, etc.) —
    // the session continues with in-memory state only.
  }
}

let state = load();

export function getState() {
  return state;
}

export function setState(patch) {
  state = { ...state, ...patch };
  persist(state);
  return state;
}

/**
 * Closes every collapsible section. Called by router.js on each hash-driven
 * navigation, so every screen is entered with its disclosures shut — see
 * COLLAPSIBLE_DEFAULTS above. Does not persist: the write goes through
 * `setState`, which persists, but the value written is always the closed
 * default.
 */
export function resetCollapsibles() {
  return setState({ ...COLLAPSIBLE_DEFAULTS });
}

export function resetState() {
  // A reset IS a new session, so the flag goes back with the figures - the
  // next thing `#/reset` does is hand off to `router.js`, which opens the
  // session in its stage exactly as it does on a first load.
  restoredFromStorage = false;
  state = defaultState();
  persist(state);
  return state;
}
