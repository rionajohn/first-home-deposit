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

const STORAGE_KEY = 'yfh-state';

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

function defaultState() {
  const figures = {};
  for (const key of SECTION_6_KEYS) {
    figures[key] = { value: null, provenance: null };
  }

  return {
    ...figures,
    ...seededFigures(),

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

    // Frame 33 scenario controls (build-spec.md section 7) — testing only,
    // not part of the feature being tested.
    theme: 'greyscale', // 'greyscale' | 'brand'
    textSize: 'default', // 'default' | 'large'
    stage: 'setting-up', // 'setting-up' | 'saving' | 'ready-to-check'
    resultOutcome: 'likely', // 'likely' | 'not-yet'
  };
}

function load() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    // Merge over defaultState() so a stored value from an older shape never
    // leaves a newly-added key undefined.
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
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
  state = defaultState();
  persist(state);
  return state;
}
