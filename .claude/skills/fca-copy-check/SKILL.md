---
name: fca-copy-check
description: Check user-facing copy against FCA requirements - the guidance versus advice boundary (MCOB 4.8A), the Consumer Duty consumer understanding and consumer support outcomes, and MCOB 3A secured lending wording. Use whenever adding, editing or reviewing any string shown to a user in this prototype, including regulatory footers, disclaimers and provenance captions.
---

# FCA copy check

Audit the routes named in the prompt, or every route in the `ROUTES` list in `src/router.js` if none is named, against the rules below. Produce a table with one row per issue, giving the route and its frame number, the rule breached, the offending text and the `content.js` key holding it, and a suggested replacement. Fix issues marked FIX automatically; list issues marked FLAG for the user to decide on.

Where the copy is:

- Every user-facing string is a key in `src/content.js`, under one top-level key per route (`'/tracker'`, `'/mip/result/likely'`), plus `shared` for copy reused across routes. Nothing else in the codebase holds a string a participant reads. Identify a string by its route key and key name, not by line number.
- `src/screens/<name>.js` renders those strings and is what "the screen" means below. `docs/ROUTES.md` maps frame numbers to routes; both the docs and the code still use frame numbers, so keep quoting them.
- Read a string in the context of the screen that renders it, not on its own in `content.js`. A line that is fine as a sentence can still breach a rule once you see what sits above and below it, what figure it captions, and which other required lines are or are not on the same screen. Serve the prototype (`python -m http.server 8080`) and read the rendered screen where the wording depends on it.
- `shared.regulatory` is fixed wording. If a rule below would have you change one of those four lines, do not: flag it instead.

Do not restructure markup or swap components. Edit strings in `src/content.js`, not layout in the screen modules. This is a copy audit.

## 1. Advice boundary - FIX

The targeted support regime covers pensions and retail investments only; mortgages are outside its scope, so nothing here may amount to a personal recommendation.

Search `src/content.js` for and replace: "we recommend", "you should", "we advise", "best for you", "right for you", "suitable for you", "your best move", "we suggest you", and any imperative that steers the user toward one option rather than describing options.

Replace with: "based on what we can see", "you could", "one option is", "here's what that would mean".

Report any phrasing that is borderline rather than clear-cut as FLAG.

## 1A. System-proposed savings amounts - FIX, except the 60 percent clause, which is FLAG

Phase 2 reports findings; it does not propose a contribution. The amount someone puts aside is chosen by them inside the deposit calculator, where the consequence of each choice is visible.

**A heading names a section's dominant action. Where a clause states its own, the clause wins.** The three bullets below are FIX. The 60 percent clause at the end is FLAG, and says so in its own last sentence. That was read as a contradiction once (`GAPS.md` G61) and cost a session's investigation; it is written out here so it does not have to be resolved again.

Flag and remove - FIX:
- Any screen headlining a system-proposed monthly amount, e.g. "You could put aside £310 a month"
- Any framing of a proposed amount as a share of what the user has left, e.g. "about 80 percent of your disposable income"
- Any wording that treats a proposed contribution as a target the user should meet

Replace with a statement of fact about what is left each month, and hand the choice to the user.

Separately - FLAG, not FIX: check that no default or illustrative contribution exceeds roughly 60 percent of what is left after essential spending. A default at 80 percent or above predictably fails and sits badly against the Consumer Duty requirement to avoid foreseeable harm. Flag any that do.

**Why that one is a flag.** This section governs COPY. A default the screen does not state is not a copy defect, and the remedy the three bullets ask for - state the facts, hand over the choice - can already be met by a screen whose own default is above the line. Raising it is a decision about a figure, which sits outside a copy audit and belongs to whoever owns the mock data. Report it, name the percentage, and leave it. `DECISIONS.md` D47 is the worked example.

## 2. Required statements - FIX

For each route, check the strings its screen module renders:

