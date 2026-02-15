import { getSettings, saveSettings, clearAllData, getStorageEstimate, getAllPhotos } from './db.js';
import { showToast, showModal, formatFileSize } from './ui.js';
import { exportAllAsZip, exportMetadataJSON, generateProgressCard } from './export.js';
import { syncAllToCloudinary, testCloudinaryConnection } from './cloudinary.js';

let currentDB = null;

export async function renderSettings(db) {
  currentDB = db;
  const container = document.getElementById('settingsContent');
  const settings = await getSettings(db);
  const photos = await getAllPhotos(db);
  const storage = await getStorageEstimate();

  const cloudSynced = photos.filter(p => p.cloudinaryId).length;

  container.innerHTML = `
    <!-- Challenge Setup -->
    <div class="settings-group">
      <div class="settings-group-title">Challenge</div>
      <div class="settings-item" style="border-radius: var(--radius-md) var(--radius-md) 0 0;">
        <div>
          <div class="settings-item-label">Start Date</div>
          <div class="settings-item-desc">When did your challenge begin?</div>
        </div>
        <input type="date" class="field-input" id="settingsStartDate" value="${settings?.challengeStartDate || ''}" style="width: auto; text-align: right;">
      </div>
      <div class="settings-item" style="border-radius: 0 0 var(--radius-md) var(--radius-md);">
        <div>
          <div class="settings-item-label">Photos</div>
          <div class="settings-item-desc">${photos.length} of 52 weeks completed</div>
        </div>
        <div class="settings-item-value">${Math.round((photos.length / 52) * 100)}%</div>
      </div>
    </div>

    <!-- Photo Quality -->
    <div class="settings-group">
      <div class="settings-group-title">Photo Quality</div>
      <div class="settings-item" style="border-radius: var(--radius-md) var(--radius-md) 0 0;">
        <div>
          <div class="settings-item-label">Max Size</div>
          <div class="settings-item-desc">Longest edge in pixels</div>
        </div>
        <select class="field-input" id="settingsMaxSize" style="width: auto;">
          <option value="1024" ${settings?.photoMaxSize === 1024 ? 'selected' : ''}>1024px</option>
          <option value="2048" ${settings?.photoMaxSize === 2048 ? 'selected' : ''}>2048px</option>
          <option value="4096" ${settings?.photoMaxSize === 4096 ? 'selected' : ''}>4096px</option>
        </select>
      </div>
      <div class="settings-item" style="border-radius: 0 0 var(--radius-md) var(--radius-md);">
        <div>
          <div class="settings-item-label">JPEG Quality</div>
          <div class="settings-item-desc">Higher = larger files</div>
        </div>
        <select class="field-input" id="settingsQuality" style="width: auto;">
          <option value="0.6" ${settings?.jpegQuality === 0.6 ? 'selected' : ''}>60%</option>
          <option value="0.7" ${settings?.jpegQuality === 0.7 ? 'selected' : ''}>70%</option>
          <option value="0.8" ${settings?.jpegQuality === 0.8 ? 'selected' : ''}>80%</option>
          <option value="0.9" ${settings?.jpegQuality === 0.9 ? 'selected' : ''}>90%</option>
        </select>
      </div>
    </div>

    <!-- Cloud Sync -->
    <div class="settings-group">
      <div class="settings-group-title">Cloud Sync</div>
      <div class="settings-item" style="border-radius: var(--radius-md) var(--radius-md) 0 0;">
        <div>
          <div class="settings-item-label">Enable Cloudinary Sync</div>
          <div class="settings-item-desc">Sync photos across devices</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="settingsCloudEnabled" ${settings?.cloudinaryEnabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div id="cloudinarySettings" ${settings?.cloudinaryEnabled ? '' : 'hidden'}>
        <div class="settings-item">
          <div style="flex:1;">
            <div class="settings-item-label">Cloud Name</div>
            <input type="text" class="field-input" id="settingsCloudName" value="${settings?.cloudinaryCloudName || ''}" placeholder="your-cloud-name" style="margin-top: 4px;">
          </div>
        </div>
        <div class="settings-item">
          <div style="flex:1;">
            <div class="settings-item-label">Upload Preset</div>
            <input type="text" class="field-input" id="settingsUploadPreset" value="${settings?.cloudinaryUploadPreset || ''}" placeholder="unsigned-preset" style="margin-top: 4px;">
          </div>
        </div>
        <div class="settings-item" style="flex-direction: column; align-items: stretch; gap: var(--space-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="settings-item-label">Sync Status</div>
            <div class="settings-item-value">${cloudSynced} / ${photos.length} synced</div>
          </div>
          <div style="display: flex; gap: var(--space-sm);">
            <button class="btn btn--secondary btn--small" id="testCloudBtn">Test Connection</button>
            <button class="btn btn--primary btn--small" id="syncAllBtn" ${photos.length === 0 ? 'disabled' : ''}>Sync All</button>
          </div>
        </div>
      </div>
      <div class="settings-item" style="border-radius: 0 0 var(--radius-md) var(--radius-md); ${settings?.cloudinaryEnabled ? '' : 'border-radius: 0 0 var(--radius-md) var(--radius-md);'}">
        <div>
          <div class="settings-item-desc" style="font-size: 12px;">
            Cloudinary provides 25GB free storage. Create an unsigned upload preset in your Cloudinary dashboard.
          </div>
        </div>
      </div>
    </div>

    <!-- Data Management -->
    <div class="settings-group">
      <div class="settings-group-title">Data</div>
      <div class="settings-item" style="border-radius: var(--radius-md) var(--radius-md) 0 0;">
        <div>
          <div class="settings-item-label">Storage Used</div>
          <div class="settings-item-desc">${formatFileSize(storage.usage)} of ${formatFileSize(storage.quota)}</div>
        </div>
        <div class="settings-item-value">${storage.percentage}%</div>
      </div>
      <div class="settings-item">
        <div>
          <div class="settings-item-label">Export All Photos</div>
          <div class="settings-item-desc">Download as ZIP archive</div>
        </div>
        <button class="btn btn--secondary btn--small" id="exportZipBtn" ${photos.length === 0 ? 'disabled' : ''}>Export</button>
      </div>
      <div class="settings-item">
        <div>
          <div class="settings-item-label">Export Metadata</div>
          <div class="settings-item-desc">Download as JSON file</div>
        </div>
        <button class="btn btn--secondary btn--small" id="exportJsonBtn" ${photos.length === 0 ? 'disabled' : ''}>Export</button>
      </div>
      <div class="settings-item">
        <div>
          <div class="settings-item-label">Share Progress</div>
          <div class="settings-item-desc">Generate a shareable progress card</div>
        </div>
        <button class="btn btn--secondary btn--small" id="shareProgressBtn">Share</button>
      </div>
      <div class="settings-item" style="border-radius: 0 0 var(--radius-md) var(--radius-md);">
        <div>
          <div class="settings-item-label" style="color: var(--error);">Reset Challenge</div>
          <div class="settings-item-desc">Delete all photos and data</div>
        </div>
        <button class="btn btn--danger btn--small" id="resetBtn">Reset</button>
      </div>
    </div>

    <!-- About -->
    <div class="settings-group">
      <div class="settings-group-title">About</div>
      <div class="settings-item" style="border-radius: var(--radius-md);">
        <div>
          <div class="settings-item-label">photo-52</div>
          <div class="settings-item-desc">52-Week Photo Challenge Tracker — v1.0</div>
        </div>
      </div>
    </div>
  `;

  setupSettingsEvents(container, settings);
}

