import { getAllPhotos, getPhoto, savePhoto } from './db.js';

export async function uploadToCloudinary(weekNumber, blob, metadata, config) {
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', config.cloudinaryUploadPreset);
  formData.append('tags', `photo-52,week-${weekNumber}`);
  formData.append('folder', 'photo-52');

  if (metadata?.title) {
    formData.append('context', `week=${weekNumber}|title=${metadata.title}`);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Upload failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
    width: data.width,
    height: data.height
  };
}

export async function syncAllToCloudinary(db, config) {
  if (!config.cloudinaryCloudName || !config.cloudinaryUploadPreset) {
    throw new Error('Cloudinary not configured');
  }

  const photos = await getAllPhotos(db);
  const unsynced = photos.filter(p => !p.cloudinaryId);

  let synced = 0;
  let failed = 0;

  for (const photo of unsynced) {
    try {
      const fullPhoto = await getPhoto(db, photo.weekNumber);
      if (!fullPhoto?.imageBlob) continue;

      const result = await uploadToCloudinary(
        photo.weekNumber,
        fullPhoto.imageBlob,
        { title: photo.title },
        config
      );

      fullPhoto.cloudinaryId = result.publicId;
      fullPhoto.cloudinaryUrl = result.secureUrl;
      fullPhoto.syncedAt = new Date().toISOString();
      await savePhoto(db, fullPhoto);
      synced++;
    } catch (err) {
      console.warn(`Failed to sync week ${photo.weekNumber}:`, err);
      failed++;
    }
  }

  return { synced, failed, total: unsynced.length };
}

export async function testCloudinaryConnection(config) {
  if (!config.cloudinaryCloudName) return false;

  try {
    // Try to fetch the cloud's info endpoint
    const response = await fetch(
      `https://res.cloudinary.com/${config.cloudinaryCloudName}/image/upload/sample.jpg`,
      { method: 'HEAD' }
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function listCloudinaryPhotos(config) {
  try {
    const response = await fetch(
      `https://res.cloudinary.com/${config.cloudinaryCloudName}/image/list/photo-52.json`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.resources || [];
  } catch {
    return [];
  }
}