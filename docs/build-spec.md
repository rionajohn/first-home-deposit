# Your first home - build specification

Source of truth for the Claude Code prototype. Frame names match the Figma file (page **08 Build spec** holds the same tables). If a frame name changes in Figma, change it here in the same commit.

## 1. Navigation

One row per transition, including back paths and dismissals. "In file" means the trigger label or branch is present in the wireframes. "Assumed" means it is a reasonable default that has not been drawn and should be confirmed before build. `returnFrame` is the frame the user came from, held in state so sheets and explainers can send them back.

| Source frame | Trigger | Destination | What changes in state | Evidence |
|---|---|---|---|---|
| 01 Home - Your first home entry point | "See what's involved" | 02 Journey overview | journeyStarted = true | In file |
| 01 Home - Your first home entry point | App bar back | Exit feature (bank home) | none | Assumed |
| 02 Journey overview | "Show me what's possible" | 03 Consent and linked accounts | none | In file |
| 02 Journey overview | "Not right now" | 01 Home | journeyStarted = false | In file |
| 02 Journey overview | App bar back | 01 Home | none | Assumed |
| 03 Consent and linked accounts | "Select all accounts" | 03 (in place) | Linked account row state = all-selected | In file |
| 03 Consent and linked accounts | Tap a linked account row | 03b Move this account | selectedAccountId = row id; returnFrame = 03 | Assumed |
| 03 Consent and linked accounts | "Continue" | 05 What we can see | saved-toward-deposit, emergency-fund and unassigned recalculated from the account selection | Amended - DECISIONS.md D28 |
| 03 Consent and linked accounts | App bar back | 02 Journey overview | none | Assumed |
| 03b Move this account | Confirm move | 03 Consent and linked accounts | Account moved to the deposit set; saved-toward-deposit recalculated | Assumed |
| 03b Move this account | "cancel" or scrim tap | 03 Consent and linked accounts | none | In file |
| 05 What we can see | Tap the headline figure and type | 05 (in place) | left-over overridden; provenance/left-over = entered | In file (annotation) |
| 05 What we can see | Toggle the breakdown | 05 (in place) | breakdownOpen only - no figure changes | In file (annotation) |
| 05 What we can see | Provenance caption link | 32 Where these figures come from | returnFrame = 05 | Assumed |
| 05 What we can see | Action bar continue | 06 What we found | left-over committed to the model | In file |
| 05 What we can see | App bar back | 03 Consent and linked accounts | none | Assumed |
| 06 What we found | "What we used to check this" | 32 Where these figures come from | returnFrame = 06 | In file |
| 06 What we found | "Is a house still your goal right now?" - yes | 08 Ready for the calculator | goal = house | In file |
| 06 What we found | "Is a house still your goal right now?" - no | /goals (bank goals area) | goal = other; journey ends | In file (branch), destination added - DECISIONS.md D21 |
| /goals Bank goals area | "Work out my deposit" | 09a if no property-value held, otherwise 09 | goal = house; returnFrame = /goals | Added - DECISIONS.md D21, amended |
| /goals Bank goals area | App bar back | 01 Home | none | Added - DECISIONS.md D21 |
| Any screen with the tab bar | Goals tab | /goals Bank goals area | none (mid-calculator routes through 10c first) | Added - DECISIONS.md D21 |
| 06 What we found | Action bar continue | 08 Ready for the calculator | none | In file |
| 06 What we found | App bar back | 05 What we can see | none | Assumed |
| 08 Ready for the calculator | Checkpoint button ("Work out my deposit") | 09a if no values held, otherwise 09 | calculatorEntered = true | In file (annotation) |
| 08 Ready for the calculator | App bar back | 06 What we found | none | Assumed |
| 09a Before a value is entered | Enter a property value | 09 Deposit calculator - property and deposit | property-value | In file |
| 09a Before a value is entered | Continue with fields empty | 09a (in place) | Button state = disabled; no state change | Assumed |
| 09 Property and deposit | Set deposit % past the Lifetime ISA limit | 09b Above the Lifetime ISA cap | deposit-pct; lisaCapBreached = true | In file |
| 09 Property and deposit | "Continue" | 10 Deposit calculator - how you'll save | property-value, deposit-pct, deposit-target, loan-amount, ltv committed | In file |
| 09 Property and deposit | Form step header back | 08 Ready for the calculator | none | Assumed |
| 09 Property and deposit | Form step header close | 10c Leave this for now? | returnFrame = 09 | Assumed |
| 09b Above the Lifetime ISA cap | "Continue" | 10 Deposit calculator - how you'll save | As 09, with the cap warning acknowledged | In file |
| 10 How you'll save | Choose "a monthly amount" | 10 (in place) | solveFor = date | In file |
| 10 How you'll save | Choose "a date" | 10b Date stepper variant | solveFor = amount | In file |
| 10 How you'll save | Adjust the slider | 10 (in place) | savings-rate; months-to-target recalculated live | In file |
| 10 / 10b How you'll save | change-link on a review row | The frame that owns that figure (09 or 05) | returnFrame = 10 / 10b | In file |
| 10 / 10b How you'll save | "Continue" | 11 Check your figures | savings-rate or target date committed | In file |
| 10 / 10b How you'll save | Form step header close | 10c Leave this for now? | returnFrame = 10 / 10b | Assumed |
| 10c Leave this for now? | Leave (primary) | 01 Home | Draft inputs retained; journeyPaused = true | Assumed |
| 10c Leave this for now? | Keep going (secondary) | returnFrame | none | Assumed |
| 11 Check your figures | change-link on any row | The frame that owns that figure (05, 09 or 10) | returnFrame = 11 | In file |
| 11 Check your figures | "Work it out" | 12 Your deposit range | months-to-target, on-track-for, monthly-low, monthly-high, checkpoint-amount computed | In file |
| 11 Check your figures | Back | 10 / 10b How you'll save | none | Assumed |
| 12 Your deposit range | How we worked this out (savings figure) | 29 How we worked out your saving amount | returnFrame = 12 | In file |
| 12 Your deposit range | How we worked this out (deposit and rates) | 30 How we worked out your deposit and rates | returnFrame = 12 | In file |
| 12 Your deposit range | "What rates are like at this Loan-to-Value" | 13 Deposit calculator - Loan-to-Value | returnFrame = 12 | In file |
| 12 Your deposit range | Primary action (save this goal) | 15 or 16 - see state map | goalSaved = true; checkpoint-amount = 0.75 x deposit-target | Assumed |
| 12 Your deposit range | Back | 11 Check your figures | none | Assumed |
| 13 Loan-to-Value | "Want more on this?" | 13b Loan-to-Value - video and diagram | returnFrame = 13 | In file |
| 13 Loan-to-Value | Back | returnFrame (12, 15 or 16) | none | Assumed |
| 13b Video and diagram | Close or scrim tap | 13 Loan-to-Value | Explainer card state = video-seen | Assumed |
| 15 Tracker - below checkpoint | "What rates are like at this Loan-to-Value" | 13 Loan-to-Value | returnFrame = 15 | In file |
| 15 Tracker - below checkpoint | "On track for" provenance caption | 29 How we worked out your saving amount | returnFrame = 15 | In file |
| 15 Tracker - below checkpoint | Tap the locked row ("Unlocks at ...") | 15 (in place) | none - Milestone tracker state = locked, explanatory only | In file |
| 15 Tracker - below checkpoint | Back | 01 Home | none | Assumed |
| 16 Tracker - checkpoint reached | "Ready to check" | 17 Mortgage in Principle | mipUnlocked = true | In file |
| 16 Tracker - checkpoint reached | "What rates are like at this Loan-to-Value" | 13 Loan-to-Value | returnFrame = 16 | In file |
| 16 Tracker - checkpoint reached | Back | 01 Home | none | Assumed |
| 17 Mortgage in Principle | "What this step does" learn-more link | 18 What a Mortgage in Principle is | returnFrame = 17 | In file |
| 17 Mortgage in Principle | Primary continue | 19 Before you run the check | none | Assumed |
| 17 Mortgage in Principle | Back | 16 Tracker - checkpoint reached | none | Assumed |
| 18 What a Mortgage in Principle is | Continue | 19 Before you run the check | none | Assumed |
| 18 What a Mortgage in Principle is | Back | 17 Mortgage in Principle | none | Assumed |
| 19 Before you run the check | Expand any chevron section | 19 (in place) | Accordion state = open - no figures change | In file |
| 19 Before you run the check | Edit a "We've already got" figure | 19 (in place) | That Data variable overridden; provenance switches to entered | Assumed |
| 19 Before you run the check | "Run the check" | 19b Running your check | checkRunAt set; soft search recorded | In file |
| 19 Before you run the check | Back | 17 Mortgage in Principle | none | Assumed |
| 19b Running your check | Processing completes, criteria met | 20 Result - likely to be considered | borrow-low, borrow-high, max-property | In file |
| 19b Running your check | Processing completes, criteria not met | 21 Result - not yet | gap = deposit-target - saved-toward-deposit | In file |
| 20 Result - likely to be considered | "How we worked out your borrowing estimate" | 31 How we worked out your borrowing estimate | returnFrame = 20 | In file |
| 20 Result - likely to be considered | Flag row ("something looks wrong") | Feedback / Report sheet | reportOpen; result unchanged | In file (component) |
| 20 Result - likely to be considered | Back or done | 16 Tracker - checkpoint reached | none | Assumed |
| 21 Result - not yet | Back to my deposit | 15 Tracker - below checkpoint | none | Assumed |
| 21 Result - not yet | Assumptions link | 31 How we worked out your borrowing estimate | returnFrame = 21 | Assumed |
| 21 Result - not yet | Flag row ("something looks wrong") | Feedback / Report sheet | reportOpen; result unchanged | In file (component) |
| 29 / 30 / 31 sheets | Close or scrim tap | returnFrame | none | Assumed |
| 32 Where these figures come from | "Connect another bank through open banking" | Out of prototype scope - stub screen | none | In file |
| 32 Where these figures come from | Close | returnFrame | none | Assumed |
| 33 Prototype settings | Any toggle | Re-renders the current frame | theme, textSize, stage, resultOutcome set globally | In file |

