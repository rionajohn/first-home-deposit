# Routes — facilitator reference

Session crib sheet. Base URL + the hash. Verified against the running build, not the spec.

**Read this first.** `#/settings` (frame 33) sets **only** `theme`, `textSize`, `mode`, `resultOutcome`
— it seeds **no figures**. There is no URL or setting that jumps you to a mid-journey screen with its
data filled in. Any screen marked **needs journey** below must be reached by clicking from `#/home`.
`#/reset` clears everything and returns to `#/home` — use between participants.

## Frame 33 controls: what each one actually does

| Control | Values | Real effect |
|---|---|---|
| Theme | Greyscale, Brand | None yet — both render the same palette |
| Text size | Default, **Large** | Scales all type ×1.15, every screen |
| Journey stage | Setting up, Saving, Ready to check | **Nothing. Not read by any screen** — does not unlock the tracker or MIP |
| MIP outcome | Likely, **Not yet** | Selects 20 vs 21 when 19b resolves |

## Screens

Click path is from `#/home`. "Cold" = type the URL with an empty session.

| Frame | Name | Hash URL | Cold | Shortest click path from #/home | State needed first |
|---|---|---|---|---|---|
| 01 | Home | `#/home` | ✅ | — | none |
| 02 | Journey overview | `#/journey` | ✅ | "See what's involved" | none |
| 03 | Your accounts | `#/consent` | ✅ | → "Show me what's possible" | none |
| 03b | Move this account | `#/consent/move-account` | ❌ → 03 | 03 → tap any account row | `selectedAccountId` |
| 05 | What we can see | `#/position` | ✅ | 03 → "Continue" | none (seeded at session start) |
| 06 | What we found | `#/position/summary` | ✅ | 05 → "Looks right" | none (seeded at session start) |
| 08 | Ready for the calculator | `#/goal-check` | ✅ | 06 → "Yes, keep going" | none (seeded at session start) |
| 09 | Property and deposit | `#/calculator/property` | ✅ | 08 → "Open the deposit calculator" | none |
| 09a | …before a value is entered | `#/calculator/property` | ✅ | same — it is 09's empty state | `property-value` = null |
| 09b | …above the Lifetime ISA cap | `#/calculator/property` | ✅ | 09 → type **over £450,000** | `property-value` > 450000 |
| 10 | How you'll save | `#/calculator/saving` | ❌ → 09 | 09 → value + deposit % → "Continue" | `deposit-target` |
| 10b | …date stepper variant | `#/calculator/saving` | ❌ → 09 | 10 → segmented control → "Set a target date" | as 10 + `solveFor` = amount |
| 10c | Leave this for now? | `#/calculator/exit` | ✅ | 09 → "Save and exit" | none |
| 11 | Check your figures | `#/calculator/review` | ❌ → 09 | 10 → "Continue" | `savings-rate` (**needs journey**) |
| 12 | Your deposit range | `#/calculator/result` | ❌ → 09 | 11 → "See what this means" | `deposit-target` + `months-to-target` (**needs journey**) |
| 13 | Loan-to-Value | `#/learn/ltv` | ❌ → 09 | 12 → "What is Loan-to-Value?" · or 15/16 → "What rates are like…" | `property-value` + `deposit-pct` (**needs journey**) |
| 13b | LTV video and diagram | `#/learn/ltv/video` | ✅ | 13 → "Watch: what Loan-to-Value means" | none |
| 15 | Tracker — below checkpoint | `#/tracker` | ❌ → 09 | 12 → "See what this means for borrowing" | `checkpoint-amount` (**needs journey**); saved < 75% of target |
| 16 | Tracker — checkpoint reached | `#/tracker` | ❌ → 09 | same, with a **smaller target** — see recipes | saved ≥ `checkpoint-amount` |
| 17 | Mortgage in Principle | `#/mip` | ❌ → 09 | 16 → "Check my Mortgage in Principle" | `deposit-target` + `mipUnlocked` |
| 18 | What a MIP is | `#/mip/about` | ✅ | 17 → "What does a Mortgage in Principle (MIP) mean?" | none |
| 19 | Before you run the check | `#/mip/pre-check` | ❌ → 09 | 17 → "Start the check" | `deposit-target` (**needs journey**) |
| 19b | Running your check | `#/mip/running` | ❌ → 09 | 19 → "Start the check" | `deposit-target`; self-resolves in ~3s |
| 20 | Result — likely | `#/mip/result/likely` | ❌ → 09 | 19b resolves, MIP outcome = **Likely** | `borrow-high` (**needs journey**) |
| 21 | Result — not yet | `#/mip/result/not-yet` | ❌ → 09 | 19b resolves, MIP outcome = **Not yet** | `deposit-target` (**needs journey**) |
| — | Talk to an adviser | `#/mip/adviser` | ✅ | 20 → "Talk to someone about it" | none |
| 29 | How we worked out your saving amount | `#/assumptions/saving` | ✅ | 08 → "How did we work this out?" | none (falls back to `#/home`) |
| 30 | …your deposit and rates | `#/assumptions/deposit` | ✅ | 12 → "How did we work this out?" | none |
| 31 | …your borrowing estimate | `#/assumptions/borrowing` | ✅ | 20 → "See how we worked this out" | none |
| 32 | Where these figures come from | `#/assumptions/sources` | ✅ | 05 → "Where these figures come from" | none |
| 33 | Prototype settings | `#/settings` | ✅ | **URL only** — no on-screen link anywhere | none |

