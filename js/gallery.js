import { getAllPhotos, getPhoto, deletePhoto } from './db.js';
import { blobToDataURL, renderExifHTML } from './photo.js';
import { getCurrentWeek, getWeekDateRange } from './progress.js';
import { getPromptForWeek } from './prompts.js';
import { getSettings } from './db.js';
import { showToast, showModal, formatDate } from './ui.js';

let currentDB = null;
let currentView = 'grid';
let cachedThumbnails = {};
let cachedStartDate = null;

export async function renderGallery(db) {
  currentDB = db;
  const container = document.getElementById('galleryContent');
  const photos = await getAllPhotos(db);
  const settings = await getSettings(db);
  const startDate = settings?.challengeStartDate;
  cachedStartDate = startDate;
  const currentWeek = getCurrentWeek(startDate);
  const completedWeeks = new Set(photos.map(p => p.weekNumber));

  // Preload thumbnails
  for (const photo of photos) {
    if (photo.thumbnailBlob && !cachedThumbnails[photo.weekNumber]) {
      cachedThumbnails[photo.weekNumber] = await blobToDataURL(photo.thumbnailBlob);
    }
  }

  container.innerHTML = `
    <div class="gallery-tabs">
      <button class="gallery-tab ${currentView === 'grid' ? 'active' : ''}" data-view="grid">Grid</button>
      <button class="gallery-tab ${currentView === 'timeline' ? 'active' : ''}" data-view="timeline">Timeline</button>
    </div>

    <div id="galleryView">
      ${currentView === 'grid'
        ? renderGridView(currentWeek, completedWeeks, photos, startDate)
        : renderTimelineView(photos, startDate)
      }
    </div>
  `;

  // Tab switching
  container.querySelector('.gallery-tabs')?.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-view]');
    if (!tab) return;
    currentView = tab.dataset.view;
    renderGallery(db);
  });

  // Grid cell clicks
  container.addEventListener('click', async (e) => {
    const cell = e.target.closest('.week-cell--filled');
    if (cell) {
      const week = parseInt(cell.dataset.week);
      if (week) await openLightbox(week);
    }

    const timelinePhoto = e.target.closest('.timeline-photo');
    if (timelinePhoto) {
      const week = parseInt(timelinePhoto.dataset.week);
      if (week) await openLightbox(week);
    }
  });
}

function renderGridView(currentWeek, completedWeeks, photos, startDate) {
  if (photos.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📷</div>
        <div class="empty-state-title">No photos yet</div>
        <div class="empty-state-text">Upload your first photo to start building your year in pictures.</div>
        <button class="btn btn--primary btn--small" style="margin-top: var(--space-md);" onclick="location.hash='upload'">Upload Photo</button>
      </div>
    `;
  }

  let html = '<div class="week-grid week-grid--large">';
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

    const thumb = cachedThumbnails[w];
    const dates = getWeekDateRange(w, startDate);
    const prompt = getPromptForWeek(w);
    const tooltip = `Week ${w}: ${prompt ? prompt.title : ''} (${dates})`;
    const content = thumb
      ? `<img src="${thumb}" alt="Week ${w}" loading="lazy">`
      : `${w}`;

    html += `<div class="${cls}" data-week="${w}" title="${tooltip}">${content}</div>`;
  }
  html += '</div>';
  return html;
}

function renderTimelineView(photos, startDate) {
  if (photos.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📷</div>
        <div class="empty-state-title">No photos yet</div>
        <div class="empty-state-text">Your timeline will fill up as you complete each week.</div>
      </div>
    `;
  }

  const sorted = [...photos].sort((a, b) => b.weekNumber - a.weekNumber);

  let html = '';
  for (const photo of sorted) {
    const thumb = cachedThumbnails[photo.weekNumber];
    if (!thumb) continue;

    const prompt = getPromptForWeek(photo.weekNumber);
    const dates = getWeekDateRange(photo.weekNumber, startDate);

    html += `
      <div class="timeline-item">
        <div class="timeline-photo" data-week="${photo.weekNumber}">
          <img src="${thumb}" alt="Week ${photo.weekNumber}">
        </div>
        <div class="timeline-meta">
          <div class="timeline-week">Week ${photo.weekNumber}${prompt ? ` \u2014 ${escapeHTML(prompt.title)}` : ''}</div>
          <div class="timeline-date">${dates}</div>
          ${photo.title ? `<div class="timeline-title">${escapeHTML(photo.title)}</div>` : ''}
          ${renderTimelineExif(photo.exif)}
        </div>
      </div>
    `;
  }
  return html;
}

