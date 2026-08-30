/**
 * Other costs when you buy. NO FIGMA FRAME EXISTS FOR THIS SCREEN - it is the
 * one screen in this build with no node and no reference PNG behind it
 * (GAPS.md G83, DECISIONS.md D70). Figma frame names are the system of record
 * everywhere else, so the absence is recorded rather than papered over.
 *
 * A sheet, on the frames 29-32 pattern and not on 13b's: `sheetHeaderHTML` with
 * a Close, an intro, one `.assumptions-list` of `figureRowHTML` rows, and the
 * family's `metadataTemplate` sourcing line at `.legal-text`. 13b is also a
 * sheet, but its distinguishing parts are a video placeholder and a diagram,
 * and there is neither here - choosing it would have meant a media sheet with
 * no media. Dismissed by scrim tap, the header Close or the primary, all three
 * `data-action="dismiss"` bound to `goBack`, plus the drag gesture app.js
 * mounts on any sheet. Falls back to '/home' if opened with no returnFrame,
 * as every sheet in this family does.
 *
 * WHY THIS SCREEN EXISTS RATHER THAN FIVE MORE ROWS ON /tracker. The tracker's
 * job is the goal: one figure, its progress against a target, and what to do
 * next. Five cost ranges there would be five more figures competing with the
 * one the screen exists to show, and not one of them is a figure the
 * participant is saving toward. See D70.
 *
 * THE COSTS WERE FRAME 30'S. They were `exclusionsRows` on /assumptions/deposit
 * and are moved here whole, with frame 30 left pointing at this screen, so one
 * list carries them. Two lists of the same costs at different specificity
 * would drift - D34's record of what that costs is why this was not left as a
 * duplicate.
 */
import {
  sheetHeaderHTML,
  figureRowHTML,
  actionBarDockHTML,
} from '../components/ui.js';
import { UPFRONT_COST_SOURCES } from '../model/rates.js';
import { goBack } from '../router.js';

export const anchors = ['guidanceNotAdvice'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { content } = ctx;
  const c = content['/assumptions/costs'];
  const reg = content.shared.regulatory;

  container.innerHTML = `
    <div class="sheet-overlay">
      <div class="sheet-scrim" data-action="dismiss"></div>
      <div class="bottom-sheet sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading">
        ${sheetHeaderHTML({ heading: c.heading, closeLabel: content.shared.appBar.closeLabel })}
        <div class="bottom-sheet__content">
          <p class="body-text-lg">${c.intro}</p>

          <h3 class="section-heading">${c.costsHeading}</h3>
          <div class="assumptions-list">
            ${c.costsRows.map((row) => figureRowHTML({
              label: row.label,
              value: row.value,
              caption: row.caption,
            })).join('')}
          </div>

          <p class="legal-text">${fill(c.metadataTemplate, {
            sources: UPFRONT_COST_SOURCES.sources,
            period: UPFRONT_COST_SOURCES.asAtLabel,
          })}</p>
          <p class="legal-text">${reg.guidanceNotAdvice}</p>
        </div>
        ${actionBarDockHTML(`
          <button type="button" class="button button--primary" data-action="dismiss">${c.primaryCta}</button>
        `)}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-action="dismiss"]').forEach((el) => {
    el.addEventListener('click', goBack);
  });
}
