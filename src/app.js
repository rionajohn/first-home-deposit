/**
 * App entry point: registers the built screens against the router and
 * starts it. Pages registered so far: "01 Entry and consent" (/home,
 * /journey, /consent, /consent/move-account, /consent/declined) and
 * "02 Personalised savings" (/position, /position/summary, /goal-check —
 * frame 07 excluded per build-spec.md section 3's "Remove" marking).
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

registerRoute('/home', renderHome);
registerRoute('/journey', renderJourney);
registerRoute('/consent', renderConsent);
registerRoute('/consent/move-account', renderConsentMoveAccount);
registerRoute('/consent/declined', renderConsentDeclined);
registerRoute('/position', renderPosition);
registerRoute('/position/summary', renderPositionSummary);
registerRoute('/goal-check', renderGoalCheck);

startRouter();
