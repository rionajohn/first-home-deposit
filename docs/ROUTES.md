# Routes - facilitator reference

Session crib sheet. Base URL + the hash. Verified against the running build, not the spec.

**Read this first.** `#/settings` (frame 33) is the only way to set a session up without clicking
through the journey, and **Journey stage** is the control that does it - the other three change
appearance or pick a variant and seed no figures. There is still no URL that jumps you to a
mid-journey screen: type `#/settings`, tap a stage, then go to the screen you want. Any screen marked
**needs journey** below is reachable once the stage has given the session a goal, or by clicking the
spine from `#/home`. `#/reset` clears everything and returns to `#/home` - use between participants.

(The `mode` control this paragraph used to name is gone - `DECISIONS.md` D28 removed it with the
account-linking choice.)

## After a deploy, before the first participant

**A tab that was already open before the deploy will not pick the new build up properly, and the
symptom is silent**: Insights keeps redirecting to `#/calculator/property` as though no goal had
ever been set. The session state lives in `sessionStorage`, which is per tab and survives every
reload, so the app treats that tab as a restored session and never applies the opening stage
(`GAPS.md` G66). Nothing on screen says why.

Do one of these, in this order of preference:

1. **Open the participant link in a brand-new tab.** A new tab has no stored session, so the
   opening stage applies and Insights lands on the tracker. This is the reliable one and needs no
   checking.
2. **Or reload the tab first, confirm the new build is running, then type `#/reset` once.** The
   order is the whole point: a `#/reset` typed before the new code is running executes the previous
   build's reset, which is exactly the mistake `DECISIONS.md` D49 was written after.

**`#/settings` is how you tell which build is running.** Its footer reads "Build vNN. Figures are
illustrative throughout.", and that line is rendered from the constant compiled into the modules
executing right now, so it cannot disagree with them. If a second line appears saying "Downloaded
and waiting for a reload: vNN.", a newer build has been fetched but is **not** the one running:
reload before doing anything else. See `DECISIONS.md` D49.

This is a per-deploy procedure, not a per-participant one. `#/reset` between participants is still
the separate habit described above.

## Frame 33 controls: what each one actually does

| Control | Values | Real effect |
|---|---|---|
| Theme | Greyscale, Brand | None yet - both render the same palette |
| Text size | Default, **Large** | Scales all type ×1.15, every screen |
| Journey stage | Setting up, **Saving**, **Ready to check** | **Sets the session up.** See the table below - this is what makes `#/tracker` and the MIP flow reachable without running the calculator |
| MIP outcome | Likely, **Not yet** | Selects 20 vs 21 when 19b resolves |

### What each Journey stage gives you

Tap it on `#/settings`, then go where you want. Figures are the same every time - the stage replays
what the calculator would have committed, it does not invent anything (`DECISIONS.md` D45).

| Stage | Property / deposit | Target | Checkpoint | Saved | Tap Insights and you land on |
|---|---|---|---|---|---|
| **Setting up** | - | - | - | £8,950 | **09** `#/calculator/property` - the empty state, unchanged |
| **Saving** | £240,000 @ 10% | £24,000 | £18,000 | £8,950 | **15** `#/tracker`, below checkpoint, MIP milestone locked |
| **Ready to check** | £240,000 @ 10% | £24,000 | £18,000 | £18,000 | **16** `#/tracker`, checkpoint reached, MIP milestone available |

**Ready to check is the Saving stage moved forward, not a different goal.** It is Saving with the
tracker's own skip-ahead control applied, so the goal figures are identical and only the savings
position differs. On track for reads 45–55 months at Saving and 17–21 at Ready to check.

**Setting up is a full reset of the goal.** Selecting any stage clears whatever the last participant
left - a run through the MIP flow, an edited account selection, a skipped-ahead position - so you do
not need `#/reset` between stages. `#/reset` is still what you want between *participants*, because
it also clears theme, text size and MIP outcome.

**The stage and the tracker's skip-ahead control are separate, and are meant to be.** Journey stage
says whether the session has a goal; skip-ahead says where in it you are showing. So frame 33 can
read "Ready to check" while the tracker's control sits at "Now" - that is the session at the Saving
position, not a bug. `DECISIONS.md` D38 as amended.

