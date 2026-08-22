# Figma audit: page "05 Mortgage in Principle"

Investigation only. Nothing in the Figma file was modified.

- File: `Do0LtU1O8JAmaLkCQ4P1Zd` (MSc. UEE Thesis)
- Page: **05 Mortgage in Principle**, node `104:195`
- Read on: 2026-08-22, via the Figma Plugin API against the live file
- Method: enumerated `page.children`, then walked each frame's subtree in document
  order collecting every visible TEXT node, empty container, out-of-bounds text,
  instance override state and Dev Mode annotation. Every statement below comes
  from the file, not from `docs/build-spec.md` or any other document.

## Contents of the page

The page has **7 top-level children**: 6 frames and 1 loose text note on the canvas.
No sections, no hidden nodes anywhere in the page subtree.

| # | Frame name (exact) | Node ID | Frame no. | What the screen does | Finished? | Annotation attached |
|---|---|---|---|---|---|---|
| 1 | `17 Mortgage in Principle` | `104:196` | 17 | Entry screen for the MIP step: says the user has saved three quarters of their deposit, lists what the step does in three ticked points, links to an explainer, and offers "Start the check" / "Not right now". | Finished. Full copy, no placeholders, both buttons labelled, regulatory guidance footer present. | None |
| 2 | `18 What a Mortgage in Principle is` | `104:1067` | 18 | Explainer screen: a 1 min 45 video with captions/transcript tabs, a short definition, a timeline visual, and three "what it is not" cards. Single "Got it" button. | **Unfinished in two places.** Contains the literal placeholder `[Visual aid]`, and three list rows carry an empty middle text slot (see below). | None |
| 3 | `19 Before you run the check` | `104:1132` | 19 | Pre-check summary: five ticked rows of data already held (salary, net income, outgoings, credit commitments, deposit), three expectation rows, then three expandable sections (what you'll still be asked / what having one can do for you / what to be aware of). Ends in "Start the check" / "Not right now". | Finished as copy. Three `caption-row` containers are empty, and the tick, radio and disclosure glyphs are typed characters, not vector icons (see below). | None |
| 4 | `19b Running your check` | `208:455` | 19b | Interstitial processing state: "Checking your details", soft-search reassurance, expected duration. | Finished but thin. The whole body is one `Content / Processing state` instance with no exposed properties and no overrides, so all its copy is the main component's. No buttons, no regulatory footer. | None |
| 5 | `20 Result - likely to be considered` | `104:1278` | 20 | Positive result: indicative borrowing range £152,000-£171,000, derived property ceiling, LTV, both regulatory risk warnings, two next steps, a full "How we worked this out" provenance block, and "Start my Mortgage in Principle" / "Keep saving for now". | Finished. No placeholders, no empty text, all figures populated. | None |
| 6 | `21 Result - not yet` | `104:1376` | 21 | Negative result: a £4,400 gap, what you'd need to borrow vs what a lender would typically offer, both regulatory risk warnings, three next steps, the same provenance block, and "Update my savings goal" / "See what changes this". | Finished. No placeholders, no empty text, all figures populated. | None |
| 7 | (loose TEXT node, not a frame) | `215:2068` | - | A note sitting on bare canvas at x -932, y 317, to the left of frame 17 and not attached to any frame. | n/a | Verbatim: "make the ticks and check boxes all consistent same with the information icons" |

### Note on annotations and comments

No frame or descendant on this page carries a Dev Mode **annotation** - `node.annotations`
is empty everywhere. There are no stickies, because this is a design file, not FigJam.

**File comments could not be read.** The Figma Plugin API does not expose the comment
thread API, so this audit cannot confirm whether pinned comments exist on these frames.
The only intent-bearing canvas text found is node `215:2068` above, plus the in-frame
build markers described below. If comments matter, they need the REST API
(`GET /v1/files/:key/comments`) or a manual look in the file.

### Note on in-frame build markers

Five of the six frames contain annotation instances that are part of the spec, not part
of the screen: `852 - fold` (a dashed line marking the iPhone viewport fold) and
`Pinned to the bottom of the viewport in build`. Both are listed under each frame below
but are separated from screen copy. Both sit partly outside their frame's bounds by
design, which is why the out-of-bounds check flags them; no actual screen copy overflows
its frame anywhere on this page.

---

## Full text, in reading order

Document order is used, which matches visual order because every frame is auto layout.
Build markers are listed last for each frame because that is where they fall in document
order, not where they fall visually.

### 17 Mortgage in Principle - `104:196` (393 x 881)

1. `9:41` (status bar)
2. `87` (status bar)
3. `Mortgage in Principle` (app bar title, set via the `title#6:1` component property)
4. `Mortgage in Principle`
5. `You've saved three quarters of your deposit, so this is now open to you.`
6. `What this step does`
7. `Shows how much a lender might be willing to lend you`
8. `Tells estate agents you're a credible buyer`
9. `Doesn't commit you to anything`
10. `What does a Mortgage in Principle (MIP) mean?`
11. `This is guidance based on your account activity. It is not financial advice and does not take account of everything about your situation.`
12. `Start the check`
13. `Not right now`

Build markers: `Pinned to the bottom of the viewport in build`, `852 - fold`

Empty containers: `dynamic-island`, `right-cell`, `indicator-bar`, `dashed-line` - all
structural primitives, none of them missing content.

### 18 What a Mortgage in Principle is - `104:1067` (393 x 1589)

1. `9:41`
2. `87`
3. `Mortgage in Principle`
4. `What a Mortgage in Principle is`
5. `1 min 45`
6. `Captions`
7. `Transcript`
8. `The short version`
9. `A Mortgage in Principle is an indication of how much a lender might be willing to lend you, based on your income and outgoings. It is not a commitment from the lender or from you.`
10. `[Visual aid]`
11. `Timeline: Mortgage in Principle, then offer on a property, then full mortgage application, then formal offer - showing where in the process this sits`
12. `What it is not`
13. `Not an application`
14. (empty string - node `I104:1095;6:607`)
15. `It does not start a mortgage application or commit you to one`
16. `Not a guarantee`
17. (empty string - node `I104:1100;6:607`)
18. `A lender can still say no after a full application and credit check`
19. `Not a credit agreement`
20. (empty string - node `I104:1105;6:607`)
21. `No money changes hands and no contract is created`
22. `An agreement in principle is not a mortgage offer. It is usually valid for 90 days and is subject to further checks.`
23. `This stays in your Explainers list, so you can come back to it.`
24. `This is guidance based on your account activity. It is not financial advice and does not take account of everything about your situation.`
25. `Got it`

Build markers: `852 - fold`, `Pinned to the bottom of the viewport in build`

**Unfinished signals:** `[Visual aid]` at item 10 is a literal placeholder standing in for
the timeline graphic described at item 11. Items 14, 17 and 20 are three empty TEXT nodes,
one per "what it is not" card - the same slot (`6:607`) in each of three instances of the
same list-row component, left blank rather than filled or hidden.

### 19 Before you run the check - `104:1132` (393 x 2652)

1. `9:41`
2. `87`
3. `Mortgage in Principle` (app bar, `back-with-title` variant)
4. `Before you run the check`
5. `We've already got`
6. `✓`
7. `Annual salary before tax`
8. `£38,000`
9. `From your salary payments`
10. `✓`
11. `Monthly income after tax`
12. `£2,240`
13. `✓`
14. `Regular outgoings`
15. `£1,860`
16. `From your direct debits and standing orders`
17. `✓`
18. `Existing credit commitments`
19. `£41 a month`
20. `A lender counts this separately. It's already taken off the income figure above.`
21. `✓`
22. `Deposit saved`
23. `£14,600`
24. `Across the accounts you assigned to your deposit`
25. `Here's what to expect`
26. `How long it takes`
27. `About 10 minutes`
28. `Credit check`
29. `A soft search only`
30. `How long the result lasts`
31. `Usually 90 days`
32. `This is a soft credit search. It will not affect your credit score and other lenders cannot see it.`
33. `What you'll still be asked`
34. `▲`
35. `○`
36. `Whether anyone is buying with you`
37. `○`
38. `Whether your income includes bonus or overtime`
39. `○`
40. `Where your deposit is coming from`
41. `○`
42. `The kind of property you're looking at`
43. `What having one can do for you`
44. `▲`
45. `Credibility with estate agents`
46. `Knowing your budget before you view`
47. `Speed at full application`
48. `No cost`
49. `What to be aware of`
50. `▲`
51. `It expires after around 90 days`
52. `It is not binding on the lender`
53. `A full application involves a hard credit check that does affect your credit file`
54. `The figure changes if your circumstances change`
55. `A mortgage is secured against your home. If you couldn't keep up the repayments, your home would be at risk.`
56. `This is guidance based on your account activity. It is not financial advice and does not take account of everything about your situation.`
57. `Start the check`
58. `Not right now`

Build markers: `Pinned to the bottom of the viewport in build`, `852 - fold` x3

**Unfinished signals:** three `caption-row` containers (`I104:1147;136:1566`,
`I104:1152;136:1566`, `I104:1157;136:1566`, each 317 x 18) are empty, one under each of
the three "Here's what to expect" rows. The tick, radio and disclosure marks at items
6/10/13/17/21, 34/44/50 and 35/37/39/41 are typed characters (`✓`, `○`, `▲`) in TEXT
nodes, not vector icon instances - unlike the `tick-circle` and `info-icon` components
used on frame 17. This is what the loose canvas note `215:2068` appears to be about.

### 19b Running your check - `208:455` (393 x 852)

1. `9:41`
2. `87`
3. `Mortgage in Principle`
4. `Checking your details`
5. `This is a soft credit search and will not affect your credit score.`
6. `This usually takes a few seconds`

Build marker: `852 - fold`

**State:** items 4 to 6 all come from a single `Content / Processing state` instance
(`208:483`) that exposes no component properties and carries no overrides, so this copy
is the main component's own. The frame has no buttons, no back or close action wired, and
no `Regulatory / Guidance disclaimer` footer, which every other content frame on this page
carries. It is the only frame on the page whose name is not a plain sequence number.

### 20 Result - likely to be considered - `104:1278` (393 x 2470)

1. `9:41`
2. `87`
3. `Your result`
4. `You'd likely be seen as a serious buyer`
5. `Based on your salary, deposit and commitments, a lender could be willing to lend in this range.`
6. `£152,000`
7. `-`
8. `£171,000`
9. `Indicative borrowing range`
10. `With your current deposit`
11. `This is an estimate based on the information we hold today. It is not an offer and your actual figures may be different.`
12. `With your £14,600 deposit, that's a property up to`
13. `£185,600`
14. `Loan-to-Value`
15. `around 92%`
16. `Based on`
17. `Salary, deposit and commitments`
18. `A mortgage is secured against your home. If you couldn't keep up the repayments, your home would be at risk.`
19. `An agreement in principle is not a mortgage offer. It is usually valid for 90 days and is subject to further checks.`
20. `What you could do next`
21. `1`
22. `Keep saving to lower your Loan-to-Value`
23. `A larger deposit could improve the rate you're offered`
24. `2`
25. `Talk to someone about it`
26. `Message us in the app and we'll connect you with a mortgage adviser today`
27. `Our advisers only advise on our own mortgages.`
28. `How we worked this out`
29. `We worked this out from what's already in your accounts, so you didn't have to fill anything in.`
30. `What we read`
31. `Your salary and your regular payments`
32. `The last 12 months`
33. `What we worked out`
34. `£1,860 essential spending, £380 left over`
35. `From your direct debits, standing orders and card payments`
36. `What we assumed`
37. `That last year is typical of this year`
38. `If your income or outgoings have changed, tell us and we'll redo it`
39. `See how we worked this out`
40. `This estimate was worked out automatically. You can tell us if you disagree with it, and you can ask us to have a person review it.`
41. `Something doesn't look right`
42. `This is guidance based on your account activity. It is not financial advice and does not take account of everything about your situation.`
43. `Start my Mortgage in Principle`
44. `Keep saving for now`

Build markers: `Pinned to the bottom of the viewport in build`, `852 - fold` x2

Empty containers: `filled-track`, `position-marker`, `remaining-track` (the borrowing-range
indicator's visual parts), plus a 361 x 1 `spacer` and the usual structural primitives.
None of these are missing content.

### 21 Result - not yet - `104:1376` (393 x 2538)

1. `9:41`
2. `87`
3. `Your result`
4. `You're not quite there yet`
5. `Based on what we can see today, the amount you'd need to borrow is above what a lender would typically offer. That changes as you keep saving.`
6. `£4,400`
7. `The estimated gap at your current property target`
8. `This is an estimate based on the information we hold today. It is not an offer and your actual figures may be different.`
9. `What you'd need to borrow`
10. `£175,400`
11. `What a lender would typically offer`
12. `around £171,000`
13. `Based on`
14. `salary, deposit and commitments`
15. `A mortgage is secured against your home. If you couldn't keep up the repayments, your home would be at risk.`
16. `An agreement in principle is not a mortgage offer. It is usually valid for 90 days and is subject to further checks.`
17. `What you could do next`
18. `1`
19. `Save around £4,400 more toward your deposit`
20. `Around 14 months at your current rate`
21. `2`
22. `Look at a property target closer to £185,600`
23. `Would close the gap now`
24. `3`
25. `Talk to someone about it`
26. `Message us in the app and we'll connect you with a mortgage adviser today`
27. `Our advisers only advise on our own mortgages.`
28. `How we worked this out`
29. `We worked this out from what's already in your accounts, so you didn't have to fill anything in.`
30. `What we read`
31. `Your salary and your regular payments`
32. `The last 12 months`
33. `What we worked out`
34. `£1,860 essential spending, £380 left over`
35. `From your direct debits, standing orders and card payments`
36. `What we assumed`
37. `That last year is typical of this year`
38. `If your income or outgoings have changed, tell us and we'll redo it`
39. `See how we worked this out`
40. `This estimate was worked out automatically. You can tell us if you disagree with it, and you can ask us to have a person review it.`
41. `Something doesn't look right`
42. `This is guidance based on your account activity. It is not financial advice and does not take account of everything about your situation.`
43. `Update my savings goal`
44. `See what changes this`

Build markers: `Pinned to the bottom of the viewport in build`, `852 - fold` x2

---

## Direct answers

### Do frames numbered 22 to 28 exist on this page?

**No. They do not exist.** Not on this page, and not anywhere in the file.

Page 05 runs 17, 18, 19, 19b, 20, 21 and stops. The next numbered frame in the whole
document is 29 (`29 How we worked out your saving amount`, `114:1220`) on page
"06 Assumptions and sources". Numbers 22 to 28 are an unfilled gap in the file's
numbering, not frames that exist under different names - every top-level frame on every
page was enumerated and none carries those numbers.

Since the frames do not exist, the follow-up question - complete screens or stubs - does
not arise.

### Correction to the premise of the request

The brief says a previous audit recorded frames **17 to 21** as absent, then asks whether
**22 to 28** exist. Those are different claims, so both are answered:

- **Frames 17 to 21 do exist and have been built.** All five are on this page, all are
  substantial screens with real copy, and four of the five are complete. The earlier
  audit's finding is now out of date. A sixth frame, `19b Running your check`, has also
  been added since.
- **Frames 22 to 28 do not exist**, as above.

### Full ordered sequence of the page

By canvas position, left to right, which is the sequence a reader sees:

1. `17 Mortgage in Principle` - `104:196` (x 14)
2. `18 What a Mortgage in Principle is` - `104:1067` (x 527)
3. `19 Before you run the check` - `104:1132` (x 1040)
4. `19b Running your check` - `208:455` (x 1553)
5. `20 Result - likely to be considered` - `104:1278` (x 2066)
6. `21 Result - not yet` - `104:1376` (x 2579)

Note that **layer order differs from canvas order**: in `page.children`, `19b` is the last
frame (index 5), because it was added after frames 20 and 21. Its canvas position places
it fourth. There is also **no prototype wiring on this page** - not one node in any of the
six frames carries a reaction - so the sequence above is inferred from position and
content, not from prototype links.

### Frames on other pages belonging to this flow

The whole file was searched, page by page, for node names matching *mortgage in principle*,
*agreement in principle*, *MIP*, *soft search* / *soft-search*, or *eligib\**.

**No frames on any other page belong to this flow.** Two matches were found, both on
"00 Foundations", and both are library components rather than screens:

| Name | Node ID | Type | Parent | Page |
|---|---|---|---|---|
| `type=soft-search` | `6:715` | COMPONENT | `Regulatory / Risk warning` | 00 Foundations |
| `type=soft-search` | `250:2827` | FRAME | `variants` | 00 Foundations |

`6:715` is the component whose instance appears on frame 19 as the soft-search risk
warning. `250:2827` is a variant swatch in the component library display.

One related item is worth recording even though it is not a frame: a long design note on
page "01 Entry and consent" (TEXT node `11:126`) contains the phrase "check if the user is
eligible for a mortgage in principle" as part of a brief about the journey overview screen.
It matched on content, not on a frame name.

### Frames containing form inputs

**None.** No frame on this page contains a form input. A search of every node name on the
page for *input*, *field*, *text field*, *checkbox*, *radio*, *toggle*, *switch*, *stepper*,
*slider*, *dropdown*, *select*, *picker*, *keyboard*, *form* or *entry* returned zero
matches, and no node on the page carries a text-entry component.

Every frame is explanatory content or a result:

- 17, 18 - explanatory
- 19 - explanatory, listing data already held; its "What you'll still be asked" section
  names four questions but does not present fields for them
- 19b - processing state
- 20, 21 - results

The one thing that reads as an input but is not is the ranged borrowing indicator on
frame 20 (`filled-track` / `position-marker` / `remaining-track`) - a static display,
not a slider.

---

## Node IDs for PNG export, in canvas sequence

```
104:196
104:1067
104:1132
208:455
104:1278
104:1376
```
