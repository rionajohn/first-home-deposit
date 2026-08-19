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
    stepper: {
      increaseLabel: 'Increase',
      decreaseLabel: 'Decrease',
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

  '/calculator/property': {
    appBarTitle: 'Deposit calculator',
    stepLabel: 'Step 1 of 3',
    headline: 'What sort of property are you thinking about?',
    propertyValueLabel: 'Likely property value',
    propertyValueHintEmpty: 'How much is the house likely to cost?',
    propertyValueHintFilled: "A rough figure is fine - you can change it later",
    propertyValueAriaLabel: 'Likely property value',
    areaAverageCaption: 'The average first-time-buyer property in your area is around {amount}.',
    depositQuestionHeading: 'How much would you put down?',
    comparisonHeaderText: 'What each one means',
    comparisonSublabelTemplate: '{pct} deposit',
    comparisonTechnicalTemplate: '{ltv} Loan-to-Value',
    ltvInfoLinkLabel: 'What is Loan-to-Value?',
    emptyStateCaption: "Enter a property value and we'll show you what each deposit %age would come to.",
    lisaCapBannerText: 'A Lifetime ISA can only be used for a home costing {cap} or less. Above that, taking the money out costs 25% of what you withdraw.',
    errorNonNumeric: "That doesn't look like a property value. Enter a whole number greater than zero.",
    flagLabel: "Something doesn't look right",
    primaryCta: 'Continue',
    secondaryCta: 'Save and exit',
  },

  '/calculator/saving': {
    appBarTitle: 'Deposit calculator',
    stepLabel: 'Step 2 of 3',
    headline: 'How would you like to work this out?',
    segmentMonthlyLabel: 'Set a monthly amount',
    segmentDateLabel: 'Set a target date',
    pickOneCaption: "Pick one and we'll work out the other.",
    sliderCaption: 'Put aside each month',
    sliderLowerAmountLabel: 'lower amount',
    sliderUpperAmountLabel: 'upper amount',
    sliderRangeCaptionTemplate: "{max} is what's left each month once your essentials are covered. {suggested} is what you've been putting aside lately.",
    dateStepperHint: "We'll work out what you'd need to put aside each month",
    dateStepperMonthAriaLabel: 'target month',
    dateStepperYearAriaLabel: 'target year',
    filledInHeading: 'Already filled in from your accounts',
    savingsInterestLabel: 'Savings interest rate',
    savingsInterestSuffix: 'AER',
    savingsInterestCaption: 'Read from your instant saver. AER means Annual Equivalent Rate.',
    taxRateLabel: 'Tax rate',
    taxRateValue: 'Basic rate',
    taxRateCaption: 'Worked out from your salary',
    changeLabel: 'Change',
    provenanceKeyLabel: 'How we worked these out',
    interestBannerText: 'Interest is included in the estimate. Rates can change.',
    flagLabel: "Something doesn't look right",
    errorExceedsLeftOver: "That's more than what's left over each month. Choose a smaller range.",
    errorPastDate: 'Pick a date in the future.',
    primaryCta: 'Continue',
    secondaryCta: 'Save and exit',
  },

  '/calculator/exit': {
    heading: 'Leave this for now?',
    body: "We'll save what you've entered so you can pick it up where you left off.",
    primaryCta: 'Save and leave',
    secondaryCta: 'Keep going',
  },

  '/calculator/review': {
    appBarTitle: 'Deposit calculator',
    stepLabel: 'Step 3 of 3',
    headline: 'Check these before we work it out',
    propertyValueLabel: 'Property value',
    enteredCaption: 'You entered this',
    depositPctLabel: 'Deposit %age',
    savedSoFarLabel: 'Saved so far',
    savedSoFarCaption: 'Read from the accounts you assigned to your deposit',
    monthlySavingLabel: 'Monthly saving',
    monthlySavingCaption: 'The range you set',
    savingsInterestLabel: 'Savings interest rate',
    savingsInterestCaption: 'Read from your instant saver. AER means Annual Equivalent Rate.',
    taxRateLabel: 'Tax rate',
    taxRateValue: 'Basic rate',
    taxRateCaption: 'Worked out from your salary',
    changeLabel: 'Change',
    provenanceKeyLabel: 'How we worked these out',
    noteBannerText: "Changing anything here won't change your savings goal until you choose to update it.",
    flagLabel: "Something doesn't look right",
    primaryCta: 'See what this means',
    secondaryCta: 'Save and exit',
  },

  '/calculator/result': {
    appBarTitle: 'Your results',
    headlineTemplate: 'A deposit on a {property} home could be {low} to {high}',
    rangeCaptionTemplate: 'Depending on whether you put down {lowPct} or {highPct}',
    goalTrackLabelTemplate: 'Your goal - {target}',
    provenanceCaption: "Worked out from what you've set aside and what you're putting away",
    assumptionsLinkLabel: 'How did we work this out?',
    timingWithinTemplate: '{pct} - within {months}',
    timingRangeTemplate: '{pct} - {low} to {high}',
    timingAlreadyTemplate: "{pct} - you've already saved this",
    provenanceKeyLabel: 'How we worked these out',
    chartHeading: 'How your savings would build up',
    chartCaptionTemplate: 'With interest at {aer} AER. Illustrative.',
    thresholdLabelTemplate: '{pct} - {amount}',
    xAxisNow: 'Now',
    legendTemplate: 'At {amount} a month',
    yAxisFloor: '£0',
    beyondWindowNote: 'This could take more than 5 years at your current rate - the chart shows progress to 5 years.',
    whyBiggerHeading: 'Why a bigger deposit helps',
    benefitRows: [
      {
        label: 'You borrow less',
        bodyTemplate: '{amount} less at {highPct} than at {lowPct}',
        caption: 'So there is less to pay back, and less interest on it',
      },
      {
        label: 'Lenders offer better rates',
        body: 'Rates improve at each step down in Loan-to-Value',
        caption: 'The rate is set by how much of the property you are borrowing',
      },
      {
        label: 'More lenders will consider you',
        body: 'Fewer deals are available above 90% Loan-to-Value',
        caption: 'A larger deposit widens the choice',
      },
    ],
    ltvInfoLinkLabel: 'What is Loan-to-Value?',
    assumptionsBannerText: "These figures assume your saving stays the same and rates don't change.",
    howWeWorkedTitle: 'How we worked this out',
    howWeWorkedIntro: "We worked this out from what's already in your accounts, so you didn't have to fill anything in.",
    seeHowWeWorkedLabel: 'See how we worked this out',
    flagLabel: "Something doesn't look right",
    primaryCta: 'See what this means for borrowing',
    unreachableHeadline: 'Nothing being put aside yet',
    unreachableBody: 'Add a monthly amount or a target date to see your deposit range.',
    unreachableCta: 'Set an amount',
  },

  '/learn/ltv': {
    appBarTitle: 'Loan-to-Value',
    headline: "Loan-to-Value decides the rate you're offered",
    assumptionsLinkLabel: 'How did we work this out?',
    body:
      "It's the share of the property price you'd be borrowing. Put down more, and you borrow a smaller share - which lenders treat as less risky, so they offer a better rate.",
    depositPartLabel: 'Your deposit',
    depositPartCaptionTemplate: '{pct} of the price',
    mortgagePartLabel: 'Mortgage',
    mortgagePartCaptionTemplate: '{pct} of the price - this is your Loan-to-Value',
    comparisonHeading: 'What that looks like at three deposits',
    tableDepositRowLabel: 'Deposit',
    tableLtvRowLabel: 'Loan-to-Value',
    tableRateRowLabel: 'Typical rate',
    tableMonthlyRowLabel: 'Monthly',
    tableInterestRowLabelTemplate: 'Interest, {years} yrs',
    bannerTextTemplate:
      "Between the first column and the last, that's about {monthlyDiff} a month, and around {interestDiff} over {years} years.",
    balancingParagraph:
      'Waiting to save a bigger deposit has costs too - you carry on renting, prices could move, and your circumstances could change. A bigger deposit is not automatically the right call.',
    comparisonCaptionTemplate: 'Illustrative figures on a {years}-year repayment mortgage at typical market rates. Not an offer.',
    rateCautionText:
      "These are typical market ranges, not rates we're offering you. The rate any lender offers depends on their checks and your circumstances.",
    explainerHeading: 'Want more on this?',
    explainerVideoTitle: 'Watch: what Loan-to-Value means',
    explainerVideoDuration: '1 min 20',
    explainerWatchedLabel: 'Watched',
    explainerDiagramTitle: 'See it as a diagram',
    explainerDiagramDurationTemplate: 'The same {property} home at 95%, 90% and 85%',
    howWeWorkedTitle: 'How we worked this out',
    howWeWorkedIntro: "We worked this out from what's already in your accounts, so you didn't have to fill anything in.",
    seeHowWeWorkedLabel: 'See how we worked this out',
    flagLabel: "Something doesn't look right",
    primaryCta: 'Got it',
  },

  '/learn/ltv/video': {
    videoTitle: 'What Loan-to-Value means',
    videoDuration: '1 min 20',
    captionsLabel: 'Captions',
    transcriptLabel: 'Transcript',
    shortVersionHeading: 'The short version',
    shortVersionBody:
      "Loan-to-Value is the share of a property's price that comes from a mortgage, shown as a %. If you put down a bigger deposit, your Loan-to-Value is lower, and lenders usually offer better interest rates.",
    visualAidLabel: '[Visual aid]',
    visualAidCaptionTemplate:
      'Diagram: the same {property} property at 95%, 90% and 85% Loan-to-Value, showing the deposit block growing and the loan block shrinking',
    infoBannerText: 'This stays in your Explainers list, so you can come back to it.',
    flagLabel: "Something doesn't look right",
    primaryCta: 'Got it',
  },

  '/tracker': {
    appBarTitle: 'Your deposit',
    savedCaption: 'Read from the accounts you assigned to your deposit',
    goalCaptionTemplate: 'of your {target} deposit goal',
    checkpointProgressLabel: 'Checkpoint',
    belowCheckpointBodyTemplate: "You're {gap} away from the point where checking a Mortgage in Principle starts to be useful.",
    checkpointReachedBodyTemplate:
      "You've passed the {pct} checkpoint. You can now check whether a Mortgage in Principle is likely to be approved.",
    goalMetBody:
      "You've saved your full deposit goal. You can check whether a Mortgage in Principle is likely to be approved whenever you're ready.",
    accountsLinkedTitle: 'Accounts linked',
    accountsLinkedBody: "Done in a couple of taps, no form to fill in. That's how we know your real numbers.",
    accountsSortedTitle: 'Accounts sorted',
    accountsSortedBodyTemplate: "You told us what each one's for. {amount} counted toward your deposit.",
    goalSetTitle: 'Deposit goal set',
    goalSetBodyTemplate: "{target}, a {pct} deposit on a {property} home. Now it's just saving.",
    mipTitle: 'Mortgage in Principle',
    mipLockedBodyTemplate: 'Unlocks at {checkpoint}. {gap} to go.',
    mipUnlockedBody: "Unlocked. Whenever you're ready.",
    unlocksAtTemplate: 'Unlocks at {checkpoint}',
    readyToCheckLabel: 'Ready to check',
    ratesCardHeading: 'What rates are like at this Loan-to-Value',
    ratesCaptionTemplate: 'Typical market rates at {ltv} Loan-to-Value',
    ratesDisclosureText: 'Subject to further checks and your individual circumstances. Not an offer.',
    rateCautionText:
      "These are typical market ranges, not rates we're offering you. The rate any lender offers depends on their checks and your circumstances.",
    rateBandDepositCaptionTemplate: '{pct} deposit',
    assumptionsLinkLabel: 'How did we work this out?',
    thisMonthHeading: 'This month',
    savedLabel: 'Saved',
    savedRowCaption: 'Read from your transfers this month',
    interestLabel: 'Interest earned',
    interestRowCaption: 'Read from your savings accounts',
    onTrackLabel: 'On track for',
    onTrackCaption: "Worked out from what you're putting aside each month",
    provenanceKeyLabel: 'How we worked these out',
    flagLabel: "Something doesn't look right",
    belowCheckpointCta: 'Adjust my goal',
    checkpointReachedCta: 'Check my Mortgage in Principle',
    lockedRowAriaSuffix: 'locked',
  },
};

export default content;
