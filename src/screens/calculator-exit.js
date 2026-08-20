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
import { actionBarDockHTML } from '../components/ui.js';
export const anchors = [];

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/calculator/exit'];

  const returnHash = `#${state.returnFrame || '/calculator/property'}`;

  container.innerHTML = `
    <div class="sheet-overlay">
      <div class="sheet-scrim" data-action="dismiss"></div>
      <div class="bottom-sheet sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-heading">
        <div class="bottom-sheet__drag-handle"><div class="bottom-sheet__drag-handle-bar"></div></div>
        <div class="bottom-sheet__content">
          <h2 class="screen-title" id="sheet-heading">${c.heading}</h2>
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
    el.addEventListener('click', () => {
      window.location.hash = returnHash;
    });
  });

  container.querySelector('[data-action="save-and-leave"]').addEventListener('click', () => {
    setState({ journeyPaused: true });
    window.location.hash = '#/home';
  });
}
