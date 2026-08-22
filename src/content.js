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
 * ONE EXCEPTION to the literal-strings rule: the app display name is read
 * from src/config.js rather than typed here, so the name lives in exactly
 * one place across index.html, the manifest and these screens. It is used
 * ONLY where the string IS the product name (an app-bar title). Where the
 * words "your first home" appear inside a sentence — the /home entry card
 * and the /journey headline — they are English prose, not the name, and stay
 * literal: substituting a variable there would break the sentence the moment
 * the name changed.
 *
 * shared.regulatory is FIXED WORDING (SPEC.md, GAPS.md G24/G26/G28):
 * transcribed verbatim from the reference PNGs. Screens reference these
 * keys; they must not be reworded, paraphrased, or duplicated inline in a
 * screen module. If a regulatory line's wording ever needs to change, that
 * is a DECISIONS.md-level decision, not a routine copy edit.
 */

import config from './config.js';

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
      // NOT the estimate-mode line. Frame 05b carried it conditionally and
      // frame 04 carried it always, and both of those are gone, but frames
      // 12, 20 and 21 carry it unconditionally and always have - it is about
      // a figure being an estimate rather than an offer, not about where
      // savings are held. Kept, and kept at four keys, per SPEC.md.
      estimateDisclosure:
        'This is an estimate based on the information we hold today. It is not an offer and your actual figures may be different.',
    },

    // WHERE THE FIGURES COME FROM, AND WHO CAN CHANGE THAT. Rendered on
    // frame 03, where the accounts and their balances are on screen, and on
    // frame 33, so the answer is in the same place a participant would go
    // looking for it. Shared rather than written twice: two copies of a
    // sourcing statement is exactly the pair that drifts.
    //
    // It replaced `'/consent'.withdrawBanner` ("You can withdraw this
    // permission at any time in Settings"), which was written to sit under a
    // consent statement and lost its antecedent when that statement was
    // deleted (DECISIONS.md D28) - "this permission" named a box the
    // participant had just ticked, and there is no box now.
    //
    // It is NOT a regulatory line and is deliberately not in
    // `shared.regulatory`: it makes no claim about advice, suitability or
    // protection. It says where the numbers came from and where the setting
    // is. Settings is not reachable in this prototype (GAPS.md G23), which
    // is the point of naming it rather than linking it.
    dataSource:
      'These figures come from your accounts, and you can change that permission in Settings.',

    // Repeated verbatim on frames 18, 19, 20 and 21 (Figma's own "Regulatory
    // / Risk warning" component, "not a mortgage offer" variant) — not one
    // of the four fixed regulatory.* keys above (SPEC.md fixes that object's
    // shape), but still copy shared across 4 routes rather than
    // inline-duplicated four times.
    mipAgreementNotOffer:
      'An agreement in principle is not a mortgage offer. It is usually valid for 90 days and is subject to further checks.',

    // Bank tab bar. Drawn on frame 01 only in the reference set; DECISIONS.md
    // D11 keeps it on every full-screen journey screen too, so the labels
    // moved here from '/home' rather than being duplicated per screen. The
    // ariaLabel/homeTabLabel pair is what a screen reader announces for the
    // one tab that actually navigates.
    bottomNav: {
      ariaLabel: 'Primary',
      homeTabHint: 'Back to Home',
      goalsTabHint: 'Your goals',
      home: 'Home',
      payments: 'Payments',
      goals: 'Goals',
      insights: 'Insights',
      profile: 'Profile',
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
  },

  '/journey': {
    appBarTitle: config.name,
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
    // THE SCREEN NAMES WHAT IT IS FOR, NOT A DECISION.
    //
    // It used to be "Using your accounts", above the question "First, where
    // do you keep your savings?" - a title and a headline that both existed
    // to frame a choice about whether and how the bank could look. There is
    // no choice here now (DECISIONS.md D28), so the title names the thing on
    // the screen and the headline asks for the one input that is still real:
    // what each account is for.
    appBarTitle: 'Your accounts',
    headline: 'What is each account for?',
    subhead: 'We add up the accounts you count here to work out what you have saved so far.',
    accountsCardHeader: 'Your accounts',
    accountsCardIntro: "We've had a guess at what each of these is for. Tap any account to change it - only you know.",
    selectAllLabel: 'Select all accounts',
    // Each account's own checkbox is a bare box beside the row, so the input
    // carries this as its aria-label — without it a screen reader announces
    // five checkboxes all called nothing. {account} is the account name.
    accountSelectLabelTemplate: 'Count {account} toward your deposit',
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
    fscsNote:
      'Savings held with us are protected by the Financial Services Compensation Scheme up to £120,000 per person, per authorised firm.',
    primaryCta: 'Continue',
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

  '/position': {
    appBarTitle: 'What we can see',
    headline: "Here's what we worked out",
    body: 'This all comes from your accounts. Change anything that looks wrong.',
    figureCaption: 'Left over each month',
    figureAriaLabel: 'Left over each month, editable',
    disclosureTitlePrefix: 'How we got to',
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
    // "STILL" PRESUMED THE GOAL HAD ALREADY BEEN STATED.
    //
    // Two paths reach this card and only one of them has said anything about
    // a house: the journey proper, and a participant who arrived cold from
    // /goals (DECISIONS.md D22) and has been asked about a house exactly
    // never. "Still" made the second one a question about a commitment they
    // could not remember making.
    //
    // IT HAS TO STAY A REAL QUESTION. Its "no" is not a dead end — it routes
    // to /goals, the bank's own goals area (D21) — so the wording must leave
    // "no" genuinely open rather than framing it as abandoning something.
    // Dropping "still" does that on its own: the question becomes about what
    // they want now, which both paths can answer from a standing start.
    //
    // The live wording also pairs with the answers below it. It asks what
    // they want to SAVE FOR; the secondary answers "save for something
    // else". Question and answer share a verb, so the alternative is stated
    // rather than implied.
    decisionHeadline: 'Is a house what you want to save for?',

    // Alternative, kept live in the file so a swap is a one-line move.
    //
    // Keeps the temporal framing the original had in "right now" — which is
    // what makes "Not right now" a natural answer — without "still" carrying
    // a prior commitment into it:
    // decisionHeadline: 'Is a house the right goal for you now?',

    decisionBody: "Plans change, and that's fine. You can switch this later.",
    primaryCta: 'Yes, keep going',
    secondaryCta: 'Not right now - save for something else',
  },

  // The bank's own goals area, not part of "Your first home" — so the app-bar
  // title is the bank's word for the section, not config.name, and there is no
  // journey framing anywhere on the screen. The one link INTO the feature is
  // `houseCardCta` below, which is the same job frame 01's entry card does.
  '/goals': {
    appBarTitle: 'Goals',
    headline: 'Your goals',
    body: "What you're putting money aside for, and how each one is doing.",
    shortTermHeading: 'Short-term goals',
    shortTermCaption: 'Things you are saving for now',
    longTermHeading: 'Long-term goals',
    longTermCaption: 'The bigger ones, further out',
    savedLabel: 'Saved so far',
    emptySectionBody: 'Nothing here yet.',
    // THE CARD TITLE — ONE WORDING, WHATEVER THE STATE.
    //
    // The routing behind this card branches on whether the journey is under
    // way (goals.js, DECISIONS.md D22); the copy deliberately does not. Most
    // participants meet this card having never opened the feature, and a
    // title that changed under them between two visits would be a second
    // thing to notice on a screen whose job is to be unremarkable.
    //
    // It replaces "Want to calculate the deposit for your house?", which
    // presumed a house the participant does not have. Note that frame 01's
    // own entry card already gets this right — "Thinking about buying a
    // house?", indefinite article — so the register was set, not invented.
    //
    // Two constraints on any replacement, both worth stating because they
    // are easy to break:
    //   - It sits directly above "House pot GBP 3,150" in the same section.
    //     A title asking whether they are thinking about a home reads oddly
    //     beside a pot they have evidently already opened for one, which is
    //     why the live wording asks about the DEPOSIT rather than about the
    //     intention.
    //   - It must not echo `houseCardBody` below. "need", "take", "work out"
    //     and "accounts" are all spoken for one line later.
    houseCardTitle: 'What would a deposit actually involve?',

    // Alternatives, kept live in the file so a swap is a one-line move.
    //
    // Closest to frame 01's entry card in construction, and the warmest of
    // the three. Leaves the deposit entirely to the body and the CTA:
    // houseCardTitle: 'Thinking about a first home?',
    //
    // Explicitly second person, and pitched at someone who has not begun —
    // "where to start" says beginner without saying beginner:
    // houseCardTitle: 'Where do you start with a deposit?',

    houseCardBody:
      "We'll work out what you'd need and how long it could take, using what's already in your accounts.",
    houseCardCta: 'Work out my deposit',
  },

  '/goal-check': {
    appBarTitle: config.name,
    headline: 'Next: work out your deposit',
    body: "How much you'll need depends on the sort of place you're after, and on how much of it you want to put down.",
    alreadyKnowHeading: 'What we already know',
    savedTowardDepositLabel: 'Saved toward a deposit',
    savedTowardDepositCaption: 'Read from the accounts you assigned to your deposit',
    leftOverEachMonthLabel: 'Left over each month',
    leftOverEachMonthCaption: 'Worked out from your salary and your regular spending',
    savingsInterestLabel: 'Savings interest',
    savingsInterestSuffix: 'AER (Annual Equivalent Rate)',
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
    // "THE house" ASSUMED A PROPERTY THE PARTICIPANT HAS NOT GOT.
    //
    // This is the hint on frame 09a — the empty state, where by definition
    // nothing has been entered and nothing has been chosen. It sat directly
    // under a neutral label ("Likely property value") and beside a neutral
    // filled-state hint, so it was the only string on its own screen making
    // that assumption.
    //
    // The live wording is the minimum change that fixes it: an indefinite
    // article, and the label's own two words — "property" and "likely" —
    // reused rather than a third vocabulary introduced one line below it.
    propertyValueHintEmpty: 'How much is a property likely to cost?',

    // Alternative, kept live in the file so a swap is a one-line move.
    //
    // Warmer, and leans on the headline directly above ("What sort of
    // property are you thinking about?") rather than restating the label:
    // propertyValueHintEmpty: 'Roughly what would a place like that cost?',

    propertyValueHintFilled: "A rough figure is fine - you can change it later",
    propertyValueAriaLabel: 'Likely property value',
    areaAverageCaption: 'The average first-time-buyer property in your area is around {amount}.',
    depositQuestionHeading: 'How much would you put down?',
    comparisonHeaderText: 'What each one means',
    comparisonSublabelTemplate: '{pct} deposit',
    // Read out after the selected row's own figures, never drawn. The box
    // outline marks the row for anyone who can see it; this is the same fact
    // in text, so selection is not carried by the outline alone.
    comparisonSelectedLabel: 'Selected. This is the figure the rest of this screen uses.',
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
    assumptionsLinkLabel: 'How we worked out the deposit range',
    timingWithinTemplate: '{pct} - within {months}',
    timingRangeTemplate: '{pct} - {low} to {high}',
    timingAlreadyTemplate: "{pct} - you've already saved this",
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
    seeHowWeWorkedLabel: 'How we worked out your monthly saving',
    flagLabel: "Something doesn't look right",
    primaryCta: 'See what this means for borrowing',
    unreachableHeadline: 'Nothing being put aside yet',
    unreachableBody: 'Add a monthly amount or a target date to see your deposit range.',
    unreachableCta: 'Set an amount',
  },

  '/learn/ltv': {
    appBarTitle: 'Loan-to-Value',
    headline: "Loan-to-Value decides the rate you're offered",
    assumptionsLinkLabel: 'How we worked out these rate figures',
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
    seeHowWeWorkedLabel: 'How we worked out your monthly saving',
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
    accountsLinkedBody: 'Connected already, so we work from your real figures rather than a form you fill in.',
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
    assumptionsLinkLabel: 'How we worked out these rate figures',
    thisMonthHeading: 'This month',
    savedLabel: 'Saved',
    savedRowCaption: 'Read from your transfers this month',
    interestLabel: 'Interest earned',
    interestRowCaption: 'Read from your savings accounts',
    onTrackLabel: 'On track for',
    onTrackCaption: "Worked out from what you're putting aside each month",
    provenanceKeyLabel: 'How we worked out your monthly saving',
    flagLabel: "Something doesn't look right",
    // Below the checkpoint the primary action is guidance, not the Mortgage
    // in Principle route (which is genuinely not open yet) and not a step
    // backwards into the calculator. "Adjust my goal" stays available as the
    // secondary. See DECISIONS.md D25.
    belowCheckpointCta: 'What a bigger deposit changes',
    belowCheckpointSecondaryCta: 'Adjust my goal',
    checkpointReachedCta: 'Check my Mortgage in Principle',
    lockedRowAriaSuffix: 'locked',
  },

  '/mip': {
    appBarTitle: 'Mortgage in Principle',
    headline: 'Mortgage in Principle',
    body: "You've saved three quarters of your deposit, so this is now open to you.",
    whatThisStepDoesHeading: 'What this step does',
    tickRows: [
      'Shows how much a lender might be willing to lend you',
      "Tells estate agents you're a credible buyer",
      "Doesn't commit you to anything",
    ],
    learnMoreLabel: 'What does a Mortgage in Principle (MIP) mean?',
    primaryCta: 'Start the check',
    secondaryCta: 'Not right now',
    // build-spec.md section 2's "locked" variant (DECISIONS.md D7 fallback,
    // "reached only by deep link" — no wireframe drawn).
    lockedHeadline: 'Not unlocked yet',
    lockedBody:
      "This unlocks once you've saved three quarters of your deposit. Keep an eye on your progress on the tracker.",
    lockedCta: 'Back to my deposit',
  },

  '/mip/about': {
    appBarTitle: 'Mortgage in Principle',
    videoTitle: 'What a Mortgage in Principle is',
    videoDuration: '1 min 45',
    captionsLabel: 'Captions',
    transcriptLabel: 'Transcript',
    shortVersionHeading: 'The short version',
    shortVersionBody:
      'A Mortgage in Principle is an indication of how much a lender might be willing to lend you, based on your income and outgoings. It is not a commitment from the lender or from you.',
    visualAidLabel: '[Visual aid]',
    visualAidCaption:
      'Timeline: Mortgage in Principle, then offer on a property, then full mortgage application, then formal offer - showing where in the process this sits',
    whatItIsNotHeading: 'What it is not',
    notRows: [
      { title: 'Not an application', caption: 'It does not start a mortgage application or commit you to one' },
      { title: 'Not a guarantee', caption: 'A lender can still say no after a full application and credit check' },
      { title: 'Not a credit agreement', caption: 'No money changes hands and no contract is created' },
    ],
    infoBannerText: 'This stays in your Explainers list, so you can come back to it.',
    primaryCta: 'Got it',
  },

  '/mip/pre-check': {
    appBarTitle: 'Mortgage in Principle',
    headline: 'Before you run the check',
    alreadyGotHeading: "We've already got",
    salaryLabel: 'Annual salary before tax',
    salaryCaption: 'From your salary payments',
    incomeLabel: 'Monthly income after tax',
    outgoingsLabel: 'Regular outgoings',
    outgoingsCaption: 'From your direct debits and standing orders',
    creditLabel: 'Existing credit commitments',
    creditCaptionTemplate: '{amount} a month',
    creditNote: "A lender counts this separately. It's already taken off the income figure above.",
    depositLabel: 'Deposit saved',
    depositCaption: 'Across the accounts you assigned to your deposit',
    expectHeading: "Here's what to expect",
    expectRows: [
      { label: 'How long it takes', value: 'About 10 minutes' },
      { label: 'Credit check', value: 'A soft search only' },
      { label: 'How long the result lasts', value: 'Usually 90 days' },
    ],
    softSearchWarning: 'This is a soft credit search. It will not affect your credit score and other lenders cannot see it.',
    askedHeading: "What you'll still be asked",
    askedRows: [
      'Whether anyone is buying with you',
      'Whether your income includes bonus or overtime',
      'Where your deposit is coming from',
      "The kind of property you're looking at",
    ],
    benefitsHeading: 'What having one can do for you',
    benefitsRows: ['Credibility with estate agents', 'Knowing your budget before you view', 'Speed at full application', 'No cost'],
    awareHeading: 'What to be aware of',
    awareRows: [
      'It expires after around 90 days',
      'It is not binding on the lender',
      'A full application involves a hard credit check that does affect your credit file',
      'The figure changes if your circumstances change',
    ],
    primaryCta: 'Start the check',
    secondaryCta: 'Not right now',
    // build-spec.md section 2's "incomplete" variant (DECISIONS.md D7
    // fallback — no wireframe drawn): shown in place of a held figure's
    // value when it was never read from an account (general mode).
    incompleteValue: 'Not on file',
    incompleteCaption: "We couldn't read this from your accounts. Add it yourself before running the check.",
  },

  '/mip/running': {
    appBarTitle: 'Mortgage in Principle',
    title: 'Checking your details',
    body: 'This is a soft credit search and will not affect your credit score.',
    caption: 'This usually takes a few seconds',
  },

  '/mip/result/likely': {
    appBarTitle: 'Your result',
    resultHeadline: "You'd likely be seen as a serious buyer",
    resultBody: 'Based on your salary, deposit and commitments, a lender could be willing to lend in this range.',
    rangeCaption: 'Indicative borrowing range',
    rangeTrackLabel: 'With your current deposit',
    propertyUpToLabelTemplate: "With your {deposit} deposit, that's a property up to",
    ltvLabel: 'Loan-to-Value',
    ltvValueTemplate: 'around {ltv}',
    basedOnLabel: 'Based on',
    basedOnValue: 'Salary, deposit and commitments',
    nextStepsTitle: 'What you could do next',
    step1Title: 'Keep saving to lower your Loan-to-Value',
    step1Caption: "A larger deposit could improve the rate you're offered",
    step2Title: 'Talk to someone about it',
    step2Caption: "Message us in the app and we'll connect you with a mortgage adviser today",
    howWeWorkedTitle: 'How we worked this out',
    seeHowWeWorkedLabel: 'See how we worked this out',
    automatedNote:
      'This estimate was worked out automatically. You can tell us if you disagree with it, and you can ask us to have a person review it.',
    flagLabel: "Something doesn't look right",
    primaryCta: 'Start my Mortgage in Principle',
    secondaryCta: 'Keep saving for now',
  },

  '/mip/result/not-yet': {
    appBarTitle: 'Your result',
    resultHeadline: "You're not quite there yet",
    resultBody:
      "Based on what we can see today, the amount you'd need to borrow is above what a lender would typically offer. That changes as you keep saving.",
    gapCaption: 'The estimated gap at your current property target',
    needBorrowLabel: "What you'd need to borrow",
    lenderOfferLabel: 'What a lender would typically offer',
    lenderOfferValueTemplate: 'around {amount}',
    basedOnLabel: 'Based on',
    basedOnValue: 'salary, deposit and commitments',
    nextStepsTitle: 'What you could do next',
    step1TitleTemplate: 'Save around {amount} more toward your deposit',
    step1CaptionTemplate: 'Around {months} at your current rate',
    step2TitleTemplate: 'Look at a property target closer to {amount}',
    step2Caption: 'Would close the gap now',
    step3Title: 'Talk to someone about it',
    step3Caption: "Message us in the app and we'll connect you with a mortgage adviser today",
    howWeWorkedTitle: 'How we worked this out',
    seeHowWeWorkedLabel: 'See how we worked this out',
    automatedNote:
      'This estimate was worked out automatically. You can tell us if you disagree with it, and you can ask us to have a person review it.',
    flagLabel: "Something doesn't look right",
    primaryCta: 'Update my savings goal',
    secondaryCta: 'See what changes this',
  },

  // No reference PNG, no Figma node — SPEC.md's own new screen this session
  // adds outside the reference set (D8/D10): a terminal stub for the
  // adviser-contact request. Request logged, no form, no booking calendar.
  '/mip/adviser': {
    appBarTitle: 'Talk to an adviser',
    headline: "We'll connect you with an adviser",
    body: "We've logged your request. A mortgage adviser will message you in the app to arrange a time that works for you.",
    confirmationLabel: 'Request sent',
    primaryCta: 'Done',
  },

  '/assumptions/saving': {
    heading: 'How we worked this out',
    intro: 'These figures are illustrative. They show what could happen if the assumptions below hold, not what will happen.',
    assumptionsHeading: 'What we assumed',
    assumptionsRowsBeforeInterest: [
      'You keep saving the same amount each month',
      'You pay in at the start of each month',
      'Your income and essential outgoings stay roughly as they are now',
    ],
    interestAssumptionTemplate: 'Interest is paid at {rate} AER, based on the {source}, and compounds monthly',
    assumptionsRowsAfterInterest: ["We've used the last 12 months of your account activity as the starting point"],
    exclusionsHeading: "What these figures don't include",
    inflationExclusionTemplate: 'Inflation, so {amount} will not buy the same in five years as it does today',
    inflationExclusionFallbackAmount: 'your deposit target',
    exclusionsRowsAfterInflation: [
      'Tax on savings interest above your personal savings allowance',
      'Any change in your circumstances, such as a pay rise, a move or a new commitment',
      'One-off costs that come with buying, which are covered separately',
    ],
    metadataTemplate: 'Based on your account activity to {date}. We refresh this monthly.',
    primaryCta: 'Close',
  },

  '/assumptions/deposit': {
    heading: 'How we worked this out',
    intro: 'These figures are illustrative. They show what could happen if the assumptions below hold, not what will happen.',
    assumptionsHeading: 'What we assumed',
    assumptionsRowsBeforeInterest: [
      'The property value is the figure you entered, not a valuation',
      'The deposit % is the one you chose, which you can change at any time',
      'Rates are typical market ranges at each Loan-to-Value, not rates offered to you',
      'Rate ranges come from current market data and change often',
      'Loan-to-Value is the mortgage amount as a share of the property value',
    ],
    interestAssumptionTemplate: 'Your savings keep earning {rate} AER while you save, based on the {source}',
    exclusionsHeading: "What these figures don't include",
    exclusionsRows: [
      "Stamp duty, which depends on the property price and whether you're a first-time buyer",
      'Solicitor and conveyancing fees',
      'A survey or valuation fee',
      'Mortgage arrangement or product fees',
      'Moving costs, and anything you need to buy for the property',
    ],
    costsBannerText: 'These usually add up to several thousand pounds on top of your deposit.',
    rateVariabilityWarning: 'Mortgage rates are indicative of the current market and are subject to change. Your final rate will depend on your specific details.',
    metadataTemplate: 'Market rate data from {date}.',
    primaryCta: 'Close',
  },

  '/assumptions/borrowing': {
    heading: 'How we worked this out',
    intro: 'This estimate is illustrative. It shows what a lender could be willing to lend if the assumptions below hold. It is not an offer and no lender has seen your application.',
    assumptionsHeading: 'What we assumed',
    salaryAssumptionTemplate: 'Your salary before tax is {amount}, taken from your salary payments',
    outgoingsAssumptionTemplate: 'Your regular outgoings are {amount} a month, taken from your direct debits and standing orders',
    studentLoanAssumptionTemplate: 'A lender counts your {amount} student loan separately from the income figure, which is already net of it.',
    assumptionsRowsMiddle: [
      'You are buying on your own',
      'Lenders typically lend up to around four and a half times income, though this varies',
    ],
    depositAssumptionTemplate: 'Your deposit is the {amount} currently in your savings with us',
    exclusionsHeading: "What this estimate doesn't include",
    exclusionsRows: [
      "Any income or commitments held with another provider that we can't see",
      "A lender's own affordability model, which will differ from ours",
      'A full credit check, which happens at application rather than here',
      'The property itself, which a lender will value separately',
      'Any change in interest rates between now and applying',
    ],
    borrowingEstimateWarning: 'This is a borrowing estimate, not a binding offer of mortgage. Your actual eligibility depends on underwriting.',
    metadataTemplate: 'Based on your account activity to {date} and a soft credit search on {searchDate}.',
    primaryCta: 'Close',
  },

  '/assumptions/sources': {
    heading: 'Where these figures come from',
    intro: 'Everything here is read from accounts you hold with us. Nothing was entered by you unless it says so.',
    readHeading: 'Read directly from your accounts',
    moneyInLabel: 'Monthly income after tax',
    moneyInCaption: 'Read from your salary payments over the last 12 months',
    essentialSpendingLabel: 'Essential monthly outgoings',
    essentialSpendingCaption: 'Direct debits and standing orders, averaged over the last 6 months',
    savingsInterestLabel: 'Savings interest rate',
    savingsInterestSuffix: 'AER',
    savingsInterestCaption: 'The rate on your Instant saver',
    accountBreakdownTemplate: '{breakdown}, all assigned by you on the accounts screen',
    noAccountsAssignedCaption: "You haven't assigned any accounts toward a deposit yet",
    cantSeeHeading: "What we can't see",
    cantSeeRows: [
      'Accounts and savings you hold with other banks',
      'Cash, or money held outside a bank',
      "Income paid to an account that isn't with us",
    ],
    openBankingTitle: 'Connect another bank through open banking',
    openBankingCaption: "You'd reconfirm this permission periodically",
    wrongHeading: 'If something looks wrong',
    wrongBody: 'You can edit any figure on the screen where it appears. Editing a figure here changes only what the journey uses to calculate - it does not change the underlying account data.',
    primaryCta: 'Close',
  },

  '/settings': {
    appBarTitle: 'Prototype settings',
    headline: 'Prototype settings',
    body: 'These control what the prototype shows. They are not part of the design being tested.',
    appearanceHeader: 'Appearance',
    themeLabel: 'Theme',
    themeOptions: [
      { value: 'greyscale', label: 'Greyscale' },
      { value: 'brand', label: 'Brand' },
    ],
    textSizeLabel: 'Text size',
    textSizeOptions: [
      { value: 'default', label: 'Default' },
      { value: 'large', label: 'Large' },
    ],
    participantHeader: 'What the participant sees',
    journeyLabel: 'Journey stage',
    journeyOptions: [
      { value: 'setting-up', label: 'Setting up' },
      { value: 'saving', label: 'Saving' },
      { value: 'ready-to-check', label: 'Ready to check' },
    ],
    outcomeLabel: 'Mortgage in Principle outcome',
    outcomeOptions: [
      { value: 'likely', label: 'Likely' },
      { value: 'not-yet', label: 'Not yet' },
    ],
    dataSourceHeader: 'Your data',
    resetHeader: 'Reset',
    resetRowLabel: 'Clear all progress and start again',
    buildCaptionTemplate: 'Build {version}. Figures are illustrative throughout.',
  },
};

export default content;
