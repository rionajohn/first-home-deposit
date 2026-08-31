/**
 * App entry point: registers the built screens against the router and
 * starts it. Pages registered so far: "01 Entry and consent" (/home,
 * /journey, /consent, /consent/move-account),
 * "02 Personalised savings" (/position, /position/summary, /goals,
 * /goal-check — frame 07 stays excluded per build-spec.md section 3's
 * "Remove" marking, but its route out of the journey now lands on /goals,
 * the bank's own goals area, rather than bouncing to frame 01: DECISIONS.md
 * D21), and
 * "03 Deposit calculator" (/calculator/property, /calculator/saving,
 * /calculator/exit, /calculator/review, /calculator/result), and
 * "04 Understanding and tracking" (/learn/ltv, /learn/ltv/video, /tracker),
 * and "05 Mortgage in Principle" (/mip, /mip/about, /mip/pre-check,
 * /mip/running, /mip/result/likely, /mip/result/not-yet, and /mip/adviser —
 * the new screen SPEC.md adds outside the reference set, see DECISIONS.md
 * D8/D10), "06 Assumptions and sources" (/assumptions/saving,
 * /assumptions/deposit, /assumptions/borrowing, /assumptions/sources), and
 * "07 Prototype controls" (/settings — frame 33, a testing-only screen
 * reachable by typing the URL or by the long press on the disabled Profile
 * tab (DECISIONS.md D54), not from any visible nav element).
 *
 * Also registers the service worker (sw.js), if supported, so the settings
 * screen's build-version caption has a live CACHE_VERSION to read back from
 * Cache Storage (see sw.js / src/cache-version.js).
 *
 * Finally, on localhost only, runs a drift check between src/config.js and
 * manifest.webmanifest — the one pair of files that necessarily duplicates
 * the app's identity, since static JSON cannot import a module.
 */

import config from './config.js';
// Sizes the device frame to the window before the first screen paints
// (DECISIONS.md D92). Imported for its side effect and registered first, so
// no screen is ever measured or shown at a scale that is about to change.
import './shell-scale.js';
import { registerRoute, startRouter } from './router.js';
import { render as renderHome } from './screens/home.js';
import { render as renderJourney } from './screens/journey.js';
import { render as renderConsent } from './screens/consent.js';
import { render as renderConsentMoveAccount } from './screens/consent-move-account.js';
import { render as renderPosition } from './screens/position.js';
import { render as renderPositionSummary } from './screens/position-summary.js';
import { render as renderGoals } from './screens/goals.js';
import { render as renderGoalCheck } from './screens/goal-check.js';
import { render as renderCalculatorProperty } from './screens/calculator-property.js';
import { render as renderCalculatorSaving } from './screens/calculator-saving.js';
import { render as renderCalculatorExit } from './screens/calculator-exit.js';
import { render as renderCalculatorReview } from './screens/calculator-review.js';
import { render as renderCalculatorResult } from './screens/calculator-result.js';
import { render as renderLearnLtv } from './screens/learn-ltv.js';
import { render as renderLearnLtvVideo } from './screens/learn-ltv-video.js';
import { render as renderTracker } from './screens/tracker.js';
import { render as renderMip } from './screens/mip.js';
import { render as renderMipAbout } from './screens/mip-about.js';
import { render as renderMipPreCheck } from './screens/mip-pre-check.js';
import { render as renderMipRunning } from './screens/mip-running.js';
import { render as renderMipResultLikely } from './screens/mip-result-likely.js';
import { render as renderMipResultNotYet } from './screens/mip-result-not-yet.js';
import { render as renderMipAdviser } from './screens/mip-adviser.js';
import { render as renderAssumptionsSaving } from './screens/assumptions-saving.js';
import { render as renderAssumptionsDeposit } from './screens/assumptions-deposit.js';
import { render as renderAssumptionsBorrowing } from './screens/assumptions-borrowing.js';
import { render as renderAssumptionsSources } from './screens/assumptions-sources.js';
import { render as renderAssumptionsCosts } from './screens/assumptions-costs.js';
import { render as renderLearnStampDuty } from './screens/learn-stamp-duty.js';
import { render as renderSettings } from './screens/settings.js';