**A stage is a starting point, not a lock.** If the participant then runs the calculator with their
own figures, the tracker follows *their* entries and frame 33 keeps showing whichever stage you set.

## Screens

Click path is from `#/home`. "Cold" = type the URL with an empty session.

| Frame | Name | Hash URL | Cold | Shortest click path from #/home | State needed first |
|---|---|---|---|---|---|
| 01 | Home | `#/home` | ✅ | - | none |
| 02 | Journey overview | `#/journey` | ✅ | "See what's involved" | none |
| 03 | Your accounts | `#/consent` | ✅ | → "Show me what's possible" | none |
| 03b | Move this account | `#/consent/move-account` | ❌ → 03 | 03 → tap any account row | `selectedAccountId` |
| 05 | What we can see | `#/position` | ✅ | 03 → "Continue" | none (seeded at session start) |
| 06 | What we found | `#/position/summary` | ✅ | 05 → "Looks right" | none (seeded at session start) |
| - | Your goals | `#/goals` | ✅ | Goals tab · or 06 → "Not right now - save for something else" | none - but **which bridge card it shows depends on the goal**, see below |
| 08 | Ready for the calculator | `#/goal-check` | ✅ | 06 → "Yes, keep going" | none (seeded at session start) |
| 09 | Property and deposit | `#/calculator/property` | ✅ | 08 → "Open the deposit calculator" | none |
| 09a | …before a value is entered | `#/calculator/property` | ✅ | same - it is 09's empty state | `property-value` = null |
| 09b | …above the Lifetime ISA cap | `#/calculator/property` | ✅ | 09 → type **over £450,000** | `property-value` > 450000 |
| 10 | How you'll save | `#/calculator/saving` | ❌ → 09 | 09 → value + deposit % → "Continue" | `deposit-target` |
| 10b | …date stepper variant | `#/calculator/saving` | ❌ → 09 | 10 → segmented control → "Set a target date" | as 10 + `solveFor` = amount |
| 10c | Leave this for now? | `#/calculator/exit` | ✅ | 09 → "Save and exit" | none |
| 11 | Check your figures | `#/calculator/review` | ❌ → 09 | 10 → "Continue" | `savings-rate` (**needs journey**) |
| 12 | Your deposit range | `#/calculator/result` | ❌ → 09 | 11 → "See what this means" | `deposit-target` + `months-to-target` (**needs journey**) |
| 13 | Loan-to-Value | `#/learn/ltv` | ❌ → 09 | 12 → "What is Loan-to-Value?" · or 15/16 → "What rates are like…" | `property-value` + `deposit-pct` (**needs journey**) |
| 13b | LTV video and diagram | `#/learn/ltv/video` | ✅ | 13 → "Watch: what Loan-to-Value means" | none |
| 15 | Tracker - below checkpoint | `#/tracker` | ❌ → 09 | 12 → "See what this means for borrowing" | `checkpoint-amount` (**needs journey**); saved < 75% of target |
| 16 | Tracker - checkpoint reached | `#/tracker` | ❌ → 09 | same, with a **smaller target** - see recipes | saved ≥ `checkpoint-amount` |
| 17 | Mortgage in Principle | `#/mip` | ❌ → 09 | 16 → "Check my Mortgage in Principle" | `deposit-target` + `mipUnlocked` |
| 18 | What a MIP is | `#/mip/about` | ✅ | 17 → "What does a Mortgage in Principle (MIP) mean?" | none |
| 19 | Before you run the check | `#/mip/pre-check` | ❌ → 09 | 17 → "Start the check" | `deposit-target` (**needs journey**) |
| 19b | Running your check | `#/mip/running` | ❌ → 09 | 19 → "Start the check" | `deposit-target`; self-resolves in ~3s |
| 20 | Result - likely | `#/mip/result/likely` | ❌ → 09 | 19b resolves, MIP outcome = **Likely** | `borrow-high` (**needs journey**) |
| 21 | Result - not yet | `#/mip/result/not-yet` | ❌ → 09 | 19b resolves, MIP outcome = **Not yet** | `deposit-target` (**needs journey**) |
| - | Talk to an adviser | `#/mip/adviser` | ✅ | 20 → "Talk to someone about it" | none |
| 29 | How we worked out your saving amount | `#/assumptions/saving` | ✅ | 08 → "How did we work this out?" | none (falls back to `#/home`) |
| 30 | …your deposit and rates | `#/assumptions/deposit` | ✅ | 12 → "How did we work this out?" | none |
| 31 | …your borrowing estimate | `#/assumptions/borrowing` | ✅ | 20 → "See how we worked this out" | none |
| 32 | Where these figures come from | `#/assumptions/sources` | ✅ | 05 → "Where these figures come from" | none |
| 33 | Prototype settings | `#/settings` | ✅ | **URL only** - no on-screen link anywhere | none |

