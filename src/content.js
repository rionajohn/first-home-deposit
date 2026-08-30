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

    // PROVENANCE CAPTIONS SHARED ACROSS SCREENS. Each of these describes one
    // figure that appears on several screens. They are shared rather than
    // written per screen because that is exactly the pair that drifts: all
    // three below were previously duplicated, and two of the three had drifted
    // into saying different things about the same value. See DECISIONS.md D34.

    // The savings interest rate on frames 08, 10/10b, 11 and 32. It is NOT
    // read from any account - there is no AER anywhere in model/accounts.js.
    // It is RATES.bankRate, a dated constant anchored to the Bank of England
    // Bank Rate (DECISIONS.md D3), which is what frames 29 and 30 have always
    // said. `{source}` resolves from RATES.source rather than being typed
    // again here, so the caption cannot name a different source than the one
    // the model actually used.
    bankRateCaptionTemplate: 'Based on the {source}. AER means Annual Equivalent Rate.',

    // essential-spending on frames 05, 06 and 32.
    essentialSpendingCaption: 'Worked out from your direct debits, standing orders and card payments',

    // left-over on frames 05 and 06, in its derived (not entered) state.
    leftOverCaption: 'Worked out from your salary and your regular spending',

    // Bank tab bar. Drawn on frame 01 only in the reference set; DECISIONS.md
    // D11 keeps it on every full-screen journey screen too, so the labels
    // moved here from '/home' rather than being duplicated per screen. The
    // ariaLabel/homeTabLabel pair is what a screen reader announces for the
    // one tab that actually navigates.
    bottomNav: {
      ariaLabel: 'Primary',
      homeTabHint: 'Back to Home',
      goalsTabHint: 'Your goals',
      insightsTabHint: 'Your deposit tracker',
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
          // THE ONLY MODEL-BACKED ROW IN THIS LIST. Its amount is the seeded
          // monthly income (MOCK_POSITION.moneyIn), so it is a template the
          // screen fills rather than a typed figure - see DECISIONS.md D58.
          { merchant: 'Salary', category: 'Monthly pay', amountTemplate: '+{amount}' },
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
      // "earmark" is a verb a participant has to stop and decode, on the one
      // screen where the whole task is deciding what an account is FOR. The
      // plainer form is 8 characters longer, which the row absorbs: the
      // Lifetime ISA caption below is 100 characters in the same slot.
      stocksIsaCaption: "Some people are saving this toward a home, some aren't. Tap to tell us.",
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

    // THE DEFINITION LEADS (DECISIONS.md D63). The heading names the figure
    // and the first line says what it is net of, because both used to arrive
    // after it: the old heading ("Here's what we worked out") named no figure
    // at all, and the only definition on screen was the provenance caption
    // BELOW the input, which a participant reaches after the number.
    //
    // "Anything you save comes out of this" states the direction the model
    // implements. build-spec.md section 6 defines `left-over` as `money-in -
    // essential-spending`, with no saving term, and frame 10 errors when
    // `savings-rate > left-over` - a bound that only makes sense if saving is
    // taken OUT of this figure downstream. Wording that claimed the deduction
    // had already been applied ("after your usual spending and the money you
    // already put away") would overstate it by the 200-310 a month frame 10
    // seeds, and fails fca-copy-check rule 6A. The tense is deliberately
    // unscoped: what they already put aside and what they choose on frame 10
    // both come out of the same figure.
    //
    // "Roughly" is not hedging for its own sake - left-over is modelled from
    // 12 months of activity and was previously stated flat.
    headline: "What's left over each month",
    body: 'This is roughly what you have left after your usual spending. Anything you save comes out of this. You can change any of it below.',

    // Shortened from 'Left over each month', which the heading now says
    // verbatim two elements earlier. The full label is kept in
    // figureAriaLabel, so a screen reader still announces the whole thing.
    figureCaption: 'Each month',
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
    heldInCaption: 'Read from your accounts',
    accountBalanceCaption: 'Read from this account',
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
    moneyInCaption: 'Taken from the salary paid in over the last 12 months',
    essentialSpendingLabel: 'Essential spending',
    leftOverEachMonthLabel: 'Left over each month',
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

    // THE SECOND CARD IN THE SAME SECTION, AND THE SAME COMPONENT.
    //
    // A house deposit is one long-term goal with two things you can do with
    // it: work out what it would take, and watch how it is going. Those are
    // siblings, so they are two instances of one card rather than a card and
    // a banner. The tracker is also the Insights tab's destination - both
    // routes land on `/tracker`, and neither is the "real" one.
    //
    // THEY ARE NOT ALWAYS BOTH DRAWN (DECISIONS.md D44). `/goals` offers a
    // card only where the screen behind it will render rather than redirect:
    // the calculator alone before a goal is set, the tracker alone between the
    // goal and the checkpoint, and both once the checkpoint is passed. They
    // are still siblings, and still one component - the section just does not
    // always have two things to say.
    //
    // No figure here, for the same reason the card above carries none: this
    // screen presents no computed result (see the `anchors` note in
    // goals.js). "What you have put aside so far" describes what the tracker
    // shows; it does not state an amount, so nothing on this screen has to
    // be kept in step with the tracker's own headline.
    trackerCardTitle: 'How is your deposit going?',
    trackerCardBody:
      'Your deposit tracker shows what you have put aside so far, and what is still to go.',
    trackerCardCta: 'Open my deposit tracker',
  },

  '/goal-check': {
    appBarTitle: config.name,
    headline: 'Next: work out your deposit',
    body: "How much you'll need depends on the sort of place you're after, and on how much of it you want to put down.",
    alreadyKnowHeading: 'What we already know',
    savedTowardDepositLabel: 'Saved toward a deposit',
    savedTowardDepositCaption: 'Added up across the accounts you chose for your deposit',
    leftOverEachMonthLabel: 'Left over each month',
    savingsInterestLabel: 'Savings interest',
    savingsInterestSuffix: 'AER',
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
    // `primaryCta` ("Not now, just track my goal") is DELETED (DECISIONS.md
    // D53). It was the action bar's only button, and the bar is gone: the
    // deposit calculator is the only forward route from this screen now. The
    // destination is not lost - `/tracker` is the Insights tab root, a `/goals`
    // bridge card, and where frame 12's own primary lands.
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
    // Context for what to type in the field above, not a benchmark the
    // participant is measured against (copy-check rule 6). `{amount}`,
    // `{region}` and `{period}` all resolve from
    // AREA_AVERAGE_PROPERTY_VALUE in model/rates.js, and the attribution
    // below resolves its source and period from the same object, so the two
    // lines cannot end up naming different figures or different months.
    // DECISIONS.md D56.
    areaAverageCaption: 'In {region}, first-time buyers paid around {amount} on average in {period}.',
    areaAverageSourceCaption: 'Source: {source}, {period}.',
    // THE STAMP DUTY CLIFF (DECISIONS.md D70). Above £500,000 first-time buyer
    // relief is lost outright and standard rates apply to the whole price, so
    // the tax in the goal steps up by £5,000 for one extra pound - more than
    // the preceding £50,000 of property value moves it. Without this the step
    // is silent, and a participant typing upward through this range has already
    // crossed the Lifetime ISA cap 50k below and been told about that one.
    //
    // INFORMATION, NOT A WARNING, AND NOT A STEER. It says what the rule is and
    // why the figure moved. It does not suggest buying below the threshold,
    // which would be advice, and it does not tell the participant to check
    // anything. One number per sentence.
    stampDutyInfoAriaLabel: 'What stamp duty is',
    stampDutyCliffBannerText:
      'First-time buyer stamp duty relief applies up to £500,000. Above that, standard rates apply to the whole price, which is why the stamp duty in your goal steps up here.',
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
    taxRateLabel: 'Tax rate',
    taxRateValue: 'Basic rate',
    taxRateCaption: 'Worked out from your salary',
    // No changeLabel: the only two rows on this screen that had one were the
    // savings interest rate and the tax rate, and neither is adjustable.
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
    savedSoFarCaption: 'The total sitting in the accounts you picked for your deposit',
    monthlySavingLabel: 'Monthly saving',
    // THE MONTHLY RANGE'S TWO CAPTIONS ARE GONE, and so is the property value's
    // "You entered this". Both rows are now permanently editable fields, so a
    // caption saying the participant set the figure only restated what the
    // control itself shows. D47's two-caption problem goes with them: there is
    // no longer a caption that can tell someone who set nothing that they chose
    // it. See DECISIONS.md D5's refinement and D62.
    //
    // `enteredCaption` below stays, because "Saved so far" still uses it: that
    // row is the one figure on the screen a participant did not type, so it is
    // the one place provenance still carries information.
    savingsInterestLabel: 'Savings interest rate',
    taxRateLabel: 'Tax rate',
    taxRateValue: 'Basic rate',
    taxRateCaption: 'Based on what you earn',
    // Two-sided because the bound is two-sided. `errorNonNumeric` on
    // /calculator/property is the string this is shaped from - same two-part
    // form, same "Enter a whole number..." second clause - but it describes
    // RANGE rather than FORMAT, because 40 is a well-formed percentage and
    // wrong only because the chip set does not offer it. See DECISIONS.md D62.
    errorDepositPct: "That's outside the range we can show. Enter a whole number between 5 and 25.",
    // ", editable" follows frame 05's `figureAriaLabel`, which is the field
    // these are the same pattern as.
    propertyValueAriaLabel: 'Property value, editable',
    depositPctAriaLabel: 'Deposit percentage, editable',
    savedSoFarAriaLabel: 'Saved so far, editable',
    monthlyLowAriaLabel: 'Monthly saving, lower amount, editable',
    monthlyHighAriaLabel: 'Monthly saving, upper amount, editable',
    monthlySavingJoin: 'to',
    provenanceKeyLabel: 'How we worked these out',
    noteBannerText: "Changing anything here won't change your savings goal until you choose to update it.",
    flagLabel: "Something doesn't look right",
    primaryCta: 'See what this means',
    secondaryCta: 'Save and exit',
  },

  '/calculator/result': {
    appBarTitle: 'Your results',
    // LEADS WITH THE FIGURE THEY CHOSE (DECISIONS.md D72). It used to open
    // "A deposit on a {property} home could be {low} to {high}" - a 5-to-15%
    // range, on a screen reached by choosing a percentage, which put three
    // numbers in one sentence and none of them the participant's own. The
    // amount comes first and the basis follows it as a caption.
    headlineTemplate: 'Your deposit would be {amount}',
    // A LABEL, NOT A SENTENCE, which is why it carries two numbers where
    // copy-check rule 5 would stop a sentence doing so. It states the basis of
    // the figure above it in the fewest words that stay unambiguous.
    depositBasisCaptionTemplate: '{pct} of {property}',
    // `goalTrackLabelTemplate` IS DELETED, AND THAT IS THE FIX FOR GAPS.md G85
    // (D72). It held "Your goal - {target}" filled from `deposit-target`, so
    // frame 12 called 45,000 "your goal" while /tracker called 52,500 the same
    // thing - one phrase, two figures, two screens, which is D34's failure mode.
    // The phrase is not reworded here, it is GONE: the range figure it labelled
    // is gone with it, and the goal now appears on this screen under its own
    // heading, carrying the same figure the tracker carries.
    //
    // `rangeCaptionTemplate` and `rangeProvenanceCaption` go with the range
    // figure for the same reason - they described a 5-to-15% band this screen
    // no longer presents.
    provenanceCaption: "Worked out from what you've set aside and what you're putting away",
    assumptionsLinkLabel: 'How we worked out these figures',

    // --- What the goal is, stated once and agreeing with /tracker (D72) -----
    // Step 6 of the brief: the deposit figure and the goal figure must not be
    // confusable. Three rows and a total do that better than any wording could
    // - the participant sees 45,000 and 7,500 make 52,500, and meets the goal
    // here rather than for the first time on the tracker.
    goalHeading: 'What you would save toward',
    goalDepositLabel: 'Your deposit',
    goalStampDutyLabel: 'Stamp duty',
    goalTotalLabel: 'Total to save',
    goalStampDutyCaption: 'Stamp duty is worked out at first-time buyer rates.',

    // --- The comparison that replaced the range (D72) -----------------------
    // Every chip frame 09 offers gets a row, so a participant who chose 20% or
    // 25% sees their own choice rather than a band that stops at 15%.
    compareHeading: 'How this compares',
    compareRowSublabelTemplate: '{pct} deposit',
    // THE SELECTED ROW SAYS SO IN WORDS. `rate-band-row--highlighted` marks it
    // visually, but colour and weight must not be the only carriers (WCAG
    // 1.4.1), and this is the one row on the screen whose meaning depends on
    // being told apart from the others.
    compareRowSelectedSublabelTemplate: '{pct} deposit - your choice',
    compareWithinTemplate: 'within {months}',
    compareAlreadyLabel: 'already saved',
    compareProvenanceCaption: 'Time to save each one, at what you are putting away now',
    chartHeading: 'How your savings would build up',
    // --- THE CHART'S THREE LINES ARE A REFERENCE, AND NOW SAY SO ------------
    //
    // The chart plots 5/10/15% whatever the participant chose (build-spec.md
    // section 2). That used to be coherent: the screen's headline was a 5-15%
    // range and its timing rows were 5/10/15, so the lines matched everything
    // around them. D72 replaced both with a comparison windowed on the
    // selection and left the chart, so the same screen started giving two
    // answers to one question with nothing to say why.
    //
    // The lines stay fixed - windowing them puts the savings curve at 26.4% of
    // the plot at 25%, and showing growth is the chart's only job - so the
    // caption is what makes them legible as a deliberate reference rather than
    // a mismatch.
    chartReferenceCaption:
      'The three lines are a low, middle and high deposit at this property price, not the deposit you chose.',
    // THE SECOND STATE, AND IT IS NOT AN EDGE CASE. The goal is deposit plus
    // stamp duty, so it clears the top line at three of the five chip values on
    // the seeded property and at two of five where no stamp duty is due. Above
    // that point every line on the chart sits below the participant's target
    // and nothing else on the screen says so.
    //
    // It names the chart, not the goal's feasibility: "not shown here" is about
    // this chart's scale, where "out of reach" would be a claim about them.
    chartGoalAboveNoteTemplate: 'Your {goal} goal sits above all three, so it is not shown here.',
    chartCaptionTemplate: 'With interest at {aer} a year. Illustrative.',
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
    howWeWorkedIntro: "These figures come from your accounts. You didn't have to type anything in.",
    seeHowWeWorkedLabel: 'How we worked out your monthly saving',
    flagLabel: "Something doesn't look right",
    primaryCta: 'See what this means for borrowing',
    unreachableHeadline: 'Nothing being put aside yet',
    // "what this would take", NOT "your deposit range" (D72's amendment). The
    // range figure was deleted when this screen stopped leading with one, and
    // this string was left behind naming it - the only place on the screen
    // still referring to a range that is not drawn anywhere.
    unreachableBody: 'Add a monthly amount or a target date to see what this would take.',
    unreachableCta: 'Set an amount',
  },

  '/learn/ltv': {
    appBarTitle: 'Loan-to-Value',
    headline: "Loan-to-Value decides the rate you're offered",
    assumptionsLinkLabel: 'How we worked out these rate figures',
    // Says what is behind the row without previewing any of it, and matches the
    // heading of the screen it opens so a participant knows where they landed
    // (D70). None of the five costs is named on this screen.
    otherCostsLinkLabel: 'Other costs when you buy',
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
    // NOT "Watched". The explainer's media block is a placeholder with no
    // playback, and `ltvVideoSeen` is set by dismissing frame 13b however it
    // was entered - including by the diagram row beneath this one. "Watched"
    // stated something about the participant that had not happened, on a row
    // they might never have used. "Opened" is what the flag actually records,
    // and says nothing about what was opened, which is what keeps it true
    // either way. See DECISIONS.md D37. Do not change when the flag is set -
    // only what it is called.
    explainerOpenedLabel: 'Opened',
    explainerDiagramTitle: 'See it as a diagram',
    explainerDiagramDurationTemplate: 'The same {property} home at 95%, 90% and 85%',
    howWeWorkedTitle: 'How we worked this out',
    howWeWorkedIntro: "We read all of this from your accounts. There was nothing for you to fill in.",
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
    savedCaption: 'From the accounts you said are for your deposit',
    // `goalCaptionTemplate` IS DELETED (DECISIONS.md D70's second amendment).
    // It held "of your {target} goal" beneath the headline. The goal figure now
    // sits at the right-hand end of the progress bar, where it labels the end
    // the participant is saving TOWARD, so a second copy of it under the
    // headline said the same thing in a worse place.
    //
    // `savedCaption` above it STAYS, and is now the only thing explaining the
    // headline figure. See D70 - D5 and copy-check rule 8 both require a
    // provenance caption on a figure the participant did not enter, and this
    // deletion made that caption more necessary, not less.
    // ONE LINE, AND THE SECOND SENTENCE IS THE POINT (D70). Nothing in this app
    // asks whether the participant is a first-time buyer - there is no question
    // that could - so the figure is an estimate on an assumption the app has
    // made for them. "at first-time buyer rates" alone states the basis of the
    // calculation, but attached to THEIR goal it reads as a claim they will get
    // the relief. The second sentence is what keeps it a basis rather than a
    // promise, without telling them to go and check anything.
    stampDutyNoteTemplate:
      'Your goal includes an estimated {amount} of stamp duty, at first-time buyer rates. Whether those apply is confirmed when you buy.',
    // `checkpointProgressLabel` IS DELETED (D51's second amendment). It held
    // "Checkpoint", the label under the progress bar's 75% marker, and both the
    // marker and this row are gone. The CONCEPT is not gone - the checkpoint
    // still decides which variant this screen draws and what the Mortgage in
    // Principle flow returns - so read the silence here as "not drawn", never
    // as "removed". `checkpointReachedBodyTemplate` below still names it, and
    // GAPS.md G86 records that it now does so without an antecedent on screen.
    // THE PROGRESS BAR'S LEGEND (DECISIONS.md D70). Each names one portion of
    // the goal and its amount, because colour cannot identify them - WCAG
    // 1.4.1, and in this palette no second shade could carry it even if the
    // rule allowed. Both are suppressed with the bar's division when the tax is
    // zero: "Stamp duty £0" explains nothing.
    // THE TWO BREAKDOWN ROWS. Named `legend*` when they were the progress bar's
    // legend and kept under those names now they are the disclosure's two rows:
    // the strings are unchanged and in the same relationship to the same two
    // segments, and renaming them would make copy-identical keys read as new
    // wording in every diff. One pair of strings, one place, whichever
    // component is drawing them.
    legendDepositLabelTemplate: 'Deposit {amount}',
    legendStampDutyLabelTemplate: 'Stamp duty {amount}',
    // Says what is behind the chevron without restating the figures that are
    // behind it - the same discipline `otherCostsLinkLabel` follows.
    goalBreakdownDisclosureTitle: 'What makes up your goal',
    // The icon's accessible name. It is a control, so it says what opening it
    // gets you, not what it looks like.
    stampDutyInfoAriaLabel: 'What stamp duty is',

    // NO FIGURE, AND NO DIRECTION (DECISIONS.md D51). This used to read
    // "You're {gap} away from the point where checking a Mortgage in Principle
    // starts to be useful." Its premise was the checkpoint gate, and once the
    // action bar offers the check at either position that sentence would have
    // sat directly above a button offering the very thing it says is not yet
    // useful. It also framed the deposit position as a distance short of a
    // point, which the copy rules name directly.
    //
    // What replaced it glosses the term instead, in a legible slot - which
    // matters more now that the milestone row below no longer implies the check
    // is gated. It carries no figure, so nothing here implies a threshold, and
    // it hints at no direction, so a participant reading the screen aloud is not
    // told what the result will say before they run it. The checkpoint is not in
    // this line at all: the progress bar's marker still carries it.
    //
    // The rejected alternative was "You can check what a lender might lend you
    // at any point. The result moves as your deposit grows." - it reads more
    // easily, but "the result moves as your deposit grows" hints at the
    // direction of the result, and its first sentence repeats the wording of the
    // button immediately below it.
    // --- THE MORTGAGE IN PRINCIPLE ROW'S SUBTEXT, ALL THREE STATES ---------
    //
    // These three were a standalone paragraph beneath the goal disclosure and
    // are now the milestone row's own subtext, replacing `mipBody`
    // ("Not run yet. The estimate uses the deposit you have on the day you run
    // it."). One block where there were two, on the row the copy was always
    // about. See D51's third amendment.
    //
    // RENAMED, because they changed slot as well as wording - the repo's own
    // convention, and the reason D51 renamed `mipBody` on the pass that moved
    // it. The `...Template` suffix goes with the placeholder: none of the three
    // carries one now.
    //
    // "NOT RUN YET" OPENS ALL THREE, AND IT IS NOT DECORATION. The milestone
    // row's state is carried by its ICON and by nothing else - there is no
    // aria-label, no visually-hidden text, and `lockedRowAriaSuffix` has no
    // reader. So this clause is the only thing telling a screen-reader
    // participant the check has not been done. It was in `mipBody` and it stays.
    //
    // THE THREE ARE PARALLEL ON PURPOSE: status, then where the participant is,
    // then what they can do. Only the middle clause changes between states, so
    // crossing a threshold reads as one clause changing rather than the row
    // being replaced - which is D42's reasoning for the milestone rows
    // generally.
    mipRowBelowCheckpoint:
      "Not run yet. A Mortgage in Principle is a lender's estimate, worked out before you choose a property. You can run one at any point.",
    // NO "75% CHECKPOINT", AND NO FIGURE AT ALL (D51's third amendment). This
    // read "You've passed the 75% checkpoint. You can now check whether a
    // Mortgage in Principle is likely to be approved." Two things were wrong
    // with it by the time it was moved. The 75% marker is no longer drawn on
    // the progress bar, so the sentence congratulated the participant on
    // passing something they had never been shown (GAPS.md G86). And "you can
    // NOW check" asserts a gate D51 itself removed - the check is offered at
    // either position, so nothing becomes possible here that was not before.
    //
    // What replaced it states the position the participant can actually see -
    // the fill is past three quarters of the track - without naming a figure,
    // without implying a gate, and without hinting which way the result will
    // go, which D51 rejected an earlier candidate for doing.
    mipRowCheckpointReached:
      "Not run yet. You're most of the way to your goal. You can run a check whenever you want to.",
    // "your full goal", NOT "your full deposit goal" - the goal includes the
    // stamp duty since D70, so the old wording was false about £7,500 of it.
    // The same correction `goalCaptionTemplate` took.
    mipRowGoalMet:
      "Not run yet. You've saved your full goal. You can run a check whenever you want to.",
    accountsLinkedTitle: 'Accounts linked',
    accountsLinkedBody: 'Connected already, so we work from your real figures rather than a form you fill in.',
    accountsSortedTitle: 'Accounts sorted',
    accountsSortedBodyTemplate: "You told us what each one's for. {amount} counted toward your deposit.",
    goalSetTitle: 'Deposit goal set',
    goalSetBodyTemplate: "{target}, a {pct} deposit on a {property} home. Now it's just saving.",
    mipTitle: 'Mortgage in Principle',
    // ONE BODY FOR BOTH ROW STATES (DECISIONS.md D51). This was two keys,
    // `mipLockedBodyTemplate` and `mipUnlockedBodyTemplate`, and D42 held them
    // deliberately parallel: both opened "Available from {checkpoint}" on the
    // same figure in the same slot, so passing the checkpoint read as one
    // figure changing state rather than as the row being replaced.
    //
    // BOTH HALVES OF THAT ARE GONE, AND NEITHER WAS TIDIED AWAY. The shared
    // opening clause was a claim that the checkpoint gates the check, and it
    // does not any more - the action bar offers the check at either position,
    // so "Available from £18,000" was false on both rows, not just the lower
    // one. And the pairing has no subject left: both rows now render the same
    // `available` state, so there is no transition on this row for a parallel
    // opening to make legible. Two keys carrying one state is one key.
    //
    // WHAT IT SAYS, AND WHY NOT SOMETHING SHORTER. "Not run yet" rather than
    // "not done": a check is run, and the row reports that it has not been.
    // The second sentence replaces what the checkpoint figure used to carry -
    // it is the only thing on this row that explains why running it now and
    // running it later differ, and it does that without saying which way the
    // answer moves, so a participant reading the screen aloud is not told the
    // result before they reach it.
    //
    // NO FIGURE, deliberately. Rows one to three each carry one, and this row
    // carried the checkpoint. Any figure here would imply a threshold that no
    // longer exists; the progress bar's marker still carries the checkpoint.
    // No borrowing figure either, for D42's original reason: none exists until
    // /mip/running has written `borrow-low`/`borrow-high`, and quoting one
    // would need the MCOB 3A warning and would edge into "what you could be
    // offered".
    //
    // Two candidates were rejected and the reasons are worth keeping. "Your
    // figures are ready for it" makes a readiness claim about the held data,
    // which is frame 19's job - it is the screen that lists the five figures
    // and checks them off. "Nothing here is sent to a lender" makes a claim
    // about the search, and the checked wording for that is
    // `/mip/pre-check`'s `softSearchWarning`, inside the flow where it applies.
    //
    // NOT a `...Template`: it carries no placeholder, and the name says so.
    // `mipBody` IS DELETED (D51's third amendment). It held "Not run yet. The
    // estimate uses the deposit you have on the day you run it." and the three
    // `mipRow*` strings above take its slot.
    //
    // NEITHER HALF OF IT WAS DROPPED. "Not run yet" opens all three
    // replacements, for the accessibility reason recorded there. The second
    // sentence was the ONLY place in the whole of content.js that said the
    // estimate is sized on the deposit held on the day - verified by search -
    // so it moved down one element into `mipCaption`, which is the gloss of
    // what the check is and is not, and therefore a better home for a property
    // of the estimate than a status line ever was.
    // The caption under the milestone list: what the participant gets from a
    // Mortgage in Principle, and the two things it is not.
    //
    // `unlocksAtTemplate` IS DELETED, NOT REWORDED (DECISIONS.md D51). It held
    // "Unlocks at {checkpoint}" and rendered here on the below-checkpoint
    // variant, opposite this line. It carried gating information that no longer
    // exists - the check is offered at either position - and it was the last
    // survivor of the "unlocks" game language D42 stripped from the milestone
    // rows and left here for a later decision. This is that decision, and it
    // closes D42's own deferred change-log line. A net deletion: no new string.
    //
    // THIS LINE NOW RENDERS ON BOTH VARIANTS, and it was already true at either
    // position - it makes no claim about a threshold, only about what the check
    // returns and what it is not. Rendering it unconditionally is the caption
    // catching up with the override rather than a workaround for the deletion:
    // the alternative, dropping the element on the below-checkpoint variant,
    // would have left that variant with no gloss of the term under the list.
    //
    // RENAMED FROM `readyToCheckLabel` (D51). That name asserted a state - the
    // checkpoint had been reached and the door was open - and the state no
    // longer exists, so keeping it would have been a key describing a gate its
    // own string does not mention. `mipCaption` names what the string IS on
    // screen, beside `mipTitle` and `mipBody` above. D35's copy table in
    // DECISIONS.md records this line's previous wording under the old key name.
    mipCaption:
      'An indication of what a lender might lend you, based on the deposit you have on the day you run it. Not a decision, and not an application.',
    ratesCardHeading: 'What rates are like at this Loan-to-Value',
    ratesCaptionTemplate: 'Typical market rates at {ltv} Loan-to-Value',
    ratesDisclosureText: 'Subject to further checks and your individual circumstances. Not an offer.',
    rateCautionText:
      "These show what the wider market charges. They are not rates we're offering you. What a lender charges you depends on their own checks and your situation.",
    rateBandDepositCaptionTemplate: '{pct} deposit',
    rateBandProvenanceCaption: 'Deposit amounts worked out from the property value you set',
    // THE ONLY CONTROL CARRYING THIS LABEL ON THIS SCREEN, at either position
    // (DECISIONS.md D51). It used to be one of two: `belowCheckpointCta` was the
    // same string in the action bar's primary slot below the checkpoint, which
    // is why this link was drawn on the unlocked variant only. `check-mip` holds
    // the primary at both positions now, `belowCheckpointCta` is deleted, and
    // this link is drawn at both. Says what frame 13 explains rather than naming
    // it.
    ltvInfoLinkLabel: 'What a bigger deposit changes',
    assumptionsLinkLabel: 'How we worked out these rate figures',
    // Says what is behind the row without previewing any of it, and matches the
    // heading of the screen it opens so a participant knows where they landed
    // (D70). None of the five costs is named on this screen.
    otherCostsLinkLabel: 'Other costs when you buy',
    thisMonthHeading: 'This month',
    savedLabel: 'Saved',
    savedRowCaption: 'Read from your transfers this month',
    interestLabel: 'Interest earned',
    interestRowCaption: 'Read from your savings accounts',
    onTrackLabel: 'On track for',
    onTrackCaption: "Worked out from what you're putting aside each month",

    // BEYOND THE 60-MONTH WINDOW. `onTrackBeyondWindowValue` ("More than 5
    // years") is GONE: D68's amendment renders the same date range here as
    // anywhere else, because the model supplies one and withholding it told the
    // participant less than the app knew. See D68's "Amended" section for the
    // trade that was reversed.
    //
    // The note stays and its job changed. It used to explain why no date was
    // shown; there is a date now, so it QUALIFIES the date instead. "an
    // estimate based on" echoes `shared.regulatory.estimateDisclosure`, which
    // is this build's established estimate framing, rather than inventing a
    // second phrasing for the same idea. It does not repeat the row's own
    // caption, which already says where the figure comes from; it adds the two
    // things the caption does not - that the figure is an estimate, and that it
    // moves.
    //
    // The key name still says WHEN it renders, which is accurate, even though
    // it no longer says what it contains.
    onTrackBeyondWindowNote:
      "These dates are an estimate based on what you're putting aside now. They move if that changes.",
    provenanceKeyLabel: 'How we worked out your monthly saving',
    flagLabel: "Something doesn't look right",
    // `belowCheckpointCta` IS DELETED (DECISIONS.md D51). It held "What a
    // bigger deposit changes" for the action bar's primary slot below the
    // checkpoint, on D25's reasoning that the Mortgage in Principle route was
    // genuinely not open there. It is open at either position now, so the
    // primary carries `checkpointReachedCta` on both and this key had no reader.
    // The label itself is not lost: it is `ltvInfoLinkLabel` above, which is now
    // drawn at both positions.
    //
    // "Adjust my goal" is unchanged and still the secondary, exactly as D25
    // left it.
    belowCheckpointSecondaryCta: 'Adjust my goal',
    // Says what the participant gets, not that they will be issued one.
    // "Check my Mortgage in Principle" claimed the possessive: it reads as
    // though the prototype produces a decision in principle addressed to
    // them, which it does not and must not imply.
    //
    // ONE STRING, BOTH VARIANTS (D51). Named for the state it was written for
    // and kept under that name rather than renamed: the string is unchanged, and
    // renaming it would have made a copy-identical key look like new wording in
    // every diff and every screenshot comparison.
    checkpointReachedCta: 'Check what a lender might lend you',
    lockedRowAriaSuffix: 'locked',

    // --- The skip-ahead control (src/skip-ahead.js, DECISIONS.md D38) -------
    //
    // THREE STRINGS, AND THE LABEL CARRIES ALL OF THE FRAMING. There used to be
    // a fourth, a supporting note explaining what the control did and that no
    // money moved. It was removed (D38, third amendment): the control is
    // operated by the facilitator, who does not need the explanation, and the
    // note was the only part of the block addressed to someone who did.
    //
    // WHAT THE LABEL HAS TO DO, now that it does it alone. A participant
    // reading this screen aloud has to arrive at "this is a way to skip forward
    // in the prototype", not at "the bank can move my savings" and not at "the
    // app is fast-forwarding my finances". "Prototype control" therefore comes
    // first, before the action it names, and it is the first line of the block.
    //
    // It is also the accessible name of both options - `skipAheadHTML` composes
    // "Prototype control: skip ahead, Further along" - so the framing survives
    // for a screen-reader participant arrowing between them, which is the one
    // place the removed note would otherwise have been missed.
    //
    // "Skip ahead" rather than "fast-forward": fast-forwarding is something
    // done TO a timeline the participant is on, which is the reading that has
    // to be avoided. Skipping ahead is something done to a prototype.
    //
    // The two option labels are deliberately about position, not action.
    // "Now" and "Further along" name where you are looking; a pair like
    // "Off"/"On" or "Start"/"Skip" would name a thing being done.
    //
    // NO REGULATORY ANCHOR OF ITS OWN, unchanged by the removal: there is no
    // figure, no rate, no timescale and no course of action in any of these
    // three strings, so there is nothing for the guidance-versus-advice
    // boundary to catch. /tracker already carries both anchors for the figures
    // BELOW the control; this block neither needs nor weakens them.
    skipAheadLabel: 'Prototype control: skip ahead',
    skipAheadNowOption: 'Now',
    skipAheadAheadOption: 'Further along',
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
    // The process timeline that replaced this screen's "[Visual aid]"
    // placeholder. Four stages of buying a house, in order, with the step
    // this screen is about marked as where the participant stands. It is a
    // sequence, not a measure: nothing here is completed, and no step is ever
    // ticked off. See DECISIONS.md D36.
    //
    // "Formal mortgage offer" rather than the specification's bare "formal
    // offer": "offer" already means the buyer's offer at step 2, and the
    // lender's offer at step 4 is a different thing. "Mortgage offer" is
    // wording the screen already carries, in shared.mipAgreementNotOffer.
    timelineHeading: 'Where this sits in the process',
    timelineSteps: [
      'Mortgage in Principle',
      'Offer on a property',
      'Full mortgage application',
      'Formal mortgage offer',
    ],
    timelineCurrentNote: 'You are here',
    whatItIsNotHeading: 'What it is not',
    notRows: [
      { title: 'Not an application', caption: 'It does not start a mortgage application or commit you to one' },
      { title: 'Not a guarantee', caption: 'A lender can still say no after a full application and credit check' },
      { title: 'Not a credit agreement', caption: 'No money changes hands and no contract is created' },
    ],
    infoBannerText: "You'll find this again in your Explainers list whenever you want it.",
    primaryCta: 'Got it',
  },

  '/mip/pre-check': {
    appBarTitle: 'Mortgage in Principle',
    headline: 'Before you run the check',
    alreadyGotHeading: "We've already got",
    salaryLabel: 'Annual salary before tax',
    salaryCaption: 'From your salary payments',
    incomeLabel: 'Monthly income after tax',
    incomeCaption: 'From your salary payments over the last 12 months',
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
      { label: 'Credit check', value: 'A check that leaves no mark' },
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
    // THE HANDOFF, STATED. This screen is the boundary: nothing after it is
    // run here. The line sits directly above the action bar so the
    // participant reads what the button does before they reach it, and it is
    // .body-text rather than .legal-text because it is the substance of the
    // step, not a footnote to it.
    handoffNote:
      'This opens our Mortgage in Principle tool. The next screen you see here is the result that comes back.',
    primaryCta: 'Open the Mortgage in Principle tool',
    secondaryCta: 'Not right now',
    // build-spec.md section 2's "incomplete" variant (DECISIONS.md D7
    // fallback — no wireframe drawn): shown in place of a held figure's
    // value when it was never read from an account (general mode).
    incompleteValue: 'Not on file',
    incompleteCaption: "We couldn't read this from your accounts. Add it yourself before running the check.",
  },

  '/mip/running': {
    appBarTitle: 'Mortgage in Principle',
    // NOT "Checking your details", which said this screen was doing the
    // checking. The tool frame 19 handed off to is doing it; this screen is
    // the wait for what it sends back. Same soft-search fact, attributed to
    // the thing that actually performs it.
    title: 'Waiting for your result',
    body: 'The Mortgage in Principle tool is running a soft credit search. It will not affect your credit score.',
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
    propertyUpToCaption: 'Worked out from the most you could borrow and what you have saved so far',
    ltvCaption: 'Worked out from the most you could borrow and the most you could pay for a property',
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
    // No primaryCta/secondaryCta: frame 20 is the end of the flow and draws
    // no action bar (DECISIONS.md D50). "Start my Mortgage in Principle" and
    // "Keep saving for now" were retired with it rather than left here for a
    // screen that no longer reads them.
  },

  '/mip/result/not-yet': {
    appBarTitle: 'Your result',
    resultHeadline: "You're not quite there yet",
    resultBody:
      "Based on what we can see today, the amount you'd need to borrow is above what a lender would typically offer. That changes as you keep saving.",
    gapCaption: 'The estimated gap at your current property target',
    // --- TWO CAPTIONS, ONE WORD APART, AND BOTH ARE RIGHT (GAPS.md G88) ----
    //
    // This one captions `gap`, which is `combined-goal` less
    // `saved-toward-deposit` since D70 - the goal INCLUDING stamp duty. It said
    // "your deposit goal", which named the wrong figure by 7,500 and was the
    // same error D51's third amendment corrected in `goalMetBody`.
    //
    // `lenderOfferCaption` below says "your deposit goal" and MUST KEEP SAYING
    // IT. That one captions `borrowRange.high`, which comes from `loan-amount`
    // - the property value less `deposit-target`, the deposit alone. Stamp duty
    // is cash to HMRC and never reduces the loan (D70).
    //
    // So the two sit four rows apart on one screen, one naming the goal and one
    // naming the deposit, and a sweep that "makes them consistent" breaks the
    // second. That is D70's split working as designed, not an oversight.
    gapProvenanceCaption:
      'Worked out from your goal, including stamp duty, and what you have saved so far',
    needBorrowLabel: "What you'd need to borrow",
    lenderOfferLabel: 'What a lender would typically offer',
    lenderOfferValueTemplate: 'around {amount}',
    needBorrowCaption: 'Worked out from the property value you set and what you have saved so far',
    lenderOfferCaption: 'Worked out from the property value you set and your deposit goal',
    basedOnLabel: 'Based on',
    basedOnValue: 'salary, deposit and commitments',
    nextStepsTitle: 'Some things you could do next',
    step1TitleTemplate: 'Save around {amount} more toward your deposit',
    step1CaptionTemplate: "Around {months} at what you're putting aside each month",
    step2TitleTemplate: 'Look at a property target closer to {amount}',
    step2Caption: 'Would close the gap now',
    step3Title: 'Speak to an adviser',
    step3Caption: "Send us a message in the app. We'll put you in touch with a mortgage adviser the same day.",
    howWeWorkedTitle: 'How we worked this out',
    seeHowWeWorkedLabel: 'See how we worked this out',
    automatedNote:
      "A computer worked this estimate out, not a person. If you think it's wrong, tell us. You can also ask for a person to look at it again.",
    flagLabel: "Something doesn't look right",
    // `primaryCta` ("Update my savings goal") and `secondaryCta` ("See what
    // changes this") are DELETED (DECISIONS.md D52). Frame 21 ends the flow and
    // draws no action bar, so both keys lost their only reader. Neither string
    // is lost as a route: the tracker is reachable from the header X and the
    // Insights tab, and the borrowing sheet from this screen's own
    // "See how we worked this out" card nav row.
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
    intro: 'These figures are an example, not a promise. They show what could happen if everything below stays true.',
    assumptionsHeading: 'What we assumed',
    assumptionsRowsBeforeInterest: [
      'You keep saving the same amount each month',
      'You pay in at the start of each month',
      'Your income and essential outgoings stay roughly as they are now',
    ],
    interestAssumptionTemplate:
      'Interest is paid at {rate} a year, based on the {source}, and each month you earn interest on the interest already added',
    assumptionsRowsAfterInterest: ["We've used the last 12 months of your account activity as the starting point"],
    exclusionsHeading: "What these figures leave out",
    inflationExclusionTemplate: 'Inflation, so {amount} will not buy the same in five years as it does today',
    inflationExclusionFallbackAmount: 'your deposit target',
    exclusionsRowsAfterInflation: [
      'Tax on savings interest above your personal savings allowance',
      'Any change in your circumstances, such as a pay rise, a move or a new commitment',
      // D70: "covered separately" named no destination, and there now is one.
      'One-off costs that come with buying, listed under "Other costs when you buy"',
    ],
    metadataTemplate: 'Based on your account activity to {date}. We refresh this monthly.',
    primaryCta: 'Close',
  },

  '/assumptions/deposit': {
    heading: 'How we worked this out',
    intro: 'These are a picture of what might happen, not what will. They only hold if the things below stay as they are.',
    assumptionsHeading: 'What we assumed',
    assumptionsRowsBeforeInterest: [
      'The property value is the figure you entered, not a valuation',
      'The deposit % is the one you chose, which you can change at any time',
      // MOVED OUT OF `exclusionsRows` BY DECISIONS.md D70. It sat under "What's
      // not counted here", and once the tax is part of the goal that placement
      // is false rather than merely stale. It is an assumption now, and it
      // states the two things the tracker's own one-liner has no room for: the
      // relief has a ceiling, and the app assumed the participant qualifies
      // rather than asking.
      'Stamp duty is worked out at first-time buyer rates, which apply up to a £500,000 property price',
      'We assumed you are a first-time buyer, because nothing here asks',
      'Rates are typical market ranges at each Loan-to-Value, not rates offered to you',
      'Rate ranges come from current market data and change often',
      'Loan-to-Value is the mortgage amount as a share of the property value',
    ],
    interestAssumptionTemplate: 'Your savings keep earning {rate} a year while you save, based on the {source}',
    exclusionsHeading: "What's not counted here",
    // ONE ROW, POINTING, NOT FIVE LISTING (DECISIONS.md D70). Four of these
    // rows moved to `/assumptions/costs`, which gives each an amount; the fifth
    // (stamp duty) moved UP into the assumptions above, because it is counted
    // now. Keeping a second, vaguer copy of the same four costs here is exactly
    // the drift D34 records the cost of - so this row names where they are
    // instead of restating them.
    exclusionsRows: [
      'The other costs of buying, such as legal fees, a survey and removals. These have their own screen, "Other costs when you buy", which gives what each one usually comes to',
    ],
    costsBannerText: 'These are not in your goal, and what each one costs depends on choices you have not made yet.',
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
    studentLoanAssumptionTemplate:
      'A lender counts your {amount} student loan separately. It has already been taken off the income figure.',
    assumptionsRowsMiddle: [
      'You are buying on your own',
      'Lenders typically lend up to around four and a half times income, though this varies',
    ],
    depositAssumptionTemplate: 'Your deposit is the {amount} currently in your savings with us',
    exclusionsHeading: "What this estimate doesn't include",
    exclusionsRows: [
      "Any income or commitments held with another bank or building society that we can't see",
      "A lender's own affordability model, which will differ from ours",
      'A full credit check, which happens at application rather than here',
      'The property itself, which a lender will value separately',
      'Any change in interest rates between now and applying',
    ],
    borrowingEstimateWarning: 'This is a borrowing estimate, not a binding offer of mortgage. Your actual eligibility depends on underwriting.',
    metadataTemplate: 'Based on your account activity to {date} and a soft credit search on {searchDate}.',
    primaryCta: 'Close',
  },

  /**
   * Frame-less screen, DECISIONS.md D70 / GAPS.md G84. Like /assumptions/costs
   * it has no Figma node and no reference PNG.
   *
   * A CONCEPT EXPLAINER, WHICH IS WHY IT IS UNDER /learn AND NOT
   * /assumptions. The sheet FAMILY it copies is frames 29 to 32's - intro,
   * a list of rows with values, a short section, a sourcing line - but
   * `/assumptions/*` means "how we derived YOUR numbers", and this screen
   * explains a tax that exists whether or not the participant has a goal.
   * `/learn/ltv/video` already puts a sheet in the /learn namespace.
   *
   * WHAT THIS SCREEN MAY NOT DO. It explains. It does not say what the
   * participant should do, does not tell them whether they will qualify for
   * the relief, and does not describe any way of reducing the amount - the
   * last would be advice on structuring a transaction, which is well outside
   * both the guidance boundary and this prototype.
   */
  '/learn/stamp-duty': {
    heading: 'Stamp duty',
    // THREE FACTS, IN THE ORDER A PARTICIPANT NEEDS THEM: what it is, who
    // gets it and when, and why it is in a goal that is otherwise a deposit.
    // The third sentence exists because the tracker puts the tax inside the
    // goal, and a participant who reads "it is not part of your deposit"
    // without it would be left with a contradiction.
    intro:
      'Stamp Duty Land Tax is a tax on buying a property. It goes to HM Revenue and Customs when the purchase completes. It is not part of your deposit, but you need the money ready at the same time, which is why your goal includes it.',
    bandsHeading: 'What a first-time buyer pays',
    // BANDS ARE MARGINAL AND THE ROWS HAVE TO SAY SO. "5% of that part" and
    // the caption under it are doing the work that stops the middle row being
    // read as 5% of the whole price - the single most likely misreading of a
    // banded tax, and the reason the third row carries a caption at all.
    bandRows: [
      {
        label: 'Up to £300,000',
        value: 'Nothing',
      },
      {
        label: '£300,001 to £500,000',
        value: '5% of that part',
        caption: 'Only the part above £300,000 is taxed',
      },
      {
        label: 'Above £500,000',
        value: 'Relief no longer applies',
        caption: 'Standard rates apply to the whole price, not only the part above £500,000',
      },
    ],
    whereHeading: 'Where it applies',
    whereBody:
      'Stamp Duty Land Tax applies in England and Northern Ireland. Scotland and Wales have their own property taxes, at their own rates.',
    // The sheet family's sourcing slot, filled from SDLT in rates.js so the
    // attribution resolves from the same constant as the bands themselves.
    metadataTemplate: 'Rates from {source}, accessed {period}.',
    primaryCta: 'Close',
  },

  /**
   * Frame-less screen, DECISIONS.md D70 / GAPS.md G83. No Figma frame exists
   * for it: the costs it lists were frame 30's `exclusionsRows`, and they were
   * moved here whole so one list carries them rather than two that drift.
   *
   * WHAT THIS SCREEN MAY NOT DO. It lists costs and says what they usually
   * come to. It does not tell the participant what to do about any of them,
   * does not rank them, and does not suggest saving for them - that would be a
   * course of action, and mortgages sit outside the targeted support regime.
   * Every row is a statement of fact about what the cost is and what it
   * typically runs to.
   */
  '/assumptions/costs': {
    heading: 'Other costs when you buy',
    // OPENS WITH WHY THEY ARE NOT IN THE GOAL, because that is the first
    // question the row on /tracker raises. The reason is the honest one: these
    // depend on choices that have not been made, so a figure in the goal would
    // be a guess dressed as a target.
    intro: "These aren't in your deposit goal. What each one costs depends on choices you haven't made yet, like the property, the solicitor and the lender.",
    costsHeading: 'What each one usually costs',
    costsRows: [
      {
        label: 'Legal and conveyancing fees',
        value: 'Up to about £1,800',
        caption: 'Includes searches and Land Registry fees',
      },
      {
        label: 'Survey',
        value: '£300 to £1,500',
        caption: 'The range depends on the level of survey',
      },
      {
        label: 'Mortgage valuation',
        value: 'Around £100',
        caption: 'Arranged by the lender',
      },
      {
        // THE INTEREST CLAUSE IS A BALANCE REQUIREMENT, NOT A WARNING (D70).
        // MCOB 3A.3.1R and the Consumer Duty consumer understanding outcome
        // both require a benefit and its consequence to be equally plain.
        // "you can add it to the mortgage" on its own reads as the fee being
        // avoidable; it is deferred, and deferring it costs interest. Stating
        // the consequence is not telling the participant what to do.
        label: 'Mortgage product fee',
        value: '£0 to £1,500',
        caption: 'Some lenders let you add this to the mortgage instead of paying it upfront, which means paying interest on it',
      },
      {
        label: 'Removals',
        value: 'From about £400',
      },
    ],
    // The sheet family's own sourcing slot (frames 29, 30 and 31 each carry a
    // `metadataTemplate` at `.legal-text`). Both values are filled from
    // UPFRONT_COST_SOURCES in rates.js so the attribution cannot drift from the
    // figures it attributes.
    metadataTemplate: 'Cost ranges from {sources}, accessed {period}.',
    primaryCta: 'Close',
  },

  '/assumptions/sources': {
    heading: 'Where these figures come from',
    intro: 'Everything here is read from accounts you hold with us. Nothing was entered by you unless it says so.',
    readHeading: 'Read directly from your accounts',
    moneyInLabel: 'Monthly income after tax',
    moneyInCaption: 'We read this from a year of your salary payments',
    essentialSpendingLabel: 'Essential monthly outgoings',
    savingsInterestLabel: 'Savings interest rate',
    savingsInterestSuffix: 'AER',
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
    // Shown only when Cache Storage holds a shell version that is not the one
    // running. Deliberately says "downloaded", not "running": the whole fault
    // this replaced was a caption that named a version the page was not
    // executing. Phrased to read correctly for one waiting version or several.
    cachedBuildTemplate: 'Downloaded and waiting for a reload: {versions}.',
  },
};

export default content;
