const DB_NAME = 'photo52';
const DB_VERSION = 1;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('photos')) {
        const store = db.createObjectStore('photos', { keyPath: 'weekNumber' });
        store.createIndex('dateTaken', 'dateTaken', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── Photos CRUD ─────────────────────────────────────────

function tx(db, store, mode = 'readonly') {
  const transaction = db.transaction(store, mode);
  return transaction.objectStore(store);
}

export function savePhoto(db, photo) {
  return new Promise((resolve, reject) => {
    const store = tx(db, 'photos', 'readwrite');
    const request = store.put(photo);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function getPhoto(db, weekNumber) {
  return new Promise((resolve, reject) => {
    const store = tx(db, 'photos');
    const request = store.get(weekNumber);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export function deletePhoto(db, weekNumber) {
  return new Promise((resolve, reject) => {
    const store = tx(db, 'photos', 'readwrite');
    const request = store.delete(weekNumber);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function getAllPhotos(db) {
  return new Promise((resolve, reject) => {
    const store = tx(db, 'photos');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export function getPhotoCount(db) {
  return new Promise((resolve, reject) => {
    const store = tx(db, 'photos');
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── Settings CRUD ───────────────────────────────────────

export function getSettings(db) {
  return new Promise((resolve, reject) => {
    const store = tx(db, 'settings');
    const request = store.get('user');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export function saveSettings(db, settings) {
  return new Promise((resolve, reject) => {
    settings.id = 'user';
    const store = tx(db, 'settings', 'readwrite');
    const request = store.put(settings);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ── Utility ─────────────────────────────────────────────

export function clearAllData(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos', 'settings'], 'readwrite');
    transaction.objectStore('photos').clear();
    transaction.objectStore('settings').clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    return {
      usage: est.usage || 0,
      quota: est.quota || 0,
      percentage: est.quota ? Math.round((est.usage / est.quota) * 100) : 0
    };
  }
  return { usage: 0, quota: 0, percentage: 0 };
}