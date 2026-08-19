/**
 * All on-screen copy for "Your first home", in one file, so copy can be
 * edited without touching logic. This is the file to edit for wording
 * changes — nothing else in the codebase should contain a literal string a
 * participant reads.
 *
 * How to edit safely:
 *   - One top-level key per route, matching the route string in SPEC.md's
 *     regulatory anchor map / build-spec.md section 3 exactly (e.g. '/home').
 *   - Inside a route, keys are named for what the string IS on screen
 *     ("balanceLabel", "entryCardCta"), never for its position ("line1",
 *     "button2") — a layout change should never force a rename here.
 *   - `shared` holds copy reused across multiple routes: app-bar labels,
 *     common button labels, and `shared.regulatory`.
 *   - This file contains no logic: no functions, no conditionals, no
 *     computed values. Every value is a literal string (or a plain array/
 *     object of literal strings for repeating content like transaction
 *     rows). Anything computed belongs in src/model/ or src/format.js, not
 *     here.
 *
 * shared.regulatory is FIXED WORDING (SPEC.md, GAPS.md G24/G26/G28):
 * transcribed verbatim from the reference PNGs. Screens reference these
 * keys; they must not be reworded, paraphrased, or duplicated inline in a
 * screen module. If a regulatory line's wording ever needs to change, that
 * is a DECISIONS.md-level decision, not a routine copy edit.
 */

