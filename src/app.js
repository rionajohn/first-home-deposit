/**
 * App entry point: registers the built screens against the router and
 * starts it. Pages registered so far: "01 Entry and consent" (/home,
 * /journey, /consent, /consent/move-account, /consent/declined),
 * "02 Personalised savings" (/position, /position/summary, /goal-check —
 * frame 07 excluded per build-spec.md section 3's "Remove" marking), and
 * "03 Deposit calculator" (/calculator/property, /calculator/saving,
 * /calculator/exit, /calculator/review, /calculator/result).
 */

import { registerRoute, startRouter } from './router.js';
import { render as renderHome } from './screens/home.js';
import { render as renderJourney } from './screens/journey.js';
import { render as renderConsent } from './screens/consent.js';
import { render as renderConsentMoveAccount } from './screens/consent-move-account.js';
import { render as renderConsentDeclined } from './screens/consent-declined.js';
import { render as renderPosition } from './screens/position.js';
import { render as renderPositionSummary } from './screens/position-summary.js';
import { render as renderGoalCheck } from './screens/goal-check.js';
import { render as renderCalculatorProperty } from './screens/calculator-property.js';
import { render as renderCalculatorSaving } from './screens/calculator-saving.js';
import { render as renderCalculatorExit } from './screens/calculator-exit.js';
import { render as renderCalculatorReview } from './screens/calculator-review.js';
import { render as renderCalculatorResult } from './screens/calculator-result.js';

registerRoute('/home', renderHome);
registerRoute('/journey', renderJourney);
registerRoute('/consent', renderConsent);
registerRoute('/consent/move-account', renderConsentMoveAccount);
registerRoute('/consent/declined', renderConsentDeclined);
registerRoute('/position', renderPosition);
registerRoute('/position/summary', renderPositionSummary);
registerRoute('/goal-check', renderGoalCheck);
registerRoute('/calculator/property', renderCalculatorProperty);
registerRoute('/calculator/saving', renderCalculatorSaving);
registerRoute('/calculator/exit', renderCalculatorExit);
registerRoute('/calculator/review', renderCalculatorReview);
registerRoute('/calculator/result', renderCalculatorResult);

startRouter();
