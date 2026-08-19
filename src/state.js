/**
 * Central state store: the build-spec.md section 6 variables, the
 * navigation/journey flags build-spec.md section 1 and 2 reference, and the
 * frame 33 scenario controls (build-spec.md section 7). Persisted to
 * sessionStorage so a page refresh doesn't lose a participant's progress
 * mid-session; router.js clears it on #/reset for the next participant.
 *
 * Every section 6 entry is shaped { value, provenance } — see
 * src/model/model.js for how these are read and combined. Nothing in this
 * file computes a figure; it only holds the current value of each one.
 */

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

function defaultState() {
  const figures = {};
  for (const key of SECTION_6_KEYS) {
    figures[key] = { value: null, provenance: null };
  }

  return {
    ...figures,

    // Navigation / journey flags (build-spec.md section 1 and 2)
    journeyStarted: false,
    mode: null, // 'personalised' | 'estimate' | 'general'
    consentGiven: null,
    solveFor: null, // 'date' | 'amount'
    returnFrame: null,
    goalSaved: false,
    mipUnlocked: false,
    journeyPaused: false, // frame 10c "Save and leave" — build-spec.md section 1
    goal: null, // 'house' | 'other' — frame 06's "Is a house still your goal right now?" decision
    calculatorEntered: false,
    lisaCapBreached: false, // DECISIONS.md D6 — property-value > LISA_CAP_PROPERTY_VALUE, frame 09b
    ltvVideoSeen: false, // frame 13b (build-spec.md section 2's "video-unseen / video-seen" variant of frame 13's explainer row)

    // Frame 05 / 05b (What we can see) — build-spec.md section 1's "Toggle
    // the breakdown" row: breakdownOpen only, no figure changes.
    breakdownOpen: true,
    // Frame 06 (What we found) — same accordion pattern, its own toggle so
    // opening/closing one screen's disclosure doesn't affect the other's.
    summaryDisclosureOpen: true,

    // Frame 03 (Consent and linked accounts)
    savingsWithUs: null, // null | true | false — build-spec.md section 2's "none-selected" variant
    accountAssignments: {}, // accountId -> group, set by 03b moves (src/model/accounts.js)
    accountIncluded: {}, // accountId -> boolean, set by the "Select all accounts" row
    consentStatementChecked: true,
    selectedAccountId: null, // set before opening 03b

    // Frame 04 (Consent declined / general mode) — build-spec.md section 1's
    // "Drag either slider handle" / "Type into the estimated range field" rows.
    generalMonthlyLow: { value: null, provenance: null },
    generalMonthlyHigh: { value: null, provenance: null },

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

export function resetState() {
  state = defaultState();
  persist(state);
  return state;
}
