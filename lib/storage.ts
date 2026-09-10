import { put, del } from '@vercel/blob';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

function extensionFromDataUri(dataUri: string): string {
  const mime = dataUri.match(/^data:([^;]+);base64,/)?.[1] ?? '';
  return EXTENSION_BY_MIME[mime] ?? 'bin';
}

// Uploads a base64 data URI to Vercel Blob and returns its public URL.
// pathPrefix should be a stable, non-guessable-enough key (e.g. `suppliers/<id>/letterhead`) —
// Blob still adds a random suffix on top so re-uploads never collide.
export async function uploadDataUri(dataUri: string, pathPrefix: string): Promise<string> {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  const buffer = Buffer.from(base64, 'base64');
  const ext = extensionFromDataUri(dataUri);
  const blob = await put(`${pathPrefix}.${ext}`, buffer, {
    access: 'public',
    addRandomSuffix: true,
  });
  return blob.url;
}

// Best-effort cleanup — a failed delete (e.g. already gone) shouldn't block the caller.
export async function deleteBlobUrl(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // ignore
  }
}
