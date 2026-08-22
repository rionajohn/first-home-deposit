/**
 * Frame 05 - What we can see. Figma node 31:160. Reference:
 * reference/frames/05 What we can see.png.
 *
 * Frame 05b (estimate mode) is gone: the savings-elsewhere case was removed
 * with the account-linking choice, so there is one variant of this screen's
 * sourcing, not two. See DECISIONS.md D28.
 *
 * Variants built (build-spec.md section 2):
 *   - prefilled-inferred (05): the seeded read figures (src/state.js)
 *   - entered: typing over the headline figure - left-over/provenance = entered
 *   - breakdown open / closed: state.breakdownOpen, no figure changes
 *   - error: left-over <= 0, or an entered value exceeds money-in - no
 *     wireframe drawn (DECISIONS.md D7); built as a warning banner under the
 *     figure, continue disabled, using the existing warning-banner pattern
 *     rather than inventing new visual design.
 */
import {
  appBarHTML,
  bindAppBarBack,
  actionBarHTML,
  flagRowHTML,
  disclosureHTML,
  proportionRowsHTML,
  figureRowHTML,
  figureInputHTML,
  warningBannerHTML,
  rerenderInPlace,
} from '../components/ui.js';
import { formatCurrency } from '../format.js';
import { leftOver } from '../model/model.js';
import { chevronRight } from '../icons.js';

export const anchors = ['guidanceNotAdvice'];

function percentOf(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/position'];
  const reg = content.shared.regulatory;

  const storedLeftOver = state['left-over'];
  const override = storedLeftOver.provenance === 'entered' ? storedLeftOver : null;
  const result = leftOver(state, override);
  const displayValue = result.value ?? 0;

  const moneyIn = state['money-in'].value;
  const essentialSpending = state['essential-spending'].value;
  const essentialsPct = percentOf(essentialSpending, moneyIn);
  const leftOverPct = percentOf(displayValue, moneyIn);

  const disclosureTitle = `${c.disclosureTitlePrefix} ${formatCurrency(displayValue)}`;

  const disclosureContent = `
    ${proportionRowsHTML([
      {
        label: c.proportions.essentialsLabel,
        valueText: formatCurrency(essentialSpending),
        pct: essentialsPct,
        pctText: `${essentialsPct}% ${c.proportions.ofWhatComesIn}`,
      },
      {
        label: c.proportions.leftOverLabel,
        valueText: formatCurrency(displayValue),
        pct: leftOverPct,
        pctText: `${leftOverPct}% ${c.proportions.ofWhatComesIn}`,
      },
    ])}
    ${figureRowHTML({ label: c.moneyInLabel, value: formatCurrency(moneyIn), caption: c.moneyInCaption })}
    ${figureRowHTML({ label: c.essentialSpendingLabel, value: formatCurrency(essentialSpending), caption: c.essentialSpendingCaption })}
    <button type="button" class="list-row" data-action="open-provenance-key">
      <span class="list-row__label">${c.provenanceKeyLabel}</span>
      ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
    </button>
  `;

  const errorText = result.error === 'not-positive'
    ? c.errorNotPositive
    : result.error === 'exceeds-money-in'
      ? c.errorExceedsMoneyIn
      : null;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'back', appBarLabels: content.shared.appBar })}
    <main class="screen-content" role="main">
      <h2 class="screen-title screen-title--center">${c.headline}</h2>
      <p class="entry-card__body">${c.body}</p>
      ${figureInputHTML({ id: 'left-over', value: displayValue, caption: c.figureCaption, ariaLabel: c.figureAriaLabel })}
      ${storedLeftOver.provenance === 'entered' ? `<p class="provenance-caption provenance-caption--center">${c.enteredCaption}</p>` : ''}
      ${errorText ? warningBannerHTML(errorText) : ''}
      ${disclosureHTML({ id: 'breakdown', title: disclosureTitle, open: state.breakdownOpen, contentHtml: disclosureContent })}
      <button type="button" class="list-row" data-action="open-sources">
        <span class="list-row__label">${c.whereFiguresLabel}</span>
        ${chevronRight({ size: 'body', className: 'list-row__chevron' })}
      </button>
      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({ primaryLabel: c.primaryCta, primaryAction: 'continue', primaryDisabled: !!errorText })}
  `;

  bindAppBarBack(container);

  container.querySelector('[data-action="toggle-disclosure"]').addEventListener('click', () => {
    const next = setState({ breakdownOpen: !state.breakdownOpen });
    rerenderInPlace(container, render, { ...ctx, state: next });
  });

  const input = container.querySelector('[data-role="left-over"]');
  input.addEventListener('focus', () => input.select());
  input.addEventListener('change', () => {
    const typed = Number(input.value.replace(/[^0-9.-]/g, ''));
    const next = setState({
      'left-over': { value: Number.isFinite(typed) ? typed : 0, provenance: 'entered' },
    });
    rerenderInPlace(container, render, { ...ctx, state: next });
  });

  container.querySelector('[data-action="open-provenance-key"]').addEventListener('click', () => {
    setState({ returnFrame: '/position' });
    window.location.hash = '#/assumptions/saving';
  });

  container.querySelector('[data-action="open-sources"]').addEventListener('click', () => {
    setState({ returnFrame: '/position' });
    window.location.hash = '#/assumptions/sources';
  });

  container.querySelector('[data-action="continue"]').addEventListener('click', () => {
    if (errorText) return;
    setState({
      'left-over': override ? override : { value: result.value, provenance: result.provenance },
    });
    window.location.hash = '#/position/summary';
  });
}
