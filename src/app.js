/**
 * App entry point: registers the built screens against the router and
 * starts it. Page "01 Entry and consent" is registered this session:
 * /home, /journey, /consent, /consent/move-account, /consent/declined.
 */

import { registerRoute, startRouter } from './router.js';
import { render as renderHome } from './screens/home.js';
import { render as renderJourney } from './screens/journey.js';
import { render as renderConsent } from './screens/consent.js';
import { render as renderConsentMoveAccount } from './screens/consent-move-account.js';
import { render as renderConsentDeclined } from './screens/consent-declined.js';

registerRoute('/home', renderHome);
registerRoute('/journey', renderJourney);
registerRoute('/consent', renderConsent);
registerRoute('/consent/move-account', renderConsentMoveAccount);
registerRoute('/consent/declined', renderConsentDeclined);

startRouter();
