> **Figma-era version. Superseded and archived on 22 August 2026.**
>
> This is the wireframe-stage FCA copy check. It was written to run against Figma frames on the
> first home journey wireframes, and it is kept here as a record of the checks applied at that
> stage. It is not a Claude Code skill and nothing loads it: the frontmatter below is left as it
> was written, and is inert in this location.
>
> `.claude/skills/fca-copy-check/SKILL.md` supersedes it. That is the version that runs, and the
> one to amend. Nothing below this note has been edited.

---
name: fca-copy-check
description: Audit selected frames or a whole page against UK financial services copy rules - the advice-guidance boundary, the Consumer Duty consumer understanding outcome, MCOB 3A secured-lending and financial-promotion requirements, and vulnerability tone. Invoke on any frame or page of the first home journey wireframes after generating or editing screens.
---

# FCA copy check

Audit the selected frames, or the whole page if nothing is selected, against the rules below. Produce a table with one row per issue, giving the frame name, the rule breached, the offending text, and a suggested replacement. Fix issues marked FIX automatically; list issues marked FLAG for the designer to decide on.

Do not restructure layouts or change component choices. This is a copy audit.

## 1. Advice boundary - FIX

The targeted support regime covers pensions and retail investments only; mortgages are outside its scope, so nothing here may amount to a personal recommendation.

Search for and replace: "we recommend", "you should", "we advise", "best for you", "right for you", "suitable for you", "your best move", "we suggest you", and any imperative that steers the user toward one option rather than describing options.

Replace with: "based on what we can see", "you could", "one option is", "here's what that would mean".

Report any phrasing that is borderline rather than clear-cut as FLAG.

## 1A. System-proposed savings amounts - FIX

Phase 2 reports findings; it does not propose a contribution. The amount someone puts aside is chosen by them inside the deposit calculator, where the consequence of each choice is visible.

Flag and remove:
- Any screen headlining a system-proposed monthly amount, e.g. "You could put aside £310 a month"
- Any framing of a proposed amount as a share of what the user has left, e.g. "about 80 percent of your disposable income"
- Any wording that treats a proposed contribution as a target the user should meet

Replace with a statement of fact about what is left each month, and hand the choice to the user.

Separately, check that no default or illustrative contribution exceeds roughly 60 percent of what is left after essential spending. A default at 80 percent or above predictably fails and sits badly against the Consumer Duty requirement to avoid foreseeable harm. Flag any that do.

## 2. Required statements - FIX

For each frame, check:

- Shows a borrowing figure, an interest rate, or the Mortgage in Principle outcome → must carry the Risk warning component, secured-lending variant, containing exactly: "A mortgage is secured against your home. If you couldn't keep up the repayments, your home would be at risk." Flag any use of the superseded wording "Your home may be repossessed if you do not keep up repayments on your mortgage" - that form of words came from MCOB 3.6.13R, replaced by MCOB 3A on 21 March 2016.
- Shows an interest rate → must also carry the Risk warning, rates-indicative variant.
- Outputs any figure → must carry the Guidance disclaimer.
- Shows a projected figure → must carry the Estimate note directly beneath it.
- Is a Mortgage in Principle screen → must carry the soft-search and not-an-offer Risk warning variants where the flow reaches a credit search or an outcome.
- Is an outcome screen → must carry the Support footer.

## 3. Financial promotion boundary - FLAG

Any of the following pushes a screen from information into a financial promotion, which would require a full MCOB 3A.5.1R representative example including the APRC:

- A named mortgage product
- A lender-specific rate, or a rate presented as available to this user
- "from", "as low as", "our best rate", "you could get" framing around a rate
- A rate and an apply-for-a-mortgage action on the same screen
- Wording that could create false expectations about the availability or cost of credit, contrary to MCOB 3A.2.4R(2)(b) - for example a card headed "What you could be offered" rather than "What rates are like"

## 3A. Traceability of calculated figures - FIX

- Any derived figure or projection shown without an Assumptions link ("How did we work this out?") directly beneath it
- Any figure read or inferred from the user's accounts shown without a route to the data sources sheet
- Any assumptions sheet that lists what was assumed but not what the figures exclude
- Any use of investment-product wording such as "not a reliable indicator of future performance", which does not belong in a savings or mortgage context

## 3B. Dead links - FLAG

List every button, link and navigational row across all pages whose destination frame does not exist in the file. Give the frame it sits on and the label it carries. Do not create the missing frames; just report them.

## 4. Balance and prominence - FLAG

Under MCOB 3A.3.1R a communication must be balanced, must not emphasise benefits without a fair and prominent indication of relevant risks, and must not disguise, omit, diminish or obscure important warnings. The Consumer Duty consumer understanding outcome adds that risks must be as clear as benefits.

Check for:

- A benefit in a heading or larger type with its corresponding risk in smaller type, lower on the page, or behind a link
- Paired benefit and drawback cards where one is visually heavier than the other
- A comparison presented unfairly - for example listing the upside of a low deposit without its higher rate
- A required statement rendered at Legal size when it should be Body/M-strong

## 5. Plain language - FIX

- Any acronym used without being written out first: LTV, MIP, AIP, APRC, AER, FSCS, FOS
- Any technical term used without a plain-English gloss on first appearance
- Sentences carrying more than one number
- Copy reading above roughly a reading age of 11

## 6. Tone and vulnerability - FIX

- Any use of "declined", "rejected", "failed", "you don't qualify", "unsuccessful", or a cross or X glyph on the negative eligibility outcome
- Any framing of the user's deposit position as a shortfall, a gap they have failed to close, or a comparison against what other people have saved
- Any use of an average as a benchmark the user is measured against, rather than as context
- Any wording implying the user has made a mistake, is behind, or has been irresponsible
- Judgemental framing of the user's student loan or other credit commitments
- Urgency, scarcity, countdown or streak language anywhere
- A multi-step form screen missing a visible "Save and exit"

## 6A. Arithmetic and provenance - FIX

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
- Any figure missing a Source badge, or carrying the wrong variant: from-your-account for values read directly from an account with this bank, estimated for values derived because the main account is elsewhere, you-entered for values the user chose

## Output

End with a one-line count: how many issues were fixed, how many flagged, and which frame carried the most.
