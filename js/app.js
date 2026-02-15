import { openDB, getSettings, saveSettings } from './db.js';
import { renderHome, refreshHome, getCurrentWeek } from './progress.js';
import { renderUpload } from './upload.js';
import { renderGallery } from './gallery.js';
import { renderSettings } from './settings.js';

let db = null;
let currentScreen = 'home';

// ── Router ──────────────────────────────────────────────

function getRoute() {
  const hash = location.hash.slice(1) || 'home';
  return hash.split('/')[0];
}

function getRouteParam() {
  const parts = location.hash.slice(1).split('/');
  return parts[1] || null;
}

function navigateTo(screen) {
  if (screen === currentScreen) return;
  location.hash = screen;
}

function handleRoute() {
  const route = getRoute();
  const screens = document.querySelectorAll('.screen');
  const tabs = document.querySelectorAll('.nav-tab');

  screens.forEach(s => s.classList.remove('active'));
  tabs.forEach(t => t.classList.remove('active'));

  const targetScreen = document.getElementById(`screen-${route}`);
  const targetTab = document.querySelector(`.nav-tab[data-tab="${route}"]`);

  if (targetScreen) {
    targetScreen.classList.add('active');
    currentScreen = route;
  } else {
    document.getElementById('screen-home').classList.add('active');
    currentScreen = 'home';
  }

  if (targetTab) targetTab.classList.add('active');
  else document.querySelector('.nav-tab[data-tab="home"]')?.classList.add('active');

  onScreenEnter(currentScreen);
}

async function onScreenEnter(screen) {
  switch (screen) {
    case 'home':
      await refreshHome(db);
      break;
    case 'upload':
      await renderUpload(db);
      break;
    case 'gallery':
      await renderGallery(db);
      break;
    case 'settings':
      await renderSettings(db);
      break;
  }
}

// ── Event Delegation ────────────────────────────────────

function setupEventDelegation() {
  document.body.addEventListener('click', (e) => {
    const navTab = e.target.closest('[data-action="navigate"]');
    if (navTab) {
      const tab = navTab.dataset.tab;
      if (tab) navigateTo(tab);
    }
  });
}

// ── Week Badge ──────────────────────────────────────────

async function updateWeekBadge() {
  const settings = await getSettings(db);
  const week = getCurrentWeek(settings?.challengeStartDate);
  const badge = document.getElementById('weekBadge');
  if (badge) {
    badge.textContent = week > 52 ? 'Complete' : `Week ${week}`;
  }
}

// ── Service Worker ──────────────────────────────────────

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// ── Init ────────────────────────────────────────────────

async function init() {
  registerServiceWorker();

  db = await openDB();

  // Ensure default settings exist
  let settings = await getSettings(db);
  if (!settings) {
    const now = new Date();
    // Default to first Monday of current year
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const dayOfWeek = jan1.getDay();
    const firstMonday = new Date(jan1);
    firstMonday.setDate(jan1.getDate() + ((8 - dayOfWeek) % 7));

    settings = {
      id: 'user',
      challengeStartDate: firstMonday.toISOString().split('T')[0],
      challengeYear: now.getFullYear(),
      cloudinaryEnabled: false,
      cloudinaryCloudName: '',
      cloudinaryUploadPreset: '',
      photoMaxSize: 2048,
      thumbnailSize: 200,
      jpegQuality: 0.8,
    };
    await saveSettings(db, settings);
  }

  // Render initial home screen
  await renderHome(db);
  await updateWeekBadge();

  // Setup
  setupEventDelegation();
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

init();

export { db, navigateTo };