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

  '/position': {
    appBarTitle: 'What we can see',
    headline: "Here's what we worked out",
    body: 'This all comes from your accounts. Change anything that looks wrong.',
    estimateModeBanner: 'Your main account is with another bank, so some of these are estimates',
    figureCaption: 'Left over each month',
    figureAriaLabel: 'Left over each month, editable',
    disclosureTitlePrefix: 'How we got to',
    disclosureTitlePrefixEstimate: 'How we estimated',
    proportions: {
      essentialsLabel: 'Essentials',
      leftOverLabel: 'Left over',
      ofWhatComesIn: 'of what comes in',
    },
    moneyInLabel: 'Money in',
    moneyInCaption: 'Read from your salary payments over the last 12 months',
    essentialSpendingLabel: 'Essential spending',
    essentialSpendingCaption: 'Worked out from your direct debits, standing orders and card payments',
    missedLabel: 'What we might have missed',
    missedValue: 'Anything paid from your main account with the other bank',
    provenanceKeyLabel: 'How we worked these out',
    whereFiguresLabel: 'Where these figures come from',
    flagLabel: "Something doesn't look right",
    enteredCaption: 'Amount you set',
    errorNotPositive: "That doesn't leave anything to save each month. Adjust the figure above.",
    errorExceedsMoneyIn: "That's more than what comes in each month. Enter a smaller amount.",
    primaryCta: 'Looks right',
  },

  '/position/summary': {
    appBarTitle: 'Where you stand',
    headline: "Here's where you're at",
    body: 'We had a look at your accounts. This is the picture.',
    emergencyCoveredHeadline: 'Emergency fund: covered',
    emergencyCoveredBody:
      "You've got {amount} set aside, which is about three months of your essential spending. That's the part people tend to put off, and yours is already done. We won't count it toward a deposit.",
    emergencyShortHeadline: 'Emergency fund: still building',
    emergencyShortBody:
      "You've got {amount} set aside so far. That's less than three months of your essential spending, but it's not counted toward a deposit either way, so it won't hold up what's below.",
    heldInLabel: 'Held in',
    depositOnWayHeadline: 'House deposit: on your way',
    depositOnWayBody:
      "You've told us which accounts are for a deposit. Between them, that's {amount} – quietly building while you got on with things.",
    savedTowardDepositLabel: 'Saved toward a deposit',
    savedTowardDepositCaption: 'Read from the accounts you assigned to your deposit',
    lisaCaption: 'Usable for a home costing {cap} or less, once the account has been open 12 months.',
    oneLeftToSort: 'One left to sort',
    manyLeftToSort: '{count} left to sort',
    onlyYouKnowCaption: "Only you know what this one's for.",
    tellUsLabel: "Tell us what it's for",
    noAccountsHeadline: 'Nothing set aside yet',
    noAccountsBody:
      "You haven't assigned any accounts toward a deposit yet. Choose which ones count, and we'll track it from here.",
    noAccountsCta: 'Choose accounts',
    assumptionsLinkLabel: 'How did we work this out?',
    disclosureTitle: 'What we used to check this',
    proportions: {
      essentialsLabel: 'Essentials',
      leftOverLabel: 'Left over',
      ofWhatComesIn: 'of what comes in',
    },
    moneyInLabel: 'Money in',
    moneyInCaption: 'Read from your salary payments over the last 12 months',
    essentialSpendingLabel: 'Essential spending',
    essentialSpendingCaption: 'Worked out from your direct debits, standing orders and card payments',
    leftOverEachMonthLabel: 'Left over each month',
    leftOverEachMonthCaption: 'Worked out from your salary and your regular spending',
    provenanceKeyLabel: 'How we worked these out',
    calculatorNote:
      "How much you put aside each month is entirely your call. You'll set that in the deposit calculator, where you can see what each amount would mean.",
    howWeWorkedTitle: 'How we worked this out',
    howWeWorkedIntro: "We worked this out from what's already in your accounts, so you didn't have to fill anything in.",
    whatWeRead: {
      label: 'What we read',
      value: 'Your salary and your regular payments',
      caption: 'The last 12 months',
    },
    whatWeWorkedOut: {
      label: 'What we worked out',
      value: '{essential} essential spending, {leftOver} left over',
      caption: 'From your direct debits, standing orders and card payments',
    },
    whatWeAssumed: {
      label: 'What we assumed',
      value: 'That last year is typical of this year',
      caption: "If your income or outgoings have changed, tell us and we'll redo it",
    },
    seeHowWeWorkedLabel: 'See how we worked this out',
    flagLabel: "Something doesn't look right",
    decisionHeadline: 'Is a house still your goal right now?',
    decisionBody: "Plans change, and that's fine. You can switch this later.",
    primaryCta: 'Yes, keep going',
    secondaryCta: 'Not right now - save for something else',
  },

  '/goal-check': {
    appBarTitle: 'Your first home',
    headline: 'Next: work out your deposit',
    body: "How much you'll need depends on the sort of place you're after, and on how much of it you want to put down.",
    alreadyKnowHeading: 'What we already know',
    savedTowardDepositLabel: 'Saved toward a deposit',
    savedTowardDepositCaption: 'Read from the accounts you assigned to your deposit',
    leftOverEachMonthLabel: 'Left over each month',
    leftOverEachMonthCaption: 'Worked out from your salary and your regular spending',
    savingsInterestLabel: 'Savings interest',
    savingsInterestSuffix: 'AER (Annual Equivalent Rate)',
    provenanceKeyLabel: 'How we worked these out',
    assumptionsLinkLabel: 'How did we work this out?',
    handoffHeading: 'The calculator asks you two things',
    propertyRowLabel: "The sort of property you're after",
    propertyRowCaption: 'A rough price is fine',
    depositRowLabel: 'How much you want to put down',
    depositRowCaption: "We'll show what each % means",
    everythingElseLabel: 'Everything else',
    everythingElseCaption: 'Already filled in from your accounts',
    openCalculatorCta: 'Open the deposit calculator',
    flagLabel: "Something doesn't look right",
    primaryCta: 'Not now, just track my goal',
  },
};

export default content;
