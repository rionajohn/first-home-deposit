/**
 * Frame 17 — Mortgage in Principle (entry). Figma node 104:196. Reference:
 * reference/frames/17 Mortgage in Principle.png.
 *
 * Two variants (build-spec.md section 2):
 *   - unlocked (the frame as drawn): mipUnlocked = true
 *   - locked: mipUnlocked = false, "reached only by deep link" — no
 *     wireframe drawn (DECISIONS.md D7 fallback), composed from the shared
 *     empty-state-card pattern rather than inventing new visual design.
 *
 * Reached only from frame 16's "Ready to check" (mipUnlocked set true
 * there) or by typing the route directly — the second path is exactly what
 * the locked variant exists to catch.
 */
import { appBarHTML, bindAppBarBack, actionBarHTML, tickListHTML, infoLinkHTML, emptyStateCardHTML } from '../components/ui.js';

export const anchors = ['guidanceNotAdvice'];

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/mip'];
  const reg = content.shared.regulatory;

  if (state['deposit-target'].value === null) {
    window.location.hash = '#/tracker';
    return;
  }

  if (!state.mipUnlocked) {
    container.innerHTML = `
      ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: content.shared.appBar })}
      <main class="screen-content" role="main">
        ${emptyStateCardHTML({ title: c.lockedHeadline, body: c.lockedBody, ctaLabel: c.lockedCta, ctaAction: 'back-to-tracker' })}
      </main>
    `;
    bindAppBarBack(container, () => { window.location.hash = '#/tracker'; });
    container.querySelector('[data-action="back-to-tracker"]').addEventListener('click', () => {
      window.location.hash = '#/tracker';
    });
    return;
  }

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      <p class="body-text-lg-primary">${c.body}</p>
      <div class="card mip-step-card">
        <p class="mip-heading-s">${c.whatThisStepDoesHeading}</p>
        ${tickListHTML(c.tickRows)}
        ${infoLinkHTML({ label: c.learnMoreLabel, action: 'open-about' })}
      </div>
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'start-check',
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'not-right-now',
    })}
  `;

  bindAppBarBack(container, () => { window.location.hash = '#/tracker'; });

  container.querySelector('[data-action="open-about"]').addEventListener('click', () => {
    setState({ returnFrame: '/mip' });
    window.location.hash = '#/mip/about';
  });

  container.querySelector('[data-action="start-check"]').addEventListener('click', () => {
    window.location.hash = '#/mip/pre-check';
  });

  container.querySelector('[data-action="not-right-now"]').addEventListener('click', () => {
    window.location.hash = '#/tracker';
  });
}