## 2. State and branching

Variant names follow the component properties already in the library (`prefilled-inferred`, `prefilled-estimated`, `entered`, `error`, `locked`, `complete`). Rows marked "No frame drawn" are states the build will hit that have no wireframe yet; each needs either a frame or a written rule before the prototype is tested.

| Screen | Variant | Condition | Data and calculation | Gap |
|---|---|---|---|---|
| 01 Home | default | Always | balance (mock account data) |  |
| 02 Journey overview | default | Always | none |  |
| 03 Consent and linked accounts | assigned / unassigned | Account group membership | Account rows, variant = assigned / unassigned |  |
| 03 Consent and linked accounts | all-selected / some-selected | Selection count vs account count | Checkbox state = checked / indeterminate |  |
| 03b Move this account | default | selectedAccountId set | Account name, balance |  |
| 05 What we can see | prefilled-inferred | Every input read from an account | money-in, essential-spending, left-over; provenance = read |  |
| 05 What we can see | entered | User overrides the headline figure | left-over; provenance/left-over = entered |  |
| 05 What we can see | breakdown open / closed | breakdownOpen toggle; opens by default | Proportion rows sourced from money-in and essential-spending |  |
| 05 What we can see | error | left-over <= 0, or entered value exceeds money-in | Figure state = error | No frame drawn |
| 06 What we found | emergency fund covered | emergency-fund >= 3 x monthly essential-spending | emergency-fund, essential-spending |  |
| 06 What we found | emergency fund short | emergency-fund < 3 x monthly essential-spending | As above, with a different message | No frame drawn |
| 06 What we found | deposit accounts assigned | At least one account assigned to the deposit set | saved-toward-deposit, unassigned |  |
| 06 What we found | no accounts assigned | saved-toward-deposit = 0 | Results / Empty state | No frame drawn |
| 08 Ready for the calculator | default | goal = house | property-value (area average), deposit-pct (default) |  |
| 09a Property and deposit | empty | property-value = null | Continue disabled |  |
| 09 Property and deposit | filled | property-value set and within plausible bounds | deposit-target = property-value x deposit-pct |  |
| 09b Property and deposit | above the Lifetime ISA cap | Set the binding rule: annual LISA payment > 4,000, or property-value > 450,000 | deposit-pct, property-value; lisaCapBreached | Confirm which rule |
| 09 Property and deposit | error | Non-numeric, zero, or implausible property-value | Figure state = error | No frame drawn |
| 10 How you'll save | solveFor = date | User picks a monthly amount | savings-rate given; months-to-target solved with 4.1% AER, monthly compounding |  |
| 10b Date stepper variant | solveFor = amount | User picks a target date | months-to-target given; savings-rate solved |  |
| 10 / 10b How you'll save | error | savings-rate > left-over, or target date in the past | Slider or stepper state = error | No frame drawn |
| 11 Check your figures | read-only rows | No figure edited | All six rows, provenance = read or derived |  |
| 11 Check your figures | edited rows | Any figure overridden upstream | Affected row provenance = entered |  |
| 12 Your deposit range | within the chart window | months-to-target <= 60 | Growth chart plotted to 5 years, thresholds at 5, 10, 15% | **Still 5/10/15, but now a FIXED REFERENCE rather than a match.** When this row was written the whole screen answered at 5/10/15 - the headline was a 5-15% deposit range and the timing rows were 5/10/15, so the chart's lines matched both. `DECISIONS.md` D72 replaced the headline with the participant's own deposit and the timing rows with a comparison windowed on their selection, so the chart is the only part of the screen that no longer follows their choice. It is kept fixed deliberately: windowing it puts the savings curve at 26.4% of the plot at a 25% deposit, and showing growth is the chart's only job. `chartReferenceCaption` says so on screen, and a second clause fires where the goal clears the top line - which D70's stamp duty makes the case at three of the five chip values. See D72's amendment. |
| 12 Your deposit range | beyond the chart window | months-to-target > 60 | Axis extends, or the target is flagged as out of reach | No frame drawn |
| 12 Your deposit range | unreachable | savings-rate = 0 | Results / Empty state | No frame drawn |
| 13 Loan-to-Value | band highlighted | Row matching the user's ltv band | ltv = loan-amount / property-value; rate table by band |  |
| 13b Video and diagram | video-unseen / video-seen | Whether the explainer has been opened before | Media placeholder state |  |
| 15 Deposit tracker | below checkpoint | saved-toward-deposit < checkpoint-amount | checkpoint-amount = 0.75 x deposit-target; Milestone tracker state = locked |  |
| 16 Deposit tracker | checkpoint reached | saved-toward-deposit >= checkpoint-amount | Milestone tracker state = current; mipUnlocked = true |  |
| 15 / 16 Deposit tracker | goal met | saved-toward-deposit >= deposit-target | Milestone tracker state = complete | No frame drawn |
| 15 / 16 Deposit tracker | this month rows | Always | Saved (from transfers), interest earned (from savings accounts), on-track-for range |  |
| 17 Mortgage in Principle | unlocked | mipUnlocked = true | none |  |
| 17 Mortgage in Principle | locked | mipUnlocked = false - reached only by deep link | Entry point hidden on 15 | No frame drawn |
| 19 Before you run the check | complete | All five held figures available | Salary, net income, outgoings, credit commitments, deposit saved; all tick list state = checked |  |
| 19 Before you run the check | incomplete | Any held figure missing, for example no salary credit detected | Affected row needs manual entry | No frame drawn |
| 19b Running your check | processing | Between run and result | Processing state component; soft search only |  |
| 20 Result - likely to be considered | positive-outcome | Criteria met at the current property target | borrow-low, borrow-high, max-property = borrow-high + saved-toward-deposit |  |
| 21 Result - not yet | needs-work-outcome | Criteria not met | gap = deposit-target - saved-toward-deposit |  |
| 29 / 30 / 31 / 32 | static | Opened from any provenance caption | Assumption text, rate data date, account activity date |  |
| 33 Prototype settings | controls | Always available in the prototype build only | theme, textSize, mode, stage, resultOutcome |  |

