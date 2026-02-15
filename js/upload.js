import { getPhoto, savePhoto, getAllPhotos, getSettings } from './db.js';
import { extractExif, resizeImage, generateThumbnail, blobToDataURL, renderExifHTML } from './photo.js';
import { getPromptForWeek } from './prompts.js';
import { getCurrentWeek, checkAndShowMilestone, getWeekDateRange } from './progress.js';
import { showToast } from './ui.js';

let currentDB = null;
let selectedWeek = null;
let pendingFile = null;
let pendingExif = null;
let initialized = false;

export async function renderUpload(db) {
  currentDB = db;
  const container = document.getElementById('uploadContent');
  const settings = await getSettings(db);
  const currentWeekNum = getCurrentWeek(settings?.challengeStartDate);
  const photos = await getAllPhotos(db);
  const filledWeeks = new Set(photos.map(p => p.weekNumber));

  if (!initialized) {
    selectedWeek = currentWeekNum > 52 ? 52 : currentWeekNum;
    initialized = true;
  }

  const prompt = getPromptForWeek(selectedWeek);
  const hasPhoto = filledWeeks.has(selectedWeek);
  const startDate = settings?.challengeStartDate;
  const weekDates = getWeekDateRange(selectedWeek, startDate);

  container.innerHTML = `
    <div class="upload-section">
      <div class="upload-section-title">Select Week</div>
      <div class="week-selector" id="weekSelector">
        ${buildWeekPills(currentWeekNum, filledWeeks, startDate)}
      </div>
    </div>

    <div class="prompt-card" style="margin-bottom: var(--space-lg)">
      <div class="prompt-week">Week ${selectedWeek} &middot; ${weekDates}</div>
      <div class="prompt-arc" style="font-size:11px; color:var(--text-tertiary); margin-bottom:var(--space-xs);">${prompt ? getArcLabel(selectedWeek) : ''}</div>
      <div class="prompt-title">${prompt ? escapeHTML(prompt.title) : 'Unknown'}</div>
      <div class="prompt-description">${prompt ? escapeHTML(prompt.description) : ''}</div>
      <div class="prompt-tips">${prompt ? escapeHTML(prompt.tips) : ''}</div>
      ${hasPhoto ? '<div class="prompt-status"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Photo uploaded</div>' : ''}
    </div>

    <div id="uploadArea">
      ${hasPhoto ? renderReplaceUI() : renderUploadZone()}
    </div>

    <div id="previewArea" hidden></div>
  `;

  setupUploadEvents(container, currentWeekNum, filledWeeks);
  scrollToActiveWeek();
}

function buildWeekPills(currentWeek, filledWeeks, startDate) {
  let html = '';
  for (let w = 1; w <= 52; w++) {
    const isActive = w === selectedWeek;
    const hasPic = filledWeeks.has(w);
    const dates = getWeekDateRange(w, startDate);
    const cls = ['week-pill'];
    if (isActive) cls.push('active');
    if (hasPic) cls.push('week-pill--has-photo');
    html += `<button class="${cls.join(' ')}" data-week="${w}" title="${dates}">W${w}</button>`;
  }
  return html;
}

function renderUploadZone() {
  return `
    <div class="upload-zone" id="dropZone">
      <svg class="upload-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <div class="upload-zone-text">Drop a photo or tap to select</div>
      <div class="upload-buttons">
        <label class="btn btn--primary btn--small">
          Choose Photo
          <input type="file" accept="image/*" id="fileInput" hidden>
        </label>
        <label class="btn btn--secondary btn--small">
          Camera
          <input type="file" accept="image/*" capture="environment" id="cameraInput" hidden>
        </label>
      </div>
    </div>
  `;
}

function renderReplaceUI() {
  return `
    <div style="text-align:center; padding: var(--space-lg) 0;">
      <p style="color: var(--text-secondary); margin-bottom: var(--space-md);">This week already has a photo. Upload a new one to replace it.</p>
      <div class="upload-buttons" style="justify-content:center;">
        <label class="btn btn--secondary btn--small">
          Replace Photo
          <input type="file" accept="image/*" id="fileInput" hidden>
        </label>
        <label class="btn btn--secondary btn--small">
          Camera
          <input type="file" accept="image/*" capture="environment" id="cameraInput" hidden>
        </label>
      </div>
    </div>
  `;
}

function setupUploadEvents(container, currentWeek, filledWeeks) {
  // Week selector
  container.querySelector('#weekSelector')?.addEventListener('click', async (e) => {
    const pill = e.target.closest('[data-week]');
    if (!pill) return;
    selectedWeek = parseInt(pill.dataset.week);
    await renderUpload(currentDB);
  });

  // File inputs
  const fileInput = container.querySelector('#fileInput');
  const cameraInput = container.querySelector('#cameraInput');

  fileInput?.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
  cameraInput?.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

  // Drag and drop
  const dropZone = container.querySelector('#dropZone');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) handleFileSelect(file);
    });
  }
}