**Cold ❌ cascades.** Typing `#/tracker`, `#/mip`, `#/mip/result/likely` etc. on an empty session lands
you on **09** (`#/calculator/property`), not on the screen you typed - each guard redirects to the one
before it, and they chain. The cascade is shorter than it was: the guards on 05, 06 and 08 are gone,
because the figures they waited for are seeded at session start.

**A session is only "empty" until you set a Journey stage.** Every ❌ above is about a session with no
goal. Driven in the browser, one clean session per URL, at **Saving** and at **Ready to check** -
identical results at both:

| Typed URL | What happens once a stage is set |
|---|---|
| 10, 11, 12, 13, 15/16, 19, 21 | **Resolve.** The screen you typed is the screen you get |
| 17 `#/mip` | Resolves, but draws its **locked** variant ("Not unlocked yet") - `mipUnlocked` is still false |
| 19b `#/mip/running` | Resolves and then self-resolves to the result in ~3s, as designed |
| 20 `#/mip/result/likely` | Still redirects, to `#/mip` - it needs `borrow-high`, which only a real 19b run commits |

**The stage deliberately does not set `mipUnlocked`.** That is written by the tracker's own "Check my
Mortgage in Principle" control, together with the entry point the flow's close X reads, so take that
tap rather than typing `#/mip` - it is one tap from the tracker at **Ready to check**, and it is what
makes the flow's exits behave.

**Query strings do nothing.** `?mode=estimate` and `?solve=amount` appear in `build-spec.md` §3 but no
screen reads them, and there is no longer a mode for the first one to select. Variants come from
state: the on-screen segmented control for 10b.

## What `#/goals` shows, and when

The long-term section carries **exactly one** bridge card into the feature, and which one depends
only on whether a deposit goal has been set. **A card is shown only where the screen behind it will
actually render** - `#/goals` does not advertise a door that redirects (`DECISIONS.md` D44). Two
states, and nothing else on the screen changes between them:

| Session state | Card shown | Leads to | Frame 33 stage |
|---|---|---|---|
| No deposit goal set | **"What would a deposit actually involve?"** | `#/calculator/property` | **Setting up** |
| Goal set, at any savings position | **"How is your deposit going?"** | `#/tracker` | **Saving** and **Ready to check** |

**There used to be a third state.** At or above the checkpoint the screen drew both cards. It was
removed for consistency, deliberately and at a cost you should know about (D44, fifth amendment).

**The cost, and it matters for a session.** `tracker.js` draws its "Adjust my goal" secondary on the
below-checkpoint variant **and no other**. So once a participant is at or above the checkpoint there
is **no nearby route to the deposit calculator at all** - not from `#/goals`, not from the tracker.
If you need the calculator from that state, type `#/calculator/property`. Below the checkpoint it is
still one tap on from the tracker.

**If the card you expect is missing, the session is in a different state than you think** - check
the goal with the tracker recipes below rather than assuming the screen is broken. The Insights tab
is unaffected in both states: it always resolves to `#/tracker` and redirects when there is no goal.

## Journey spine - 11 clicks, #/home to #/tracker

`See what's involved` → `Show me what's possible` → `Continue` → `Looks right` → `Yes, keep going`
→ `Open the deposit calculator` → type property value → tap a deposit % → `Continue` → `Continue`
→ `See what this means` → `See what this means for borrowing`

## Tracker recipes - mock accounts give a fixed £8,950 saved

**Quicker than any of these: set a Journey stage on `#/settings`.** These recipes are still here
because they are how you reach a state the stages do not cover - a goal met, or a target you have
chosen yourself. Use a stage when you want the ordinary below-checkpoint or checkpoint-reached
screen, and a recipe when you want a specific number.

