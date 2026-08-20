/**
 * Frame 05 / 05b — What we can see (personalised / estimate mode). Figma
 * nodes 31:160 / 31:249. Reference: reference/frames/05 What we can see.png,
 * 05b What we can see - estimate mode.png.
 *
 * One route ('/position') for both — build-spec.md section 3's own rule:
 * "Where two frames share a route they are variants of one screen, not two
 * screens." Which variant renders is read from state.mode, set at /consent.
 *
 * Variants built (build-spec.md section 2):
 *   - prefilled-inferred (05): mode = personalised
 *   - prefilled-estimated (05b): mode = estimate
 *   - entered: typing over the headline figure — left-over/provenance = entered
 *   - breakdown open / closed: state.breakdownOpen, no figure changes
 *   - error: left-over <= 0, or an entered value exceeds money-in — no
 *     wireframe drawn (DECISIONS.md D7); built as a warning banner under the
 *     figure, continue disabled, using the existing warning-banner pattern
 *     rather than inventing new visual design.
 */
import {
  appBarHTML,
  bindAppBarBack,
  actionBarHTML,
  infoBannerHTML,
  flagRowHTML,
  disclosureHTML,
  proportionRowsHTML,
  figureRowHTML,
  figureInputHTML,
  warningBannerHTML,
} from '../components/ui.js';
import { formatCurrency } from '../format.js';
import { leftOver } from '../model/model.js';

export const anchors = ['guidanceNotAdvice', 'estimateDisclosure'];

function percentOf(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/position'];
  const reg = content.shared.regulatory;
  const isEstimate = state.mode === 'estimate';

  if (state['money-in'].value === null) {
    // Deep-linked or reloaded before consent seeded a monthly position —
    // nothing sensible to show.
    window.location.hash = '#/consent';
    return;
  }

  const storedLeftOver = state['left-over'];
  const override = storedLeftOver.provenance === 'entered' ? storedLeftOver : null;
  const result = leftOver(state, override);
  const displayValue = result.value ?? 0;

  const moneyIn = state['money-in'].value;
  const essentialSpending = state['essential-spending'].value;
  const essentialsPct = percentOf(essentialSpending, moneyIn);
  const leftOverPct = percentOf(displayValue, moneyIn);

  const disclosureTitle = `${isEstimate ? c.disclosureTitlePrefixEstimate : c.disclosureTitlePrefix} ${formatCurrency(displayValue)}`;

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
    ${isEstimate ? figureRowHTML({ label: c.missedLabel, trailing: c.missedValue }) : ''}
    <button type="button" class="list-row" data-action="open-provenance-key">
      <span class="list-row__label">${c.provenanceKeyLabel}</span>
      <img class="list-row__chevron" src="assets/icons/chevron-right.svg" alt="" width="20" height="20" />
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
      ${isEstimate ? infoBannerHTML(c.estimateModeBanner) : ''}
      <h2 class="screen-title screen-title--center">${c.headline}</h2>
      <p class="entry-card__body">${c.body}</p>
      ${figureInputHTML({ id: 'left-over', value: displayValue, caption: c.figureCaption, ariaLabel: c.figureAriaLabel })}
      ${storedLeftOver.provenance === 'entered' ? `<p class="provenance-caption provenance-caption--center">${c.enteredCaption}</p>` : ''}
      ${errorText ? warningBannerHTML(errorText) : ''}
      ${disclosureHTML({ id: 'breakdown', title: disclosureTitle, open: state.breakdownOpen, contentHtml: disclosureContent })}
      <button type="button" class="list-row" data-action="open-sources">
        <span class="list-row__label">${c.whereFiguresLabel}</span>
        <img class="list-row__chevron" src="assets/icons/chevron-right.svg" alt="" width="20" height="20" />
      </button>
      ${isEstimate ? `<p class="legal-text">${reg.estimateDisclosure}</p>` : ''}
      ${flagRowHTML(c.flagLabel)}
      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({ primaryLabel: c.primaryCta, primaryAction: 'continue', primaryDisabled: !!errorText })}
  `;

  bindAppBarBack(container, () => {
    window.location.hash = '#/consent';
  });

  container.querySelector('[data-action="toggle-disclosure"]').addEventListener('click', () => {
    const next = setState({ breakdownOpen: !state.breakdownOpen });
    render(container, { ...ctx, state: next });
  });

  const input = container.querySelector('[data-role="left-over"]');
  input.addEventListener('focus', () => input.select());
  input.addEventListener('change', () => {
    const typed = Number(input.value.replace(/[^0-9.-]/g, ''));
    const next = setState({
      'left-over': { value: Number.isFinite(typed) ? typed : 0, provenance: 'entered' },
    });
    render(container, { ...ctx, state: next });
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
