/**
 * Frame 18 — What a Mortgage in Principle is. Figma node 104:1067.
 * Reference: reference/frames/18 What a Mortgage in Principle is.png.
 *
 * A comprehension screen reached only from frame 17's inline info link, no
 * figures on screen — build-spec.md marks its own "Continue" and "Back"
 * rows "Assumed" (no explicit trigger label drawn beyond the CTA text
 * itself).
 *
 * THE TIMELINE REPLACED A PLACEHOLDER; THE VIDEO BLOCK DID NOT. The Figma
 * frame drew two "[Visual aid]"-style stand-ins on this screen. The one for
 * the process diagram is now built (`processTimelineHTML`, DECISIONS.md
 * D36). The `.media-placeholder` above it is NOT a gap waiting to be
 * filled — the prototype has no video and is not meant to look as though it
 * does, so it stays a visible placeholder deliberately.
 *
 * The timeline is a process sequence, not a progress indicator, and is
 * exempt from DESIGN.md's bar exclusions on that basis. The reasoning is in
 * ui.js above `processTimelineHTML` and in D36; it is written down in three
 * places because the thing most likely to happen to it is removal by a
 * later design-rule sweep that reads it as a bar.
 */
import {
  appBarHTML,
  bindAppBarLeading,
  actionBarHTML,
  figureRowHTML,
  riskWarningHTML,
  infoBannerHTML,
  processTimelineHTML,
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
      ${processTimelineHTML({
        heading: c.timelineHeading,
        headingId: 'mip-about-timeline-heading',
        steps: c.timelineSteps.map((label, i) => ({
          label,
          note: i === 0 ? c.timelineCurrentNote : null,
        })),
        currentIndex: 0,
      })}
      <p class="mip-heading-s">${c.whatItIsNotHeading}</p>
      ${c.notRows.map((row) => figureRowHTML({ label: row.title, caption: row.caption })).join('')}
      ${riskWarningHTML(shared.mipAgreementNotOffer)}
      ${infoBannerHTML(c.infoBannerText)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({ primaryLabel: c.primaryCta, primaryAction: 'continue' })}
  `;

  bindAppBarLeading(container);

  container.querySelector('[data-action="continue"]').addEventListener('click', () => {
    window.location.hash = '#/mip/pre-check';
  });
}