const content = {
  shared: {
    appBar: {
      backLabel: 'Back',
      closeLabel: 'Close',
    },
    regulatory: {
      guidanceNotAdvice:
        'This is guidance based on your account activity. It is not financial advice and does not take account of everything about your situation.',
      adviserScope: 'Our advisers only advise on our own mortgages.',
      mcob3aRepossessionWarning:
        "A mortgage is secured against your home. If you couldn't keep up the repayments, your home would be at risk.",
      estimateDisclosure:
        'This is an estimate based on the information we hold today. It is not an offer and your actual figures may be different.',
    },
  },

  '/home': {
    appBarTitle: 'Home',
    balanceLabel: 'Current account',
    balanceAmount: '£1,042.16',
    transactionGroups: [
      {
        heading: 'Today',
        rows: [
          { merchant: 'Tesco Superstore', category: 'Groceries', amount: '−£34.50' },
          { merchant: 'Trainline', category: 'Travel', amount: '−£8.20' },
        ],
      },
      {
        heading: 'Yesterday',
        rows: [
          { merchant: 'Salary', category: 'Monthly pay', amount: '+£2,240.00' },
          { merchant: 'Spotify', category: 'Subscriptions', amount: '−£11.99' },
        ],
      },
    ],
    seeAllTransactions: 'See all transactions',
    entryCardTitle: 'Thinking about buying a house?',
    entryCardBody:
      "See what buying your first home could actually look like, using what's already in your accounts.",
    entryCardCta: "See what's involved",
    bottomNav: {
      home: 'Home',
      payments: 'Payments',
      goals: 'Goals',
      insights: 'Insights',
      profile: 'Profile',
    },
  },

  '/journey': {
    appBarTitle: 'Your first home',
    illustrationCaption:
      'Diagram: three different routes rising from a single starting point to the same house, showing there is more than one way to get there',
    headline: "There's more than one route to your first home",
    body:
      "Wherever you're starting from, we'll work with the money you've already got – and explain everything as we go. Nothing left hanging.",
    goalsHeading: "What you'll get out of this",
    goalRows: [
      {
        title: 'Guidance built around your money',
        body: "Not general tips. Actual figures, worked out from what's already in your accounts.",
      },
      {
        title: 'The words lenders use, in plain English',
        body:
          'Loan-to-Value, Mortgage in Principle, and every other term that tends to get used at you rather than explained to you.',
      },
      {
        title: "A clear answer on whether you're ready",
        body: "No guessing. You'll know where you stand, and what would change it.",
      },
    ],
    infoBanner: 'Stop whenever you like. Nothing here is an application, and nothing gets sent to anyone.',
    primaryCta: "Show me what's possible",
    secondaryCta: 'Not right now',
  },

  '/consent': {
    appBarTitle: 'Using your accounts',
    headline: 'First, where do you keep your savings?',
    subhead: 'This changes how accurate we can be.',
    savingsQuestion: 'Are your main savings with us?',
    yesLabel: "Yes, they're with you",
    noLabel: "No, they're elsewhere",
    savingsHint: "If they're elsewhere, we can still help - we'll estimate and label anything we're not sure about.",
    usingWhatWeCanSeeHeading: 'Using what we can see',
    consentStatementTitle: 'Use my account information to work out what I could save and borrow.',
    consentStatementBody:
      'This covers your income and salary payments, your regular outgoings and direct debits, and the balances of the accounts you choose below. We use it only to work out your figures.',
    accountsCardHeader: 'Your accounts',
    accountsCardIntro: "We've had a guess at what each of these is for. Tap any account to change it - only you know.",
    selectAllLabel: 'Select all accounts',
    selectedCountOf: 'of',
    selectedCountSuffix: 'selected',
    groups: {
      unassigned: { header: 'Not sorted yet', subtitle: "We can't tell what this is for" },
      deposit: { header: 'Toward your deposit' },
      emergency: { header: 'Kept aside for emergencies' },
      excluded: { header: 'Not counted' },
    },
    sortThisOut: 'Sort this out',
    accountCaptions: {
      stocksIsaCaption: "Some people earmark this for a home, some don't. Tap to tell us.",
      lifetimeIsaCaption:
        "Mainly for buying a first home, so we've counted it. Move it if you're saving it for retirement instead.",
      emergencyFundCaption: 'About three months of your essential spending.',
      currentAccountCaption: 'Your everyday spending, not savings. Not included in the total above.',
    },
    estimateModeBanner:
      "Because your main savings are elsewhere, we'll estimate what we can't see and label it clearly.",
    fscsNote:
      'Savings held with us are protected by the Financial Services Compensation Scheme up to £120,000 per person, per authorised firm.',
    withdrawBanner: 'You can withdraw this permission at any time in Settings.',
    primaryCta: 'Agree and continue',
    secondaryCta: 'Not now',
  },

  '/consent/move-account': {
    heading: "What's this account for?",
    options: {
      deposit: { title: 'Toward my deposit', body: "We'll count it toward your house savings" },
      emergency: { title: 'My emergency fund', body: "We'll keep it aside and won't count it toward a deposit" },
      excluded: { title: 'Neither of those', body: "We'll leave it out of both" },
    },
    save: 'Save',
    cancel: 'Cancel',
  },

  '/consent/declined': {
    appBarTitle: 'Saving towards your first home',
    headline: 'A general picture, for now',
    body:
      "You can keep your account information private and still use this. We'll work from general figures, and you can switch to your own whenever you want.",
    monthlyHeading: 'What saving regularly could build up to',
    monthlySubhead: 'Move either end to try different amounts.',
    sliderCaption: 'Put aside each month',
    sliderAtBoundNote: "You've reached the edge of the suggested range.",
    rangeToLabel: 'to',
    lowerAmountLabel: 'lower amount',
    upperAmountLabel: 'upper amount',
    monthlyProvenanceEstimated: 'Published UK average, not worked out from your accounts',
    monthlyProvenanceEntered: 'Amount you set',
    annualCaption: 'After a year of putting that aside',
    annualProvenanceDerived: 'Worked out from the amount above',
    annualProvenanceEntered: 'Worked out from the amount you set',
    assumptionsCardHeader: "What we've assumed",
    assumptionsRows: [
      'You put the same amount aside each month',
      'You keep going for at least a year, which is usual for a goal like this',
      'No interest is included, so the real figure would be a little higher',
    ],
    switchBanner: "Turn on account access whenever you want, and we'll build this from your own money instead.",
    assumptionsLink: 'How did we work this out?',
    sourceCaption: 'Range based on typical monthly saving amounts in the UK, from the NatWest Savings Index 2026.',
    flagLabel: "Something doesn't look right",
    primaryCta: 'Continue with general figures',
    secondaryCta: 'I want to make it personalised',
  },
};

export default content;
