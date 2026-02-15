let exifr = null;

async function loadExifr() {
  if (exifr) return exifr;
  try {
    const module = await import('https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/lite.esm.mjs');
    exifr = module.default || module;
    return exifr;
  } catch {
    console.warn('Failed to load exifr library');
    return null;
  }
}

export async function extractExif(file) {
  const lib = await loadExifr();
  if (!lib) return null;

  try {
    const data = await lib.parse(file, {
      pick: [
        'Make', 'Model',
        'LensModel', 'LensMake',
        'FocalLength', 'FocalLengthIn35mmFormat',
        'FNumber',
        'ExposureTime',
        'ISOSpeedRatings', 'ISO',
        'DateTimeOriginal', 'CreateDate',
        'GPSLatitude', 'GPSLongitude',
        'ImageWidth', 'ImageHeight',
        'ExifImageWidth', 'ExifImageHeight',
        'Orientation'
      ],
      gps: true
    });

    if (!data) return null;

    return {
      camera: formatCamera(data.Make, data.Model),
      lens: data.LensModel || data.LensMake || null,
      focalLength: data.FocalLengthIn35mmFormat
        ? `${data.FocalLengthIn35mmFormat}mm`
        : data.FocalLength
          ? `${Math.round(data.FocalLength)}mm`
          : null,
      aperture: data.FNumber ? `f/${data.FNumber}` : null,
      shutterSpeed: formatShutterSpeed(data.ExposureTime),
      iso: data.ISOSpeedRatings || data.ISO || null,
      width: data.ExifImageWidth || data.ImageWidth || null,
      height: data.ExifImageHeight || data.ImageHeight || null,
      gps: (data.latitude && data.longitude) ? {
        latitude: data.latitude,
        longitude: data.longitude
      } : null,
      dateTimeOriginal: data.DateTimeOriginal || data.CreateDate || null,
      orientation: data.Orientation || 1
    };
  } catch (err) {
    console.warn('EXIF extraction failed:', err);
    return null;
  }
}

function formatCamera(make, model) {
  if (!model) return make || null;
  if (make && model.toLowerCase().startsWith(make.toLowerCase())) {
    return model;
  }
  return make ? `${make} ${model}` : model;
}

function formatShutterSpeed(exposureTime) {
  if (!exposureTime) return null;
  if (exposureTime >= 1) return `${exposureTime}s`;
  return `1/${Math.round(1 / exposureTime)}s`;
}

export function resizeImage(file, maxDimension = 2048, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

export function generateThumbnail(file, size = 200) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;
      const min = Math.min(width, height);
      const sx = (width - min) / 2;
      const sy = (height - min) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      canvas.toBlob(resolve, 'image/jpeg', 0.7);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

export function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

export function renderExifHTML(exif) {
  if (!exif) return '';

  const settings = [
    exif.aperture,
    exif.shutterSpeed,
    exif.iso ? `ISO ${exif.iso}` : null,
    exif.focalLength
  ].filter(Boolean);

  let html = '<div class="exif-card">';

  if (exif.camera) {
    html += `<div class="exif-camera">${escapeHTML(exif.camera)}</div>`;
  }
  if (exif.lens) {
    html += `<div class="exif-lens">${escapeHTML(exif.lens)}</div>`;
  }
  if (settings.length) {
    html += '<div class="exif-settings">';
    settings.forEach(s => {
      html += `<span class="exif-setting">${escapeHTML(s)}</span>`;
    });
    html += '</div>';
  }
  if (exif.gps) {
    html += `<div class="exif-location">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      ${exif.gps.latitude.toFixed(4)}, ${exif.gps.longitude.toFixed(4)}
    </div>`;
  }

  html += '</div>';
  return html;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}