export type OutdoorDraft = {
  note: string;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string | null;
  photo: Blob | null;
};

export const emptyOutdoorDraft = (): OutdoorDraft => ({ note: '', latitude: null, longitude: null, capturedAt: null, photo: null });
export const hasOutdoorMemory = (draft: OutdoorDraft) => Boolean(draft.note.trim() || draft.photo || draft.latitude !== null);
export const approximateCoordinate = (value: number) => Math.round(value * 100) / 100;

const databaseName = 'bloombreak-outdoor-drafts';
const storeName = 'drafts';

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('This browser cannot keep a photo draft.')); return; }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(storeName); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open photo drafts.'));
  });
}

async function draftTransaction<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore, setResult: (value: T) => void) => void): Promise<T> {
  const db = await openDraftDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result: T;
    transaction.oncomplete = () => { db.close(); resolve(result); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error('Could not save memory draft.')); };
    work(store, value => { result = value; });
  });
}

export async function readOutdoorDraft(key: string): Promise<OutdoorDraft> {
  return draftTransaction('readonly', (store, setResult) => {
    const request = store.get(key);
    request.onsuccess = () => setResult(request.result ?? emptyOutdoorDraft());
  });
}

export async function writeOutdoorDraft(key: string, draft: OutdoorDraft): Promise<void> {
  return draftTransaction('readwrite', store => {
    store.put(draft, key);
  });
}

export async function clearOutdoorDraft(key: string): Promise<void> {
  return draftTransaction('readwrite', store => {
    store.delete(key);
  });
}

// Drawing into a new JPEG removes EXIF, including GPS metadata, before upload.
export async function prepareOutdoorPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024) throw new Error('Choose an image smaller than 15 MB.');
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not read this image.'));
      image.src = source;
    });
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare this photo.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const photo = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not prepare this photo.')), 'image/jpeg', 0.8));
    if (photo.size > 3 * 1024 * 1024) throw new Error('This photo is too large after processing.');
    return photo;
  } finally { URL.revokeObjectURL(source); }
}

export async function getApproximateLocation(): Promise<{ latitude: number; longitude: number }> {
  if (!navigator.geolocation) throw new Error('Location is unavailable in this browser.');
  const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, maximumAge: 0, timeout: 12000 }));
  return { latitude: approximateCoordinate(position.coords.latitude), longitude: approximateCoordinate(position.coords.longitude) };
}
