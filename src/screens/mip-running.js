/**
 * Frame 19b — Running your check. Figma node 208:455. Reference:
 * reference/frames/19b Running your check.png.
 *
 * WHAT THIS SCREEN IS WAITING FOR. Not a check running here — frame 19 hands
 * off to the bank's existing Mortgage in Principle tool, and this is the wait
 * for the result that comes back from it. The copy says so ("Waiting for your
 * result", and the soft search attributed to the tool rather than to this
 * screen); the timer below is the wait, not the check. No affordability or
 * eligibility model exists in this build and none is being run here.
 *
 * Processing state (build-spec.md section 2): between the handoff
 * tap on frame 19 and the result. build-spec.md section 1 wires only
 * where this screen goes once it completes ("Processing completes, criteria
 * met -> 20", "...not met -> 21"); the destination is decided by frame 33's
 * own resultOutcome scenario toggle (build-spec.md section 7) — no
 * affordability/eligibility model exists anywhere else in this build
 * (real credit check is explicitly out of scope), so resultOutcome is the
 * only lever this prototype has for choosing between the two results.
 *
 * The app bar's close icon has no destination in build-spec.md's Navigation
 * table (this screen has no drawn back/dismiss trigger) — wired here to
 * cancel back to frame 19, the same "return to where the process started"
 * treatment 10c's exit sheet gives an interrupted flow. Noted for the build
 * summary as an inferred addition.
 */
import { appBarHTML, bindAppBarLeading, processingStateHTML } from '../components/ui.js';
import { borrowRange, maxProperty } from '../model/model.js';

export const anchors = [];

const PROCESSING_DELAY_MS = 1400;

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/mip/running'];

  if (state['deposit-target'].value === null) {
    window.location.replace('#/tracker');
    return;
  }

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: content.shared.appBar })}
    <main class="screen-content screen-content--centered" role="main">
      ${processingStateHTML({ title: c.title, body: c.body, caption: c.caption })}
    </main>
  `;

  bindAppBarLeading(container);

  const timer = window.setTimeout(() => {
    if (state.resultOutcome === 'not-yet') {
      // build-spec.md section 1: "criteria not met -> gap = deposit-target
      // - saved-toward-deposit" — gap has no build-spec.md section 6 state
      // slot (unlike borrow-low/borrow-high/max-property below), so it's
      // left to be computed fresh on the result screen rather than committed.
      window.location.replace('#/mip/result/not-yet');
      return;
    }
    // build-spec.md section 1: "criteria met -> 20 ... borrow-low,
    // borrow-high, max-property" committed to state on this transition.
    const range = borrowRange(state);
    const max = maxProperty(state);
    setState({
      'borrow-low': { value: range.value?.low ?? null, provenance: range.provenance },
      'borrow-high': { value: range.value?.high ?? null, provenance: range.provenance },
      'max-property': { value: max.value, provenance: max.provenance },
    });
    window.location.replace('#/mip/result/likely');
  }, PROCESSING_DELAY_MS);

  // If the participant navigates away before the timer fires (e.g. the
  // close icon above), the pending timeout must not still redirect them
  // once they've moved on — hashchange is the router's own re-render
  // signal (router.js), so it's the right point to cancel a stale timer.
  window.addEventListener('hashchange', () => window.clearTimeout(timer), { once: true });
}