## 3. Screen inventory

Shared vocabulary between the Figma file and the code. The frame name is the system of record; the route is what the build uses. Where two frames share a route they are variants of one screen, not two screens.

| Figma frame name | Figma page | Route | Purpose | Status |
|---|---|---|---|---|
| 01 Home - Your first home entry point | 01 Entry and consent | /home | Bank home with the feature entry point | Reviewed |
| 02 Journey overview | 01 Entry and consent | /journey | What the feature does and the guidance framing | Reviewed |
| 03 Consent and linked accounts | 01 Entry and consent | /consent | Account selection and what each account is for | Amended - DECISIONS.md D28 |
| 03b Move this account | 01 Entry and consent | /consent/move-account | Bottom sheet to reassign an account to the deposit set | Reviewed |
| 04 Consent declined | 01 Entry and consent | - | General-figures route when permission is withheld; out of scope | Removed - DECISIONS.md D28 |
| 05 What we can see | 02 Personalised savings | /position | Monthly position read from accounts | Reviewed |
| 05b What we can see - estimate mode | 02 Personalised savings | - | Same screen where some inputs are estimated; out of scope | Removed - DECISIONS.md D28 |
| 06 What we found | 02 Personalised savings | /position/summary | Emergency fund and deposit position; goal confirmation | Reviewed |
| 07 Generic savings goal | 02 Personalised savings | - | Non-house goals; out of scope | Remove |
| (no frame) Bank goals area | - | /goals | The bank's own goals area: short- and long-term pots, and one card into the deposit calculator. Where frame 06's "save for something else" branch lands. NOT frame 07 - no goal-setting flow | Added - DECISIONS.md D21 |
| 08 Ready for the calculator | 02 Personalised savings | /goal-check | Checkpoint before the calculator | Reviewed |
| 09 Deposit calculator - property and deposit | 03 Deposit calculator | /calculator/property | Property value and deposit percentage | Reviewed |
| 09a Before a value is entered | 03 Deposit calculator | /calculator/property (empty) | Empty state of the same step | Reviewed |
| 09b Above the Lifetime ISA cap | 03 Deposit calculator | /calculator/property (cap) | Cap warning variant | Reviewed |
| 10 Deposit calculator - how you'll save | 03 Deposit calculator | /calculator/saving | Monthly amount route | Reviewed |
| 10b Date stepper variant | 03 Deposit calculator | /calculator/saving?solve=amount | Target date route | Reviewed |
| 10c Leave this for now? | 03 Deposit calculator | /calculator/exit | Exit confirmation sheet | Reviewed |
| 11 Deposit calculator - check your figures | 03 Deposit calculator | /calculator/review | Review with provenance and change links | Reviewed |
| 12 Deposit calculator - your deposit range | 03 Deposit calculator | /calculator/result | Deposit range, growth chart, timings | Reviewed |
| 13 Deposit calculator - Loan-to-Value | 04 Understanding and tracking | /learn/ltv | Loan-to-Value explainer and rate table | Reviewed |
| 13b Loan-to-Value - video and diagram | 04 Understanding and tracking | /learn/ltv/video | Explainer sheet | Reviewed |
| 15 Deposit tracker - below checkpoint | 04 Understanding and tracking | /tracker | Progress before the 75% checkpoint | Reviewed |
| 16 Deposit tracker - checkpoint reached | 04 Understanding and tracking | /tracker (unlocked) | Progress at or past the checkpoint | Reviewed |
| 17 Mortgage in Principle | 05 Mortgage in Principle | /mip | Entry to the eligibility check | Reviewed |
| 18 What a Mortgage in Principle is | 05 Mortgage in Principle | /mip/about | Comprehension screen before the check | Reviewed |
| 19 Before you run the check | 05 Mortgage in Principle | /mip/pre-check | Held figures, what is still asked, what to expect | Reviewed |
| 19b Running your check | 05 Mortgage in Principle | /mip/running | Processing state | Reviewed |
| 20 Result - likely to be considered | 05 Mortgage in Principle | /mip/result/likely | Positive outcome and next steps | Reviewed |
| 21 Result - not yet | 05 Mortgage in Principle | /mip/result/not-yet | Shortfall outcome and next steps | Reviewed |
| 29 How we worked out your saving amount | 06 Assumptions and sources | /assumptions/saving | Assumptions behind the savings figures | Reviewed |
| 30 How we worked out your deposit and rates | 06 Assumptions and sources | /assumptions/deposit | Assumptions behind deposit and rate ranges | Reviewed |
| 31 How we worked out your borrowing estimate | 06 Assumptions and sources | /assumptions/borrowing | Assumptions behind the borrowing estimate | Reviewed |
| 32 Where these figures come from | 06 Assumptions and sources | /assumptions/sources | Provenance, what cannot be seen, how to correct | Reviewed |
| 33 Prototype settings | 07 Prototype controls | /settings | Scenario switches for testing sessions | Reviewed |
| 14, 22 to 28 | - | - | Numbers not allocated to a frame; either fill or renumber before build | Gap |

