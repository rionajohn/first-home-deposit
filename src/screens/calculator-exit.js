/**
 * Frame 10c — Leave this for now? Figma node 202:2121. Reference:
 * reference/frames/10c Leave this for now_.png.
 *
 * A sheet (SPEC.md transition rules), not a push: rises from the bottom
 * over a dimmed scrim, dismissed by scrim tap or "Keep going". Reached from
 * the form step header's close button on any of frames 09/09a/09b/10/10b
 * (build-spec.md section 1's "Form step header close" rows), which set
 * state.returnFrame first.
 *
 * SPEC.md's regulatory anchor map confirms this screen carries none of the
 * four content.shared.regulatory lines.
 */
import { sheetHeaderHTML, actionBarDockHTML } from '../components/ui.js';
import { goBack, exitFlow } from '../router.js';
export const anchors = [];

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/exit'];

  const returnHash = `#${state.returnFrame || '/calculator/property'}`;

  container.innerHTML = `
    <div class="sheet-overlay">
      <div class="sheet-scrim" data-action="dismiss"></div>
      <div class="bottom-sheet sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading">
        ${sheetHeaderHTML({ heading: c.heading })}
        <div class="bottom-sheet__content">
          <p class="entry-card__body">${c.body}</p>
        </div>
        ${actionBarDockHTML(`
          <button type="button" class="button button--primary" data-action="save-and-leave">${c.primaryCta}</button>
          <button type="button" class="button button--secondary" data-action="dismiss">${c.secondaryCta}</button>
        `)}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-action="dismiss"]').forEach((el) => {
    el.addEventListener('click', goBack);
  });

  // "Leave" is the journey's exit, so it goes where every other exit goes: the
  // screen the participant entered from, not a hardcoded frame 01. Someone who
  // came in from the goals area and leaves the calculator is returned to the
  // goals area. `journeyPaused` and the retained draft inputs are unchanged -
  // build-spec.md section 1 still defines what leaving means, and only this
  // control still sets it.
  //
  // The sheet's own X and "Keep going" are NOT this: they dismiss and land back
  // on the step underneath, which is the sheet carve-out and stays as it is.
  container.querySelector('[data-action="save-and-leave"]').addEventListener('click', () => {
    setState({ journeyPaused: true });
    exitFlow();
  });
}
