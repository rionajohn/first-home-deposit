/**
 * /mip/adviser — no reference PNG, no Figma node. SPEC.md's own new screen
 * this session adds outside the 32-frame reference set: a terminal stub for
 * the "Talk to someone about it" row on frames 20 and 21. DECISIONS.md D10:
 * the obligation to offer this route rests on MCOB 4.8A (execution-only
 * sales) and the Consumer Duty consumer support outcome, not FCA PERG 4.6 —
 * so this screen carries the guidance-not-advice and adviser-scope lines,
 * the same regulatory anchors as the result screens it's reached from, but
 * is not itself advice or an application.
 *
 * SPEC.md's own verification step for this screen: reachable from both 20
 * and 21's "Talk to someone about it" row; displays the guidance-not-advice
 * line; has a working back route to the result screen it was opened from;
 * contains no form fields and no booking calendar — a request-logged
 * confirmation only, a push not a pull.
 *
 * THAT BACK ROUTE IS NOW THE HISTORY STACK, NOT `returnFrame`. The
 * requirement is unchanged and still met - both callers push, so going back
 * lands on the caller - but the mechanism is no longer a stored route, so
 * this file no longer reads `state`. Both controls are the same journey and
 * are therefore the same call: the leading cell is the back chevron rather
 * than the close X, because frame 22 is a terminal confirmation reached only
 * from frames 20 and 21, not a way out of the journey. D10 is the reason -
 * the adviser route is an addition to the result, offered because MCOB 4.8A
 * and the Consumer Duty support outcome require it be offered, so finishing
 * with it returns the participant to the result it belongs to. See D32.
 */
import { appBarHTML, bindAppBarLeading, actionBarHTML, emptyStateCardHTML } from '../components/ui.js';
import { goBack } from '../router.js';

export const anchors = ['guidanceNotAdvice', 'adviserScope'];

export function render(container, ctx) {
  const { content } = ctx;
  const c = content['/mip/adviser'];
  const reg = content.shared.regulatory;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      ${emptyStateCardHTML({ title: c.headline, body: c.body })}
      <p class="provenance-caption provenance-caption--center">${c.confirmationLabel}</p>
      <p class="legal-text">${reg.adviserScope}</p>
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({ primaryLabel: c.primaryCta, primaryAction: 'done' })}
  `;

  bindAppBarLeading(container);

  // "Done" is the same journey as the chevron above it, so it is the same
  // call. It used to push `returnFrame`, which left frame 22 sitting on the
  // stack: back from the result screen returned to the confirmation the
  // participant had just finished with. Going back pops it instead.
  container.querySelector('[data-action="done"]').addEventListener('click', goBack);
}
