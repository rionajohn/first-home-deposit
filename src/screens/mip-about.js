/**
 * Frame 18 — What a Mortgage in Principle is. Figma node 104:1067.
 * Reference: reference/frames/18 What a Mortgage in Principle is.png.
 *
 * A comprehension screen reached only from frame 17's inline info link, no
 * figures on screen — build-spec.md marks its own "Continue" and "Back"
 * rows "Assumed" (no explicit trigger label drawn beyond the CTA text
 * itself).
 */
import {
  appBarHTML,
  bindAppBarBack,
  actionBarHTML,
  figureRowHTML,
  riskWarningHTML,
  infoBannerHTML,
} from '../components/ui.js';
import { playCircle } from '../icons.js';

export const anchors = ['guidanceNotAdvice'];

export function render(container, ctx) {
  const { state, content } = ctx;
  const c = content['/mip/about'];
  const reg = content.shared.regulatory;
  const shared = content.shared;

  const returnHash = `#${state.returnFrame || '/mip'}`;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: shared.appBar })}
    <main class="screen-content" role="main">
      <div class="media-placeholder">
        ${playCircle({ size: 'large', className: 'media-placeholder__icon' })}
        <p class="media-placeholder__title">${c.videoTitle}</p>
        <p class="media-placeholder__duration">${c.videoDuration}</p>
      </div>
      <div class="media-placeholder__accessibility-row">
        <p class="media-placeholder__accessibility-link">${c.captionsLabel}</p>
        <p class="media-placeholder__accessibility-link">${c.transcriptLabel}</p>
      </div>
      <h3 class="section-heading">${c.shortVersionHeading}</h3>
      <p class="body-text">${c.shortVersionBody}</p>
      <div class="visual-aid-placeholder">
        <p class="visual-aid-placeholder__label">${c.visualAidLabel}</p>
        <p class="visual-aid-placeholder__caption">${c.visualAidCaption}</p>
      </div>
      <p class="mip-heading-s">${c.whatItIsNotHeading}</p>
      ${c.notRows.map((row) => figureRowHTML({ label: row.title, caption: row.caption })).join('')}
      ${riskWarningHTML(shared.mipAgreementNotOffer)}
      ${infoBannerHTML(c.infoBannerText)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({ primaryLabel: c.primaryCta, primaryAction: 'continue' })}
  `;

  bindAppBarBack(container, () => { window.location.hash = returnHash; });

  container.querySelector('[data-action="continue"]').addEventListener('click', () => {
    window.location.hash = '#/mip/pre-check';
  });
}