- Shows a borrowing figure, an interest rate, or the Mortgage in Principle outcome → must carry the risk warning, secured-lending variant: `riskWarningHTML()` from `src/components/ui.js` rendering `shared.regulatory.mcob3aRepossessionWarning`, containing exactly: "A mortgage is secured against your home. If you couldn't keep up the repayments, your home would be at risk." Flag any use of the superseded wording "Your home may be repossessed if you do not keep up repayments on your mortgage" - that form of words came from MCOB 3.6.13R, replaced by MCOB 3A on 21 March 2016.
- Shows an interest rate → must also carry the risk warning, rates-indicative variant: the route's own `rateVariabilityWarning` key, rendered through `riskWarningHTML()`.
- Outputs any figure → must carry the guidance disclaimer, `shared.regulatory.guidanceNotAdvice`, rendered as `.legal-text`. Screens read that key directly. They used to select between two lines through `guidanceNotAdviceLine()` in `src/regulatory.js`; both that function and the second line went with the account-linking removal (`DECISIONS.md` D28), because every session has now read account activity and the line's sourcing claim always holds.
- Shows a projected figure → must carry the estimate note, `shared.regulatory.estimateDisclosure`, directly beneath it.
- Is a Mortgage in Principle screen (`/mip`, `/mip/about`, `/mip/pre-check`, `/mip/running`, `/mip/result/likely`, `/mip/result/not-yet`, `/mip/adviser`) → must carry the soft-search and not-an-offer risk warning variants where the flow reaches a credit search or an outcome. The not-an-offer line is `shared.mipAgreementNotOffer`.
- Is an outcome screen → must carry the Support footer.

## 3. Financial promotion boundary - FLAG

Any of the following pushes a screen from information into a financial promotion, which would require a full MCOB 3A.5.1R representative example including the APRC:

- A named mortgage product
- A lender-specific rate, or a rate presented as available to this user
- "from", "as low as", "our best rate", "you could get" framing around a rate
- A rate and an apply-for-a-mortgage action on the same screen
- Wording that could create false expectations about the availability or cost of credit, contrary to MCOB 3A.2.4R(2)(b) - for example a card headed "What you could be offered" rather than "What rates are like"

## 3A. Traceability of calculated figures - FIX

- Any derived figure or projection shown without an assumptions link ("How did we work this out?") directly beneath it - `infoLinkHTML()` pointing at the matching `/assumptions/*` route
- Any figure read or inferred from the user's accounts shown without a route to the data sources sheet, `/assumptions/sources` (frame 32)
- Any `/assumptions/*` sheet that lists what was assumed but not what the figures exclude
- Any use of investment-product wording such as "not a reliable indicator of future performance", which does not belong in a savings or mortgage context

## 3B. Dead links - FLAG

List every button, link and navigational row across all routes whose destination does not exist: a `[data-action]` element with no listener bound in its screen module, or a hash target absent from the `ROUTES` list in `src/router.js`. Give the route it sits on and the label it carries. Do not create the missing screens; just report them.

## 4. Balance and prominence - FLAG

Under MCOB 3A.3.1R a communication must be balanced, must not emphasise benefits without a fair and prominent indication of relevant risks, and must not disguise, omit, diminish or obscure important warnings. The Consumer Duty consumer understanding outcome adds that risks must be as clear as benefits.

Judge these from the rendered screen and from the classes the screen module applies, not from `content.js` alone. Check for:

- A benefit in a heading or larger type with its corresponding risk in smaller type, lower on the page, or behind a link
- Paired benefit and drawback cards where one is visually heavier than the other
- A comparison presented unfairly - for example listing the upside of a low deposit without its higher rate
- A required statement rendered at `.legal-text` (caption size, tertiary colour, `src/css/components.css`) when it should be body size and weight (`.body-text` / `.body-text-lg`)

## 5. Plain language - FIX

- Any acronym used without being written out first: LTV, MIP, AIP, APRC, AER, FSCS, FOS
- Any technical term used without a plain-English gloss on first appearance
- Sentences carrying more than one number
- Copy reading above roughly a reading age of 11

