import { getAllPhotos, getSettings, saveSettings } from './db.js';
import { getPromptForWeek } from './prompts.js';
import { blobToDataURL } from './photo.js';
import { showCelebration, animateCounter } from './ui.js';

// ── Week Calculation ────────────────────────────────────

export function getCurrentWeek(startDate) {
  if (!startDate) {
    startDate = getDefaultStartDate();
  }

  const start = new Date(startDate + 'T00:00:00');
  const now = new Date();
  const diff = now - start;
  const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(53, weeks));
}

export function getDefaultStartDate() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const dayOfWeek = jan1.getDay();
  const firstMonday = new Date(jan1);
  firstMonday.setDate(jan1.getDate() + ((8 - dayOfWeek) % 7));
  return firstMonday.toISOString().split('T')[0];
}

export function getWeekDateRange(weekNumber, startDate) {
  if (!startDate) startDate = getDefaultStartDate();
  const start = new Date(startDate + 'T00:00:00');
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (weekNumber - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const opts = { month: 'short', day: 'numeric' };
  const startStr = weekStart.toLocaleDateString('en-US', opts);
  const endOpts = weekStart.getMonth() === weekEnd.getMonth()
    ? { day: 'numeric' }
    : opts;
  const endStr = weekEnd.toLocaleDateString('en-US', endOpts);
  return `${startStr}\u2013${endStr}`;
}

// ── Stats Calculation ───────────────────────────────────

export function calculateStats(photos, startDate) {
  const completed = photos.length;
  const currentWeek = getCurrentWeek(startDate);
  const total = 52;
  const percentage = Math.round((completed / total) * 100);

  const completedWeeks = new Set(photos.map(p => p.weekNumber));

  // Current streak
  let currentStreak = 0;
  for (let w = Math.min(currentWeek, 52); w >= 1; w--) {
    if (completedWeeks.has(w)) {
      currentStreak++;
    } else {
      if (w === currentWeek) continue;
      break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let runningStreak = 0;
  for (let w = 1; w <= 52; w++) {
    if (completedWeeks.has(w)) {
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  return { completed, total, percentage, currentStreak, longestStreak, currentWeek };
}

// ── Motivational Messages ───────────────────────────────

function getMotivationalMessage(stats) {
  const { completed, currentStreak, percentage, currentWeek } = stats;

  if (completed === 0) {
    return 'Your 52-week journey starts with a single frame. Ready to capture week 1?';
  }
  if (completed === 52) {
    return 'You completed the entire challenge. 52 weeks of seeing the world differently.';
  }
  if (currentStreak >= 10) {
    return `${currentStreak} weeks without missing a beat. That's dedication.`;
  }
  if (currentStreak >= 5) {
    return `${currentStreak}-week streak! You're building a real habit.`;
  }
  if (percentage >= 75) {
    return `${percentage}% complete. The home stretch. Keep pushing.`;
  }
  if (percentage >= 50) {
    return 'Past the halfway mark. Look how far you\'ve come.';
  }
  if (percentage >= 25) {
    return 'A quarter of the year, documented. Each photo is a memory preserved.';
  }
  if (completed >= 5) {
    return `${completed} weeks captured. Every photo tells your story.`;
  }
  return 'Every great photographer started exactly where you are. Keep shooting.';
}

// ── Milestones ──────────────────────────────────────────

const MILESTONES = [
  { count: 1,  message: 'Your journey begins! First photo captured.', emoji: '🌱' },
  { count: 5,  message: 'Five weeks strong! You\'re building a habit.', emoji: '🔥' },
  { count: 10, message: 'Double digits! A tenth of the year, documented.', emoji: '⭐' },
  { count: 13, message: 'Quarter complete! One season down.', emoji: '🏔' },
  { count: 20, message: 'Twenty weeks. You\'re serious about this.', emoji: '💪' },
  { count: 26, message: 'Halfway there! 26 of 52.', emoji: '🎯' },
  { count: 39, message: 'Three quarters done! The finish line is in sight.', emoji: '🚀' },
  { count: 48, message: 'Just four more. You can taste the finish.', emoji: '✨' },
  { count: 52, message: 'You did it. 52 weeks. A full year in photographs.', emoji: '🏆' }
];

export async function checkAndShowMilestone(db) {
  const photos = await getAllPhotos(db);
  const settings = await getSettings(db);
  const lastShown = settings?.lastMilestoneShown || 0;

  const milestone = MILESTONES.find(m => m.count === photos.length && m.count > lastShown);
  if (milestone) {
    settings.lastMilestoneShown = milestone.count;
    await saveSettings(db, settings);
    await showCelebration(milestone.emoji, `${milestone.count} Photos!`, milestone.message);
  }
}

// ── Render Home Screen ──────────────────────────────────

export async function renderHome(db) {
  const container = document.getElementById('homeContent');
  if (!container) return;

  const photos = await getAllPhotos(db);
  const settings = await getSettings(db);
  const startDate = settings?.challengeStartDate;
  const stats = calculateStats(photos, startDate);
  const currentWeek = stats.currentWeek;
  const prompt = getPromptForWeek(Math.min(currentWeek, 52));
  const completedWeeks = new Set(photos.map(p => p.weekNumber));
  const hasCurrentWeekPhoto = completedWeeks.has(currentWeek);
  const currentWeekDates = currentWeek <= 52 ? getWeekDateRange(currentWeek, startDate) : '';

  // Load thumbnails for filled cells
  const thumbnails = {};
  for (const photo of photos) {
    if (photo.thumbnailBlob) {
      thumbnails[photo.weekNumber] = await blobToDataURL(photo.thumbnailBlob);
    }
  }

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (stats.percentage / 100) * circumference;

  container.innerHTML = `
    <!-- Progress Ring -->
    <div class="progress-hero">
      <svg class="progress-ring" width="140" height="140" viewBox="0 0 120 120">
        <circle class="progress-ring__bg" cx="60" cy="60" r="54"
                fill="none" stroke="var(--bg-tertiary)" stroke-width="8"/>
        <circle class="progress-ring__fill" cx="60" cy="60" r="54"
                fill="none" stroke="var(--accent)" stroke-width="8"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                stroke-linecap="round"
                transform="rotate(-90 60 60)"/>
        <text x="60" y="55" text-anchor="middle"
              fill="var(--text-primary)" font-size="28" font-weight="700" font-family="var(--font-sans)">
          ${stats.completed}
        </text>
        <text x="60" y="75" text-anchor="middle"
              fill="var(--text-secondary)" font-size="12" font-family="var(--font-sans)">
          of ${stats.total} weeks
        </text>
      </svg>
      <div class="progress-message">${getMotivationalMessage(stats)}</div>
    </div>

    <!-- This Week's Prompt -->
    ${currentWeek <= 52 ? `
    <div class="prompt-card">
      <div class="prompt-week">Week ${currentWeek} &middot; ${currentWeekDates}</div>
      <div class="prompt-title">${prompt ? escapeHTML(prompt.title) : ''}</div>
      <div class="prompt-description">${prompt ? escapeHTML(prompt.description) : ''}</div>
      <div class="prompt-tips">${prompt ? escapeHTML(prompt.tips) : ''}</div>
      ${hasCurrentWeekPhoto
        ? '<div class="prompt-status"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Completed</div>'
        : `<button class="btn btn--primary btn--small" style="margin-top: var(--space-md);" onclick="location.hash='upload'">Upload Now</button>`
      }
    </div>
    ` : `
    <div class="card" style="text-align:center;">
      <div class="prompt-title">Challenge Complete!</div>
      <div class="prompt-description">You've reached the end of the 52-week journey.</div>
    </div>
    `}

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-value stat-value--accent">${stats.completed}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.total - stats.completed}</div>
        <div class="stat-label">Remaining</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.percentage}%</div>
        <div class="stat-label">Progress</div>
      </div>
    </div>

    <!-- Streak -->
    ${stats.currentStreak > 0 ? `
    <div class="streak-display">
      <div class="streak-flame">🔥</div>
      <div class="streak-info">
        <div class="streak-count">${stats.currentStreak} week streak</div>
        <div class="streak-label">Longest: ${stats.longestStreak} weeks</div>
      </div>
    </div>
    ` : ''}

    <!-- 52-Week Grid -->
    <div class="week-grid-section">
      <div class="week-grid-title">Your Year</div>
      <div class="week-grid">
        ${buildWeekGrid(currentWeek, completedWeeks, thumbnails, startDate)}
      </div>
    </div>
  `;
}

export async function refreshHome(db) {
  await renderHome(db);
}

function buildWeekGrid(currentWeek, completedWeeks, thumbnails, startDate) {
  let html = '';
  for (let w = 1; w <= 52; w++) {
    const filled = completedWeeks.has(w);
    const isCurrent = w === currentWeek;
    const isFuture = w > currentWeek;
    const isMissed = w < currentWeek && !filled;

    let cls = 'week-cell';
    if (filled) cls += ' week-cell--filled';
    if (isCurrent && !filled) cls += ' week-cell--current';
    if (isMissed) cls += ' week-cell--missed';
    if (isFuture) cls += ' week-cell--future';

    const thumb = thumbnails[w];
    const dates = getWeekDateRange(w, startDate);
    const prompt = getPromptForWeek(w);
    const tooltip = `Week ${w}: ${prompt ? prompt.title : ''} (${dates})`;
    const content = thumb
      ? `<img src="${thumb}" alt="Week ${w}" loading="lazy">`
      : `${w}`;

    html += `<div class="${cls}" data-week="${w}" title="${tooltip}">${content}</div>`;
  }
  return html;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}