**Cold ❌ cascades.** Typing `#/tracker`, `#/mip`, `#/mip/result/likely` etc. on an empty session lands
you on **09** (`#/calculator/property`), not on the screen you typed — each guard redirects to the one
before it, and they chain. The cascade is shorter than it was: the guards on 05, 06 and 08 are gone,
because the figures they waited for are seeded at session start.

**Query strings do nothing.** `?mode=estimate` and `?solve=amount` appear in `build-spec.md` §3 but no
screen reads them, and there is no longer a mode for the first one to select. Variants come from
state: the on-screen segmented control for 10b.

## Journey spine — 11 clicks, #/home to #/tracker

`See what's involved` → `Show me what's possible` → `Continue` → `Looks right` → `Yes, keep going`
→ `Open the deposit calculator` → type property value → tap a deposit % → `Continue` → `Continue`
→ `See what this means` → `See what this means for borrowing`

## Tracker recipes — mock accounts give a fixed £8,950 saved

Set at frame 09. Checkpoint is 75% of target; target is property × deposit %.

| Want | Enter at 09 | Target | Checkpoint | Result |
|---|---|---|---|---|
| **15** below checkpoint | £280,000 @ 5% | £14,000 | £10,500 | 8,950 < 10,500 → locked |
| **16** checkpoint reached | £200,000 @ 5% | £10,000 | £7,500 | 8,950 ≥ 7,500 → MIP unlocks |
| **goal met** fallback | £150,000 @ 5% | £7,500 | £5,625 | 8,950 ≥ 7,500 → goal met |

## The eleven no-frame-drawn states

Every recipe below was driven in the browser and confirmed to produce the state.

| # | Frame | State | How to produce it |
|---|---|---|---|
| 1 | 05 | error | Tap the big figure, type **9999** (above money-in £2,240). `0` also works |
| 2 | 06 | emergency fund short | At 03, tap **Emergency fund** → "Neither of those" → Save, then continue |
| 3 | 06 | no accounts assigned | At 03, untick **all four** accounts under "Toward your deposit" individually, then "Continue" |
| 4 | 09 | error | Type `0` into the property value field. **Letters won't work** — the field rejects them |
| 5 | 10 | error (over left-over) | ⚠️ **Not reachable by dragging** — see note below |
| 6 | 10b | error (past date) | Segmented control → "Set a target date", then tap the year **down** arrow ~8× |
| 7 | 12 | beyond the chart window | £450,000 @ **20%** at 09, then both slider handles down to ~£1 at 10 |
| 8 | 12 | unreachable | At 10 drag the **lower** handle to £0 **first**, then the upper. Continue → 11 → 12 |
| 9 | 15 / 16 | goal met | £150,000 @ 5% at frame 09 — see recipes above |
| 10 | 17 | locked | Save a goal, then type `#/mip` **without** pressing "Check my Mortgage in Principle" |
| — | 19 | incomplete | ⚠️ **No longer reachable.** It was produced by Data = General, and general mode is gone (`DECISIONS.md` D28). The variant is still built: each of income, outgoings and deposit saved falls back to its own "!" row when its figure is null |

The last row is a twelfth state: `build-spec.md` §2 lists 19-incomplete alongside the eleven. It was
the only one driven by a frame 33 control rather than by participant input, which is why it is the
only one the D28 removal cost a recipe for.

**#8 handle order matters.** Each handle is clamped against the other, so dragging the upper one to
£0 first does nothing. Lower handle first.

**#5 is effectively unreachable in a session.** Frame 10's slider `max` *is* left-over, and the typed
figure box clamps to the same value — no participant input can push the monthly amount above what's
left over. The only route is: commit the range at its maximum, go back to 05 via 11's "Change" link,
lower the left-over figure, then return to 10. Don't plan a task around this one.

## If a screen won't load

1. Typed a URL and landed on 09 or 03 → that screen **needs journey**. Click the spine instead.
2. Wrong variant → check `#/settings` Data and MIP outcome, then re-enter the screen.
3. Stale figures from the last participant → `#/reset`.
4. Journey stage looks wrong → that control does nothing; use the recipes above.

---

## Frames 04 and 05b are gone

The account-linking choice was removed on 22 August 2026 (`DECISIONS.md` D28). Frame 04 (consent
declined / general figures) and frame 05b (estimate mode) went with it, along with the `#/consent/
declined` route. `#/consent/declined` now falls through to the router's "not built yet" placeholder,
the same as any other URL outside the section 3 inventory.

The read figures - `money-in`, `essential-spending`, `left-over` and the three account totals - are
seeded when the session starts rather than by frames 03 and 05, which is why the Cold column above
turned green on 05, 06 and 08: those screens no longer have anything to redirect for.