async function handleFileSelect(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    return;
  }

  const previewArea = document.getElementById('previewArea');
  const uploadArea = document.getElementById('uploadArea');

  // Show loading state
  previewArea.hidden = false;
  previewArea.innerHTML = '<div class="card" style="text-align:center; padding: var(--space-xl);"><div class="skeleton" style="width:100%; height:300px; margin-bottom: var(--space-md);"></div><p style="color: var(--text-secondary);">Processing photo...</p></div>';
  uploadArea.hidden = true;

  try {
    // Extract EXIF in parallel with creating preview
    const [exif, previewURL] = await Promise.all([
      extractExif(file),
      blobToDataURL(file)
    ]);

    pendingFile = file;
    pendingExif = exif;

    const prompt = getPromptForWeek(selectedWeek);

    previewArea.innerHTML = `
      <div class="upload-preview">
        <img src="${previewURL}" alt="Preview">
      </div>

      ${renderExifHTML(exif)}

      <div class="field">
        <label class="field-label">Title (optional)</label>
        <input type="text" class="field-input" id="photoTitle" placeholder="${prompt ? prompt.title : `Week ${selectedWeek}`}">
      </div>

      <div class="field">
        <label class="field-label">Notes (optional)</label>
        <textarea class="field-input" id="photoNotes" placeholder="Any thoughts about this shot..."></textarea>
      </div>

      <div style="display:flex; gap: var(--space-sm); margin-top: var(--space-lg);">
        <button class="btn btn--primary btn--full" id="savePhotoBtn">Save Photo</button>
        <button class="btn btn--secondary" id="cancelUploadBtn">Cancel</button>
      </div>
    `;

    document.getElementById('savePhotoBtn')?.addEventListener('click', () => saveCurrentPhoto());
    document.getElementById('cancelUploadBtn')?.addEventListener('click', () => cancelUpload());

  } catch (err) {
    showToast('Failed to process photo', 'error');
    cancelUpload();
  }
}

async function saveCurrentPhoto() {
  if (!pendingFile || !currentDB) return;

  const saveBtn = document.getElementById('savePhotoBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  try {
    const settings = await getSettings(currentDB);
    const maxSize = settings?.photoMaxSize || 2048;
    const quality = settings?.jpegQuality || 0.8;

    const [imageBlob, thumbnailBlob] = await Promise.all([
      resizeImage(pendingFile, maxSize, quality),
      generateThumbnail(pendingFile, 200)
    ]);

    const prompt = getPromptForWeek(selectedWeek);
    const title = document.getElementById('photoTitle')?.value.trim() || '';
    const notes = document.getElementById('photoNotes')?.value.trim() || '';

    const photo = {
      weekNumber: selectedWeek,
      imageBlob,
      thumbnailBlob,
      dateTaken: pendingExif?.dateTimeOriginal
        ? new Date(pendingExif.dateTimeOriginal).toISOString()
        : new Date().toISOString(),
      dateUploaded: new Date().toISOString(),
      weekLabel: `Week ${selectedWeek}`,
      promptTitle: prompt?.title || '',
      exif: pendingExif,
      title,
      notes,
      cloudinaryId: null,
      cloudinaryUrl: null,
      syncedAt: null
    };

    await savePhoto(currentDB, photo);

    showToast('Photo saved!', 'success');

    // Check for milestone celebration
    await checkAndShowMilestone(currentDB);

    // Reset and refresh
    pendingFile = null;
    pendingExif = null;
    await renderUpload(currentDB);

  } catch (err) {
    showToast('Failed to save photo: ' + err.message, 'error');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Photo';
    }
  }
}

function cancelUpload() {
  pendingFile = null;
  pendingExif = null;
  const previewArea = document.getElementById('previewArea');
  const uploadArea = document.getElementById('uploadArea');
  if (previewArea) previewArea.hidden = true;
  if (uploadArea) uploadArea.hidden = false;
}

function scrollToActiveWeek() {
  const selector = document.getElementById('weekSelector');
  const active = selector?.querySelector('.week-pill.active');
  if (active && selector) {
    active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
}

function getArcLabel(weekNumber) {
  const arcNames = [
    'Foundations', 'Light & Shadow', 'Color & Tone', 'Composition',
    'Perspective', 'Texture & Pattern', 'People & Stories', 'Nature',
    'Urban', 'Abstract & Creative', 'Emotion & Mood', 'Challenge Yourself', 'Culmination'
  ];
  const arcIndex = Math.floor((weekNumber - 1) / 4);
  return arcNames[arcIndex] || '';
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}