function setupSettingsEvents(container, settings) {
  // Start date
  container.querySelector('#settingsStartDate')?.addEventListener('change', async (e) => {
    settings.challengeStartDate = e.target.value;
    await saveSettings(currentDB, settings);
    showToast('Start date updated', 'success');
  });

  // Max size
  container.querySelector('#settingsMaxSize')?.addEventListener('change', async (e) => {
    settings.photoMaxSize = parseInt(e.target.value);
    await saveSettings(currentDB, settings);
    showToast('Photo size updated', 'success');
  });

  // Quality
  container.querySelector('#settingsQuality')?.addEventListener('change', async (e) => {
    settings.jpegQuality = parseFloat(e.target.value);
    await saveSettings(currentDB, settings);
    showToast('Quality updated', 'success');
  });

  // Cloudinary toggle
  container.querySelector('#settingsCloudEnabled')?.addEventListener('change', async (e) => {
    settings.cloudinaryEnabled = e.target.checked;
    await saveSettings(currentDB, settings);
    const cloudSection = container.querySelector('#cloudinarySettings');
    if (cloudSection) cloudSection.hidden = !e.target.checked;
  });

  // Cloudinary cloud name
  container.querySelector('#settingsCloudName')?.addEventListener('change', async (e) => {
    settings.cloudinaryCloudName = e.target.value.trim();
    await saveSettings(currentDB, settings);
  });

  // Cloudinary upload preset
  container.querySelector('#settingsUploadPreset')?.addEventListener('change', async (e) => {
    settings.cloudinaryUploadPreset = e.target.value.trim();
    await saveSettings(currentDB, settings);
  });

  // Test connection
  container.querySelector('#testCloudBtn')?.addEventListener('click', async () => {
    const btn = container.querySelector('#testCloudBtn');
    btn.disabled = true;
    btn.textContent = 'Testing...';
    try {
      const ok = await testCloudinaryConnection(settings);
      if (ok) {
        showToast('Connection successful!', 'success');
      } else {
        showToast('Connection failed. Check your settings.', 'error');
      }
    } catch {
      showToast('Connection failed', 'error');
    }
    btn.disabled = false;
    btn.textContent = 'Test Connection';
  });

  // Sync all
  container.querySelector('#syncAllBtn')?.addEventListener('click', async () => {
    const btn = container.querySelector('#syncAllBtn');
    btn.disabled = true;
    btn.textContent = 'Syncing...';
    try {
      const result = await syncAllToCloudinary(currentDB, settings);
      showToast(`Synced ${result.synced} photos`, 'success');
      await renderSettings(currentDB);
    } catch (err) {
      showToast('Sync failed: ' + err.message, 'error');
    }
    btn.disabled = false;
    btn.textContent = 'Sync All';
  });

  // Export ZIP
  container.querySelector('#exportZipBtn')?.addEventListener('click', async () => {
    const btn = container.querySelector('#exportZipBtn');
    btn.disabled = true;
    btn.textContent = 'Exporting...';
    try {
      await exportAllAsZip(currentDB);
      showToast('Export downloaded', 'success');
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
    btn.disabled = false;
    btn.textContent = 'Export';
  });

  // Export JSON
  container.querySelector('#exportJsonBtn')?.addEventListener('click', async () => {
    try {
      await exportMetadataJSON(currentDB);
      showToast('Metadata exported', 'success');
    } catch (err) {
      showToast('Export failed', 'error');
    }
  });

  // Share progress
  container.querySelector('#shareProgressBtn')?.addEventListener('click', async () => {
    try {
      await generateProgressCard(currentDB);
    } catch (err) {
      showToast('Failed to generate progress card', 'error');
    }
  });

  // Reset
  container.querySelector('#resetBtn')?.addEventListener('click', async () => {
    const result = await showModal({
      icon: '⚠️',
      title: 'Reset Challenge?',
      message: 'This will permanently delete ALL photos and data. This cannot be undone.',
      actions: [
        { label: 'Delete Everything', danger: true, value: 'reset' },
        { label: 'Cancel', value: 'cancel' }
      ]
    });

    if (result === 'reset') {
      const confirm = await showModal({
        icon: '🔴',
        title: 'Are you sure?',
        message: 'Last chance. All your photos will be permanently deleted.',
        actions: [
          { label: 'Yes, Delete All', danger: true, value: 'confirm' },
          { label: 'Keep My Data', primary: true, value: 'cancel' }
        ]
      });

      if (confirm === 'confirm') {
        await clearAllData(currentDB);
        showToast('All data has been cleared', 'info');
        location.hash = 'home';
        location.reload();
      }
    }
  });
}