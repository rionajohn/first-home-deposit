/**
 * Stamp duty - what it is. NO FIGMA FRAME EXISTS FOR THIS SCREEN (GAPS.md
 * G84, DECISIONS.md D70), the second such screen in this build after
 * /assumptions/costs. Recorded rather than papered over, because Figma frame
 * names are the system of record everywhere else.
 *
 * A sheet on frames 29 to 32's pattern - `sheetHeaderHTML` with a Close, an
 * intro, one `.assumptions-list` of `figureRowHTML` rows, a short prose
 * section, and the family's `metadataTemplate` sourcing line at
 * `.legal-text`. 13b is the other sheet in the build and was not chosen: its
 * distinguishing parts are a video placeholder and a diagram, and there is
 * neither here.
 *
 * UNDER /learn, NOT /assumptions, AND THE SPLIT IS DELIBERATE. The visual
 * pattern and the route namespace answer different questions.
 * `/assumptions/*` means "how we derived YOUR numbers" - every screen in that
 * family reads the participant's own state. This one reads none: it explains
 * a tax that exists whether or not a goal has been set, which is what
 * `/learn/*` is for. `/learn/ltv/video` already establishes a sheet in that
 * namespace, so nothing is split that was not already.
 *
 * TWO ENTRY POINTS, TWO RETURNS. Both set `returnFrame` on the tap:
 *   /tracker              the stamp duty note's info icon - the first place
 *                         the term appears on the default path.
 *   /calculator/property  frame 09's cliff banner icon, which is the FIRST
 *                         encounter for a participant above 500,000. Its
 *                         `returnFrame` is frame 09's own route, so dismissing
 *                         returns to the calculator step they were on and not
 *                         to the tracker.
 * Dismissal is `goBack` either way, so the return is the history entry rather
 * than a route this screen chooses - `returnFrame` is what the '/home'
 * fallback uses when the sheet is deep-linked cold.
 */
import {
  sheetHeaderHTML,
  figureRowHTML,
  actionBarDockHTML,
} from '../components/ui.js';
import { SDLT } from '../model/rates.js';
import { goBack } from '../router.js';

export const anchors = ['guidanceNotAdvice'];

function fill(template, values) {
  return Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), template);
}

export function render(container, ctx) {
  const { content } = ctx;
  const c = content['/learn/stamp-duty'];
  const reg = content.shared.regulatory;

  container.innerHTML = `
    <div class="sheet-overlay">
      <div class="sheet-scrim" data-action="dismiss"></div>
      <div class="bottom-sheet sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading">
        ${sheetHeaderHTML({ heading: c.heading, closeLabel: content.shared.appBar.closeLabel })}
        <div class="bottom-sheet__content">
          <p class="body-text-lg">${c.intro}</p>

          <h3 class="section-heading">${c.bandsHeading}</h3>
          <div class="assumptions-list">
            ${c.bandRows.map((row) => figureRowHTML({
              label: row.label,
              value: row.value,
              caption: row.caption,
            })).join('')}
          </div>

          <h3 class="section-heading">${c.whereHeading}</h3>
          <p class="body-text">${c.whereBody}</p>

          <p class="legal-text">${fill(c.metadataTemplate, {
            source: SDLT.sourceLabel,
            period: SDLT.asAtLabel,
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
