export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB — mirrors the client-side limit
export const MAX_CERTIFICATE_BYTES = 3 * 1024 * 1024; // 3 MB — mirrors SupplierProductManager's client check

function decodedByteSize(dataUri: string): number {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  return (base64.length * 3) / 4;
}

export function isDocumentFormat(dataUri: string): boolean {
  return /^data:(application\/pdf|image\/(jpeg|png));base64,/.test(dataUri);
}

// Client-side size checks (browser File.size) are trivial to bypass with a direct
// API call, so every endpoint accepting a base64 file must re-check server-side.
export function validateImageDataUri(dataUri: string, maxBytes = MAX_LOGO_BYTES): string | null {
  if (!/^data:image\/(jpeg|png);base64,/.test(dataUri)) {
    return 'Файл должен быть изображением JPEG или PNG.';
  }
  if (decodedByteSize(dataUri) > maxBytes) {
    return 'Файл слишком большой (максимум 2 МБ).';
  }
  return null;
}

export function validateCertificateDataUri(dataUri: string, maxBytes = MAX_CERTIFICATE_BYTES): string | null {
  if (!isDocumentFormat(dataUri)) {
    return 'Файл должен быть в формате PDF, JPEG или PNG.';
  }
  if (decodedByteSize(dataUri) > maxBytes) {
    return 'Файл слишком большой (максимум 3 МБ).';
  }
  return null;
}
