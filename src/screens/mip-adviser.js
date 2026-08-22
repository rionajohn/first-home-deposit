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
 * line; has a working back route to the result screen it was opened from
 * (returnFrame, set by both callers); contains no form fields and no
 * booking calendar — a request-logged confirmation only, a push not a pull.
 */
import { appBarHTML, bindAppBarLeading, actionBarHTML, emptyStateCardHTML } from '../components/ui.js';

export const anchors = ['guidanceNotAdvice', 'adviserScope'];

export function render(container, ctx) {
  const { state, content } = ctx;
  const c = content['/mip/adviser'];
  const reg = content.shared.regulatory;

  const returnHash = `#${state.returnFrame || '/tracker'}`;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      ${emptyStateCardHTML({ title: c.headline, body: c.body })}
      <p class="provenance-caption provenance-caption--center">${c.confirmationLabel}</p>
      <p class="legal-text">${reg.adviserScope}</p>
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({ primaryLabel: c.primaryCta, primaryAction: 'done' })}
  `;

  bindAppBarLeading(container);

  container.querySelector('[data-action="done"]').addEventListener('click', () => {
    window.location.hash = returnHash;
  });
}
