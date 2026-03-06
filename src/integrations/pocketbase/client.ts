import PocketBase from 'pocketbase';

const PB_URL = import.meta.env.VITE_POCKETBASE_URL;

export const pb = new PocketBase(PB_URL);

// Helper to get file URL from a record
export function getFileUrl(
  collectionId: string,
  recordId: string,
  filename: string,
): string {
  return `${PB_URL}/api/files/${collectionId}/${recordId}/${filename}`;
}
