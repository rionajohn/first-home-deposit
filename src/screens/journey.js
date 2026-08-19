/**
 * Frame 02 — Journey overview. Figma node 9:174. Reference: reference/frames/02
 * Journey overview.png.
 *
 * No figures on this screen — nothing here reads from state.js or model.js
 * beyond navigation flags. Only anchor carried: guidanceNotAdvice.
 */
import { appBarHTML, bindAppBarBack, actionBarHTML, infoBannerHTML } from '../components/ui.js';

export const anchors = ['guidanceNotAdvice'];

function goalRow({ title, body }) {
  return `
    <div class="goal-row">
      <img class="goal-row__icon" src="assets/icons/goal-star.svg" alt="" width="40" height="40" />
      <div class="goal-row__text">
        <p class="goal-row__title">${title}</p>
        <p class="goal-row__body">${body}</p>
      </div>
    </div>
  `;
}

export function render(container, { content, setState }) {
  const c = content['/journey'];
  const reg = content.shared.regulatory;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: content.shared.appBar })}
    <div class="screen-content">
      <div class="routes-illustration">
        <img src="assets/icons/routes-illustration.svg" alt="" width="32" height="32" />
        <p class="routes-illustration__caption">${c.illustrationCaption}</p>
      </div>
      <p class="screen-title">${c.headline}</p>
      <p class="body-text-lg">${c.body}</p>
      <p class="section-heading">${c.goalsHeading}</p>
      <div class="goal-rows">
        ${c.goalRows.map(goalRow).join('')}
      </div>
      ${infoBannerHTML(c.infoBanner)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </div>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'show-possible',
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'not-now',
    })}
  `;

  bindAppBarBack(container, () => {
    window.location.hash = '#/home';
  });

  container.querySelector('[data-action="show-possible"]').addEventListener('click', () => {
    window.location.hash = '#/consent';
  });

  container.querySelector('[data-action="not-now"]').addEventListener('click', () => {
    setState({ journeyStarted: false });
    window.location.hash = '#/home';
  });
}
