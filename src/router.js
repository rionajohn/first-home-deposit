/**
 * Hash-based router — works on static hosting with no server config.
 * Routes are the build-spec.md section 3 screen inventory, exactly as
 * written there (query strings like ?mode=estimate select a state variant
 * of a route, not a separate route — build-spec.md section 3's own note:
 * "Where two frames share a route they are variants of one screen, not two
 * screens.").
 *
 * Only '/home' has a registered screen module this session (build brief:
 * "Build no other screen in this session") — every other route below is
 * real (it will be built later) but currently falls through to a visible
 * "not built yet" placeholder rather than a broken screen.
 */

import { getState, setState, resetState } from './state.js';
import content from './content.js';

export const ROUTES = [
  '/home',
  '/journey',
  '/consent',
  '/consent/move-account',
  '/consent/declined',
  '/position',
  '/position/summary',
  '/goal-check',
  '/calculator/property',
  '/calculator/saving',
  '/calculator/exit',
  '/calculator/review',
  '/calculator/result',
  '/learn/ltv',
  '/learn/ltv/video',
  '/tracker',
  '/mip',
  '/mip/about',
  '/mip/pre-check',
  '/mip/running',
  '/mip/result/likely',
  '/mip/result/not-yet',
  '/mip/adviser',
  '/assumptions/saving',
  '/assumptions/deposit',
  '/assumptions/borrowing',
  '/assumptions/sources',
  '/settings',
];

const registry = new Map();

export function registerRoute(path, render) {
  if (!ROUTES.includes(path)) {
    throw new Error(`"${path}" is not in the section 3 screen inventory`);
  }
  registry.set(path, render);
}

function parseHash() {
  const raw = window.location.hash.slice(1) || '/home';
  const [path, query] = raw.split('?');
  return { path: path || '/home', params: new URLSearchParams(query || '') };
}

function renderNotBuilt(container, path) {
  container.innerHTML = `<div class="not-built">Not built yet: ${path}</div>`;
}

function renderCurrentRoute() {
  const { path, params } = parseHash();
  const container = document.getElementById('app');

  if (path === '/reset') {
    resetState();
    window.location.hash = '#/home';
    return;
  }

  const render = registry.get(path);
  if (!render) {
    renderNotBuilt(container, path);
    return;
  }

  render(container, {
    state: getState(),
    setState,
    params,
    content,
  });
}

export function startRouter() {
  window.addEventListener('hashchange', renderCurrentRoute);
  renderCurrentRoute();
}
