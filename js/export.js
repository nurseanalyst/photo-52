import { getAllPhotos, getPhoto, getSettings } from './db.js';
import { blobToDataURL } from './photo.js';
import { calculateStats, getCurrentWeek } from './progress.js';
import { showToast } from './ui.js';

// ── Zip Export ──────────────────────────────────────────

async function loadJSZip() {
  if (window.JSZip) return window.JSZip;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
    script.onload = () => resolve(window.JSZip);
    script.onerror = () => reject(new Error('Failed to load JSZip'));
    document.head.appendChild(script);
  });
}

export async function exportAllAsZip(db) {
  const JSZip = await loadJSZip();
  const zip = new JSZip();
  const photos = await getAllPhotos(db);

  for (const photo of photos) {
    const full = await getPhoto(db, photo.weekNumber);
    if (!full?.imageBlob) continue;

    const weekStr = String(photo.weekNumber).padStart(2, '0');
    const titleSlug = (photo.promptTitle || 'photo')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `week-${weekStr}-${titleSlug}.jpg`;
    zip.file(filename, full.imageBlob);
  }

  // Add metadata
  const metadata = photos.map(p => ({
    weekNumber: p.weekNumber,
    title: p.title,
    notes: p.notes,
    promptTitle: p.promptTitle,
    dateTaken: p.dateTaken,
    dateUploaded: p.dateUploaded,
    exif: p.exif
  }));
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'photo-52-export.zip');
}

// ── JSON Export ─────────────────────────────────────────

export async function exportMetadataJSON(db) {
  const photos = await getAllPhotos(db);
  const settings = await getSettings(db);

  const data = {
    exportDate: new Date().toISOString(),
    settings: {
      challengeStartDate: settings?.challengeStartDate,
      challengeYear: settings?.challengeYear
    },
    photos: photos.map(p => ({
      weekNumber: p.weekNumber,
      title: p.title,
      notes: p.notes,
      promptTitle: p.promptTitle,
      dateTaken: p.dateTaken,
      dateUploaded: p.dateUploaded,
      exif: p.exif
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'photo-52-metadata.json');
}

// ── Progress Card ───────────────────────────────────────

export async function generateProgressCard(db) {
  const photos = await getAllPhotos(db);
  const settings = await getSettings(db);
  const stats = calculateStats(photos, settings?.challengeStartDate);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 1080, 1080);

  // Subtle gradient
  const gradient = ctx.createRadialGradient(540, 200, 0, 540, 540, 600);
  gradient.addColorStop(0, 'rgba(232, 168, 73, 0.05)');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);

  // Title
  ctx.fillStyle = '#f0f0f0';
  ctx.font = '700 48px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('photo-52', 540, 120);

  // Subtitle
  ctx.fillStyle = '#8a8a8a';
  ctx.font = '400 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('52-Week Photo Challenge', 540, 160);

  // Progress ring
  const cx = 540, cy = 380, r = 140;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#1e1e1e';
  ctx.lineWidth = 20;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (stats.percentage / 100) * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = '#e8a849';
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Number inside ring
  ctx.fillStyle = '#f0f0f0';
  ctx.font = '700 72px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${stats.completed}`, cx, cy + 10);
  ctx.fillStyle = '#8a8a8a';
  ctx.font = '400 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`of ${stats.total} weeks`, cx, cy + 45);

  // Stats row
  const statsY = 600;
  const statItems = [
    { label: 'COMPLETED', value: `${stats.completed}` },
    { label: 'STREAK', value: `${stats.currentStreak}` },
    { label: 'PROGRESS', value: `${stats.percentage}%` }
  ];

  statItems.forEach((item, i) => {
    const x = 220 + i * 320;
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '700 48px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(item.value, x, statsY);
    ctx.fillStyle = '#8a8a8a';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(item.label, x, statsY + 30);
  });

  // Mini grid
  const gridStartX = 108;
  const gridStartY = 700;
  const cellSize = 56;
  const gap = 10;
  const completedWeeks = new Set(photos.map(p => p.weekNumber));

  for (let w = 1; w <= 52; w++) {
    const col = (w - 1) % 13;
    const row = Math.floor((w - 1) / 13);
    const x = gridStartX + col * (cellSize + gap);
    const y = gridStartY + row * (cellSize + gap);

    if (completedWeeks.has(w)) {
      ctx.fillStyle = '#e8a849';
    } else {
      ctx.fillStyle = '#1e1e1e';
    }
    roundedRect(ctx, x, y, cellSize, cellSize, 6);
    ctx.fill();
  }

  // Watermark
  ctx.fillStyle = '#555';
  ctx.font = '400 18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('photo-52 — 52-Week Photo Challenge', 540, 1050);

  // Export
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], 'photo-52-progress.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My photo-52 Progress',
          text: `${stats.completed} of 52 weeks completed!`,
          files: [file]
        });
        return;
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  downloadBlob(blob, 'photo-52-progress.png');
  showToast('Progress card downloaded', 'success');
}

// ── Helpers ─────────────────────────────────────────────

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}