## 6. Tone and vulnerability - FIX

- Any use of "declined", "rejected", "failed", "you don't qualify", "unsuccessful", or a cross or X glyph (check which `src/icons.js` vector the screen renders) on the negative eligibility outcome
- Any framing of the user's deposit position as a shortfall, a gap they have failed to close, or a comparison against what other people have saved
- Any use of an average as a benchmark the user is measured against, rather than as context
- Any wording implying the user has made a mistake, is behind, or has been irresponsible
- Judgemental framing of the user's student loan or other credit commitments
- Urgency, scarcity, countdown or streak language anywhere
- A multi-step form screen missing a visible "Save and exit" in its form step header (`formStepHeaderHTML()`)

## 6A. Arithmetic and provenance - FIX

Figures come from `src/model/`; screens never compute one inline.

- Any breakdown whose figures do not sum to the total displayed. Check every one on screen.
- Any breakdown that subtracts the student loan from take-home pay. Plan 2 repayments come out through payroll before the salary arrives, so net income is already net of them and subtracting again double-counts.
- Any screen counting the emergency fund pot toward the deposit total. It is held separately and excluded.
- Any figure presented as certain that is in fact modelled or projected.

## 7. Consent and data - FLAG

- A permission toggle whose purpose is not stated beside it
- A consent screen without a stated route to withdraw permission
- Data from another bank described without reference to open banking and periodic reconfirmation

## 8. Mechanics - FIX

- American spellings
- Title Case in headings or buttons where sentence case is required
- Exclamation marks
- Currency without the pound sign or comma separators
- Any figure missing a provenance caption (`provenanceCaptionHTML()`; this repo carries provenance as a caption, never as a Source badge), or carrying the wrong provenance value in `src/state.js`: `read` for values read directly from an account with this bank, `estimated` for values derived because the main account is elsewhere, `entered` for values the user chose

## 9. Unchecked wording - FAIL

`shared.regulatory` in `src/content.js` holds checked, fixed wording. Wording that has not been through copy check is deliberately held apart from it, and marked two ways: it sits in an object named `regulatoryAwaitingCheck` rather than in `regulatory`, and it carries a comment banner reading `NOT FCA COPY CHECKED. AWAITING REVIEW.` Treat either marking as unchecked, and treat any later object or banner that says the same thing the same way. Do not rely on the one key that exists today.

A required line resolved from unchecked wording does not satisfy the rule that required it. Where that happens, fail the rule that required the line and report it as "required line present but not copy-checked", naming the key and the route it renders on. Not a FLAG for the user to weigh: the line is on screen and the requirement is unmet.

Follow the resolution, not the call site. Where a screen takes a required line from a function rather than a literal, check every value that function can return, not the one it returns in the state in front of you. A function that can return unchecked wording fails this rule on every route that calls it, because any of those routes can render that line. No screen in this build does that today - `src/regulatory.js` was the one case and it is deleted (`DECISIONS.md` D28) - so the rule currently resolves on literals. Re-apply it the moment a required line goes back behind a function.

This rule is about process, not about the wording. It says the copy has not been through copy check yet, and nothing more. Do not rewrite the line, do not move it into `shared.regulatory`, and do not report it as non-compliant.

## Output

End with a one-line count: how many issues were fixed, how many flagged, and which route carried the most.

## Not applicable in Claude Code

No whole step had to be dropped; every rule above is still live. Two things are weaker here than they were in Figma, and neither is a reason to skip a rule:

- Rule 4's visual comparisons ("visually heavier", "larger type") cannot be settled from the source the way they can by looking at a frame. Read the classes the screen module applies and the sizes in `src/css/`, and where that is not conclusive, serve the prototype and look at the screen.
- There is no canvas to carry a designer's note of intent beside a screen. Where a rule turns on what a screen was meant to do, the written record is `docs/build-spec.md`, `docs/DECISIONS.md` and `docs/GAPS.md`.
