/**
 * Frame 04 — Consent declined (general mode). Figma node 10:148. Reference:
 * reference/frames/04 Consent declined.png.
 *
 * Variants built (build-spec.md section 2):
 *   - default range: generalMonthlyLow/High seeded from
 *     RATES.GENERAL_SAVINGS_RANGE, provenance 'estimated'
 *   - at bound: a handle at the slider's min or max — no reference PNG;
 *     built per DECISIONS.md D7 as a small note under the slider rather
 *     than inventing new visual design
 *   - entered: dragging or typing flips provenance to 'entered'
 *     (DECISIONS.md D5 — the annual figure inherits 'entered' too, since
 *     it's derived from an entered value)
 */
import { appBarHTML, bindAppBarBack, actionBarHTML, infoBannerHTML, flagRowHTML } from '../components/ui.js';
import { formatCurrency } from '../format.js';
import { generalAnnualRange } from '../model/model.js';
import { GENERAL_SAVINGS_RANGE } from '../model/rates.js';

export const anchors = ['guidanceNotAdvice', 'estimateDisclosure'];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function render(container, ctx) {
  const { state, setState, content } = ctx;
  const c = content['/consent/declined'];
  const reg = content.shared.regulatory;

  // Seed on first visit — nothing has been read from an account, so this is
  // the published-average default, not zero.
  if (state.generalMonthlyLow.value === null) {
    setState({
      generalMonthlyLow: { value: GENERAL_SAVINGS_RANGE.low, provenance: 'estimated' },
      generalMonthlyHigh: { value: GENERAL_SAVINGS_RANGE.high, provenance: 'estimated' },
    });
  }
  const monthlyLow = state.generalMonthlyLow.value === null
    ? { value: GENERAL_SAVINGS_RANGE.low, provenance: 'estimated' }
    : state.generalMonthlyLow;
  const monthlyHigh = state.generalMonthlyHigh.value === null
    ? { value: GENERAL_SAVINGS_RANGE.high, provenance: 'estimated' }
    : state.generalMonthlyHigh;

  const annual = generalAnnualRange(monthlyLow, monthlyHigh);
  const { min, max } = GENERAL_SAVINGS_RANGE;
  const atBound = monthlyLow.value === min || monthlyHigh.value === max;

  const monthlyCaption = monthlyLow.provenance === 'entered' ? c.monthlyProvenanceEntered : c.monthlyProvenanceEstimated;
  const annualCaption = annual.provenance === 'entered' ? c.annualProvenanceEntered : c.annualProvenanceDerived;

  const fillLeft = ((monthlyLow.value - min) / (max - min)) * 100;
  const fillRight = ((monthlyHigh.value - min) / (max - min)) * 100;

  container.innerHTML = `
    ${appBarHTML({ title: c.appBarTitle, left: 'close', appBarLabels: content.shared.appBar })}
    <main class="screen-content declined-content" role="main">
      <h2 class="screen-title">${c.headline}</h2>
      <p class="entry-card__body">${c.body}</p>
      <h3 class="section-heading">${c.monthlyHeading}</h3>
      <p class="entry-card__body">${c.monthlySubhead}</p>

      <div class="value-slider">
        <div class="value-slider__readout">
          <span class="value-slider__figure-wrap">
            <span class="value-slider__currency" aria-hidden="true">£</span>
            <input class="value-slider__figure" type="number" inputmode="numeric" min="${min}" max="${max}" value="${Math.round(monthlyLow.value)}" data-role="figure-low" aria-label="${c.sliderCaption}, ${c.lowerAmountLabel}" />
          </span>
          <p class="value-slider__to">${c.rangeToLabel}</p>
          <span class="value-slider__figure-wrap">
            <span class="value-slider__currency" aria-hidden="true">£</span>
            <input class="value-slider__figure" type="number" inputmode="numeric" min="${min}" max="${max}" value="${Math.round(monthlyHigh.value)}" data-role="figure-high" aria-label="${c.sliderCaption}, ${c.upperAmountLabel}" />
          </span>
        </div>
        <p class="value-slider__caption">${c.sliderCaption}</p>
        <div class="value-slider__track">
          <div class="value-slider__track-bg"></div>
          <div class="value-slider__track-fill" style="left:${fillLeft}%;width:${fillRight - fillLeft}%;"></div>
          <input class="value-slider__range" type="range" min="${min}" max="${max}" step="1" value="${monthlyLow.value}" data-role="range-low" aria-label="${c.sliderCaption}, ${c.lowerAmountLabel}" />
          <input class="value-slider__range" type="range" min="${min}" max="${max}" step="1" value="${monthlyHigh.value}" data-role="range-high" aria-label="${c.sliderCaption}, ${c.upperAmountLabel}" />
        </div>
        <div class="value-slider__labels">
          <p class="value-slider__label">${formatCurrency(min)}</p>
          <p class="value-slider__label">${formatCurrency(max)}</p>
        </div>
        ${atBound ? `<p class="value-slider__bound-note">${c.sliderAtBoundNote}</p>` : ''}
      </div>
      <p class="provenance-caption">${monthlyCaption}</p>

      <div class="range-figure">
        <div class="range-figure__readout">
          <p class="range-figure__value">${formatCurrency(annual.value.low)}</p>
          <p class="range-figure__to">${c.rangeToLabel}</p>
          <p class="range-figure__value">${formatCurrency(annual.value.high)}</p>
        </div>
        <p class="range-figure__caption">${c.annualCaption}</p>
      </div>
      <p class="provenance-caption">${annualCaption}</p>
      <p class="legal-text">${reg.estimateDisclosure}</p>

      <div class="card assumptions-card">
        <div class="assumptions-card__header">
          <p class="assumptions-card__title">${c.assumptionsCardHeader}</p>
        </div>
        ${c.assumptionsRows.map((row) => `
          <div class="assumptions-card__row">
            <p class="assumptions-card__bullet">•</p>
            <p class="assumptions-card__text">${row}</p>
          </div>
        `).join('')}
      </div>

      ${infoBannerHTML(c.switchBanner)}

      <button type="button" class="assumptions-link" data-action="open-assumptions">${c.assumptionsLink}</button>
      <p class="source-caption">${c.sourceCaption}</p>

      ${flagRowHTML(c.flagLabel)}

      <p class="legal-text">${reg.guidanceNotAdvice}</p>
    </main>
    ${actionBarHTML({
      primaryLabel: c.primaryCta,
      primaryAction: 'continue-general',
      secondaryLabel: c.secondaryCta,
      secondaryAction: 'make-personalised',
      secondaryStyle: 'button',
    })}
  `;

  bindAppBarBack(container, () => {
    window.location.hash = '#/consent';
  });

  const rangeLow = container.querySelector('[data-role="range-low"]');
  const rangeHigh = container.querySelector('[data-role="range-high"]');
  const figureLow = container.querySelector('[data-role="figure-low"]');
  const figureHigh = container.querySelector('[data-role="figure-high"]');
  const fill = container.querySelector('.value-slider__track-fill');

  function liveUpdate(low, high) {
    figureLow.value = Math.round(low);
    figureHigh.value = Math.round(high);
    rangeLow.value = low;
    rangeHigh.value = high;
    const left = ((low - min) / (max - min)) * 100;
    const right = ((high - min) / (max - min)) * 100;
    fill.style.left = `${left}%`;
    fill.style.width = `${right - left}%`;
  }

  rangeLow.addEventListener('input', () => {
    const low = clamp(Number(rangeLow.value), min, Number(rangeHigh.value));
    liveUpdate(low, Number(rangeHigh.value));
  });
  rangeHigh.addEventListener('input', () => {
    const high = clamp(Number(rangeHigh.value), Number(rangeLow.value), max);
    liveUpdate(Number(rangeLow.value), high);
  });

  function commit(low, high, provenance) {
    const next = setState({
      generalMonthlyLow: { value: low, provenance },
      generalMonthlyHigh: { value: high, provenance },
    });
    render(container, { ...ctx, state: next });
  }

  rangeLow.addEventListener('change', () => {
    commit(clamp(Number(rangeLow.value), min, Number(rangeHigh.value)), Number(rangeHigh.value), 'entered');
  });
  rangeHigh.addEventListener('change', () => {
    commit(Number(rangeLow.value), clamp(Number(rangeHigh.value), Number(rangeLow.value), max), 'entered');
  });

  figureLow.addEventListener('change', () => {
    const low = clamp(Number(figureLow.value) || min, min, Number(figureHigh.value));
    commit(low, Number(figureHigh.value), 'entered');
  });
  figureHigh.addEventListener('change', () => {
    const high = clamp(Number(figureHigh.value) || max, Number(figureLow.value), max);
    commit(Number(figureLow.value), high, 'entered');
  });

  container.querySelector('[data-action="open-assumptions"]').addEventListener('click', () => {
    setState({ returnFrame: '/consent/declined' });
    window.location.hash = '#/assumptions/saving';
  });

  container.querySelector('[data-action="continue-general"]').addEventListener('click', () => {
    setState({ mode: 'general' });
    window.location.hash = '#/calculator/property';
  });

  container.querySelector('[data-action="make-personalised"]').addEventListener('click', () => {
    window.location.hash = '#/consent';
  });
}