registerRoute('/home', renderHome);
registerRoute('/journey', renderJourney);
registerRoute('/consent', renderConsent);
registerRoute('/consent/move-account', renderConsentMoveAccount);
registerRoute('/position', renderPosition);
registerRoute('/position/summary', renderPositionSummary);
registerRoute('/goals', renderGoals);
registerRoute('/goal-check', renderGoalCheck);
registerRoute('/calculator/property', renderCalculatorProperty);
registerRoute('/calculator/saving', renderCalculatorSaving);
registerRoute('/calculator/exit', renderCalculatorExit);
registerRoute('/calculator/review', renderCalculatorReview);
registerRoute('/calculator/result', renderCalculatorResult);
registerRoute('/learn/ltv', renderLearnLtv);
registerRoute('/learn/ltv/video', renderLearnLtvVideo);
registerRoute('/tracker', renderTracker);
registerRoute('/mip', renderMip);
registerRoute('/mip/about', renderMipAbout);
registerRoute('/mip/pre-check', renderMipPreCheck);
registerRoute('/mip/running', renderMipRunning);
registerRoute('/mip/result/likely', renderMipResultLikely);
registerRoute('/mip/result/not-yet', renderMipResultNotYet);
registerRoute('/mip/adviser', renderMipAdviser);
registerRoute('/assumptions/saving', renderAssumptionsSaving);
registerRoute('/assumptions/deposit', renderAssumptionsDeposit);
registerRoute('/assumptions/borrowing', renderAssumptionsBorrowing);
registerRoute('/assumptions/sources', renderAssumptionsSources);
registerRoute('/assumptions/costs', renderAssumptionsCosts);
registerRoute('/learn/stamp-duty', renderLearnStampDuty);
registerRoute('/settings', renderSettings);

startRouter();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline-capability and the settings screen's live version readout
      // are best-effort — registration failing (e.g. served over a
      // non-secure origin in local dev) shouldn't block the app itself.
    });
  });
}

/**
 * Development-only guard against config/manifest drift.
 *
 * manifest.webmanifest is static JSON: it cannot import src/config.js, so
 * the display name, colours and start URL are necessarily written twice.
 * scripts/set-app-name.mjs updates both together, but a hand-edit to one
 * would otherwise diverge silently and only show up as a wrong name on a
 * participant's home screen after install — the worst possible place to
 * find it. This logs the mismatch the first time the app runs locally.
 *
 * Gated on hostname because this prototype has no build step and no
 * NODE_ENV: vanilla ES modules served straight from disk, so the hostname
 * is the only development signal available. On the deployed Vercel URL this
 * never runs.
 */
const DEV_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]'];
const isDevelopment =
  DEV_HOSTS.includes(location.hostname) || location.hostname.endsWith('.local');

/** config.js key -> the manifest member it must match. */
const IDENTITY_PAIRS = [
  ['name', 'name'],
  ['shortName', 'short_name'],
  ['description', 'description'],
  ['themeColour', 'theme_color'],
  ['backgroundColour', 'background_color'],
  ['startUrl', 'start_url'],
];

if (isDevelopment) {
  fetch('./manifest.webmanifest')
    .then((response) => (response.ok ? response.json() : null))
    .then((manifest) => {
      if (!manifest) return;

      const drifted = IDENTITY_PAIRS.filter(
        ([configKey, manifestKey]) => config[configKey] !== manifest[manifestKey]
      );
      if (drifted.length === 0) return;

      const detail = drifted
        .map(
          ([configKey, manifestKey]) =>
            `  ${configKey}: config.js has ${JSON.stringify(config[configKey])}, ` +
            `manifest ${manifestKey} has ${JSON.stringify(manifest[manifestKey])}`
        )
        .join('\n');

      console.warn(
        [
          'App identity has drifted: src/config.js and manifest.webmanifest disagree.',
          detail,
          '',
          'Fix both at once with:  node scripts/set-app-name.mjs "<new name>"',
          'If you have not edited either, a stale service-worker cache may be serving',
          'an old manifest - bump CACHE_VERSION in sw.js and hard-reload.',
        ].join('\n')
      );
    })
    .catch(() => {
      // The check is a convenience, never a gate. If the manifest cannot be
      // fetched (offline, or opened over file://) the app runs regardless.
    });
}
