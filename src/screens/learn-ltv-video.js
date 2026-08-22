/**
 * Frame 13b — Loan-to-Value: video and diagram. Figma node 103:293.
 * Reference: reference/frames/13b Loan-to-Value – video and diagram.png.
 *
 * A sheet (SPEC.md transition rules), reached from either explainer row on
 * frame 13 — the screen annotation on the reference PNG states explicitly
 * "Both open frame 13b". Dismissed by scrim tap or "Got it", both returning
 * to `returnFrame` (always '/learn/ltv' — the only screen that opens this
 * one) and, per build-spec.md section 1's own row for this trigger, setting
 * the explainer to its "video-seen" state (build-spec.md section 2's
 * variant of frame 13's own video row). No real video asset exists in this
 * prototype (build-spec.md's out-of-scope list has no media pipeline), so
 * the video area is the same dashed-border placeholder pattern as the
 * visual-aid diagram beneath it.
 */
import { flagRowHTML, infoBannerHTML, actionBarDockHTML } from '../components/ui.js';
import { formatCurrency } from '../format.js';
import { playCircle } from '../icons.js';
import { guidanceNotAdviceLine } from '../regulatory.js';
import { goBack } from '../router.js';

export const anchors = ['guidanceNotAdvice'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/learn/ltv/video'];

  const propertyValue = state['property-value'].value;
  const returnHash = `#${state.returnFrame || '/learn/ltv'}`;

  container.innerHTML = `
    <div class="sheet-overlay">
      <div class="sheet-scrim" data-action="dismiss"></div>
      <div class="bottom-sheet sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading">
        <div class="bottom-sheet__drag-handle"><div class="bottom-sheet__drag-handle-bar"></div></div>
        <div class="bottom-sheet__content">
          <div class="media-placeholder">
            ${playCircle({ size: 'large', className: 'media-placeholder__icon' })}
            <h2 class="media-placeholder__title" id="sheet-heading">${c.videoTitle}</h2>
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
            <p class="visual-aid-placeholder__caption">${fill(c.visualAidCaptionTemplate, { property: propertyValue !== null ? formatCurrency(propertyValue) : '' })}</p>
          </div>
          ${infoBannerHTML(c.infoBannerText)}
          ${flagRowHTML(c.flagLabel)}
          <p class="legal-text">${guidanceNotAdviceLine(state, content)}</p>
        </div>
        ${actionBarDockHTML(`
          <button type="button" class="button button--primary" data-action="dismiss">${c.primaryCta}</button>
        `)}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-action="dismiss"]').forEach((el) => {
    el.addEventListener('click', () => {
      setState({ ltvVideoSeen: true });
      goBack();
    });
  });
}