Set at frame 09. Checkpoint is 75% of target; target is property × deposit %.

| Want | Enter at 09 | Target | Checkpoint | Result |
|---|---|---|---|---|
| **15** below checkpoint | £280,000 @ 5% | £14,000 | £10,500 | 8,950 < 10,500 → locked |
| **16** checkpoint reached | £200,000 @ 5% | £10,000 | £7,500 | 8,950 ≥ 7,500 → MIP unlocks |
| **goal met** fallback | £150,000 @ 5% | £7,500 | £5,625 | 8,950 ≥ 7,500 → goal met |
| - *(for comparison)* | **Journey stage: Saving / Ready to check** | £24,000 | £18,000 | 8,950 → **15**; 18,000 → **16** |

## The eleven no-frame-drawn states

Every recipe below was driven in the browser and confirmed to produce the state.

| # | Frame | State | How to produce it |
|---|---|---|---|
| 1 | 05 | error | Tap the big figure, type **9999** (above money-in £2,240). `0` also works |
| 2 | 06 | emergency fund short | At 03, tap **Emergency fund** → "Neither of those" → Save, then continue |
| 3 | 06 | no accounts assigned | At 03, untick **all four** accounts under "Toward your deposit" individually, then "Continue" |
| 4 | 09 | error | Type `0` into the property value field. **Letters won't work** - the field rejects them |
| 5 | 10 | error (over left-over) | ⚠️ **Not reachable by dragging** - see note below |
| 6 | 10b | error (past date) | Segmented control → "Set a target date", then tap the year **down** arrow ~8× |
| 7 | 12 | beyond the chart window | £450,000 @ **20%** at 09, then both slider handles down to ~£1 at 10 |
| 8 | 12 | unreachable | At 10 drag the **lower** handle to £0 **first**, then the upper. Continue → 11 → 12 |
| 9 | 15 / 16 | goal met | £150,000 @ 5% at frame 09 - see recipes above |
| 10 | 17 | locked | Save a goal, then type `#/mip` **without** pressing "Check my Mortgage in Principle" |
| - | 19 | incomplete | ⚠️ **No longer reachable.** It was produced by Data = General, and general mode is gone (`DECISIONS.md` D28). The variant is still built: each of income, outgoings and deposit saved falls back to its own "!" row when its figure is null |

The last row is a twelfth state: `build-spec.md` §2 lists 19-incomplete alongside the eleven. It was
the only one driven by a frame 33 control rather than by participant input, which is why it is the
only one the D28 removal cost a recipe for.

**#8 handle order matters.** Each handle is clamped against the other, so dragging the upper one to
£0 first does nothing. Lower handle first.

**#5 is effectively unreachable in a session.** Frame 10's slider `max` *is* left-over, and the typed
figure box clamps to the same value - no participant input can push the monthly amount above what's
left over. The only route is: commit the range at its maximum, go back to 05 via 11's "Change" link,
lower the left-over figure, then return to 10. Don't plan a task around this one.

## If a screen won't load

1. Typed a URL and landed on 09 or 03 → that screen needs a goal. Set **Journey stage** on
   `#/settings`, or click the spine.
2. Wrong variant → check `#/settings` Journey stage and MIP outcome, then re-enter the screen. (The
   "Data" control this line used to name is gone - `DECISIONS.md` D28.)
3. Stale figures from the last participant → `#/reset`.
4. Journey stage looks wrong → it only writes on the tap. Re-tap the stage on `#/settings`; that
   re-seeds from scratch and clears anything the session picked up since.
5. A bridge card is missing from `#/goals` → that is deliberate, and tells you the goal state. See
   "What `#/goals` shows, and when" above.

---

## Frames 04 and 05b are gone

The account-linking choice was removed on 22 August 2026 (`DECISIONS.md` D28). Frame 04 (consent
declined / general figures) and frame 05b (estimate mode) went with it, along with the `#/consent/
declined` route. `#/consent/declined` now falls through to the router's "not built yet" placeholder,
the same as any other URL outside the section 3 inventory.

The read figures - `money-in`, `essential-spending`, `left-over` and the three account totals - are
seeded when the session starts rather than by frames 03 and 05, which is why the Cold column above
turned green on 05, 06 and 08: those screens no longer have anything to redirect for.