function renderTimelineExif(exif) {
  if (!exif) return '';
  const tags = [];
  if (exif.camera) tags.push(exif.camera);
  if (exif.focalLength) tags.push(exif.focalLength);
  if (exif.aperture) tags.push(exif.aperture);
  if (exif.shutterSpeed) tags.push(exif.shutterSpeed);
  if (exif.iso) tags.push(`ISO ${exif.iso}`);
  if (tags.length === 0) return '';
  return `<div class="timeline-exif">${tags.map(t => `<span class="timeline-exif-tag">${escapeHTML(t)}</span>`).join('')}</div>`;
}

// ── Lightbox ────────────────────────────────────────────

async function openLightbox(weekNumber) {
  const photo = await getPhoto(currentDB, weekNumber);
  if (!photo) return;

  const lightbox = document.getElementById('lightbox');
  const content = document.getElementById('lightboxContent');

  const imageURL = photo.imageBlob ? await blobToDataURL(photo.imageBlob) : cachedThumbnails[weekNumber];
  const prompt = getPromptForWeek(weekNumber);
  const weekDates = getWeekDateRange(weekNumber, cachedStartDate);

  content.innerHTML = `
    <div class="lightbox-header">
      <div>
        <span class="week-badge">Week ${weekNumber}</span>
        ${prompt ? `<span style="color: var(--text-secondary); font-size: 13px; margin-left: 8px;">${escapeHTML(prompt.title)}</span>` : ''}
        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 2px;">${weekDates}</div>
      </div>
      <button class="lightbox-close" id="lightboxClose">&times;</button>
    </div>

    <div class="lightbox-image">
      <img src="${imageURL}" alt="Week ${weekNumber}">
    </div>

    <div class="lightbox-details">
      ${photo.title ? `<div class="lightbox-title">${escapeHTML(photo.title)}</div>` : ''}
      ${photo.notes ? `<div class="lightbox-notes">${escapeHTML(photo.notes)}</div>` : ''}
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: var(--space-md);">
        ${formatDate(photo.dateTaken)}
      </div>
      ${renderExifHTML(photo.exif)}
    </div>

    <div class="lightbox-actions">
      <button class="btn btn--secondary btn--small" id="lightboxShare">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        Share
      </button>
      <button class="btn btn--danger btn--small" id="lightboxDelete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        Delete
      </button>
    </div>
  `;

  lightbox.hidden = false;

  // Close button
  document.getElementById('lightboxClose')?.addEventListener('click', () => closeLightbox());

  // Backdrop click
  lightbox.querySelector('.lightbox-backdrop')?.addEventListener('click', () => closeLightbox());

  // Share
  document.getElementById('lightboxShare')?.addEventListener('click', async () => {
    try {
      if (navigator.share && photo.imageBlob) {
        const file = new File([photo.imageBlob], `photo-52-week-${weekNumber}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Week ${weekNumber}: ${prompt?.title || ''}`,
            text: photo.title || `My week ${weekNumber} photo`,
            files: [file]
          });
          return;
        }
      }
      // Fallback: download
      if (photo.imageBlob) {
        const url = URL.createObjectURL(photo.imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `photo-52-week-${weekNumber}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Photo downloaded', 'success');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Failed to share', 'error');
      }
    }
  });

  // Delete
  document.getElementById('lightboxDelete')?.addEventListener('click', async () => {
    const result = await showModal({
      icon: '🗑',
      title: 'Delete Photo?',
      message: `This will remove your week ${weekNumber} photo. This action cannot be undone.`,
      actions: [
        { label: 'Delete', danger: true, value: 'delete' },
        { label: 'Cancel', value: 'cancel' }
      ]
    });

    if (result === 'delete') {
      await deletePhoto(currentDB, weekNumber);
      delete cachedThumbnails[weekNumber];
      closeLightbox();
      showToast('Photo deleted', 'info');
      await renderGallery(currentDB);
    }
  });
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.hidden = true;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}