## 4. Derived figures

Figures shown in the wireframes are consistent with these: a 19,000 deposit is 10% of a 190,000 property, the checkpoint of 14,250 is 75% of 19,000, and the 4,400 shortfall on frame 21 is 19,000 less 14,600 saved.

| Figure | Rule |
|---|---|
| deposit-target | property-value x deposit-pct |
| loan-amount | property-value - deposit-target |
| ltv | loan-amount / property-value |
| checkpoint-amount | 0.75 x deposit-target |
| left-over | money-in - essential-spending |
| months-to-target | Solved from savings-rate and saved-toward-deposit at 4.1% AER, compounded monthly, paid at the start of each month |
| on-track-for | months-to-target expressed as a range, low and high |
| max-property | borrow-high + saved-toward-deposit |
| gap (21 Result - not yet) | deposit-target - saved-toward-deposit |

## 5. Regulatory anchors

| Constraint | Where it comes from and how it shows up |
|---|---|
| Guidance, not advice | FCA PERG 4.6, in particular PERG 4.6.25B(5) on eligibility tools. Every result screen carries the guidance line and the adviser-scope line. |
| Repossession warning | MCOB 3A. Not the superseded MCOB 3.6.13R. |
| Automated decision-making | Data (Use and Access) Act 2025, Articles 22A to 22D. Three commitments: a way to push back (Feedback / Report sheet), plain wording where something is automated, and visible sources. |
| Deposit protection | FSCS, 120,000 per person. Shown on 03 only, for accounts held with the bank. |
| Credit search | Soft search only at 19b. Any hard search sits outside this prototype. |

## 6. State variables

Taken from the `Data` variable set in the Figma file. Use these names in the code so a value can be traced from screen to model.

`saved-toward-deposit`, `emergency-fund`, `unassigned`, `money-in`, `essential-spending`, `left-over`, `property-value`, `deposit-pct`, `deposit-target`, `loan-amount`, `ltv`, `monthly-low`, `monthly-high`, `savings-rate`, `months-to-target`, `on-track-for`, `checkpoint-amount`, `borrow-low`, `borrow-high`, `max-property`.

Each figure carries a provenance value: `read` (from an account), `derived` (calculated), `estimated` (modelled where the bank cannot see), or `entered` (typed by the user). Provenance drives the caption under the row and must update when a figure is edited.

## 7. Scenario controls (frame 33)

| Control | Values |
|---|---|
| Theme | Greyscale, Brand |
| Text size | Default, Large |
| Stage | Setting up, Saving, Ready to check |
| Result | Likely, Not yet |

These set global state and re-render the current screen. They exist for testing sessions and are not part of the feature.
