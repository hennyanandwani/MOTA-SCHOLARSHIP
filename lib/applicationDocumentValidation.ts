export const MAX_APPLICATION_DOCUMENT_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export function detectApplicationDocumentMimeType(
  bytes: Uint8Array,
): (typeof allowedMimeTypes)[number] | null {
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "application/pdf";
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  return null;
}

export function getDocumentUploadValidationError(input: {
  size: number;
  declaredMimeType: string;
  bytes: Uint8Array;
}): string | null {
  if (input.size === 0 || input.size > MAX_APPLICATION_DOCUMENT_SIZE) {
    return "File must be between 1 byte and 5 MB";
  }

  const detectedMimeType = detectApplicationDocumentMimeType(input.bytes);
  if (!detectedMimeType || !allowedMimeTypes.includes(detectedMimeType)) {
    return "Only valid PDF, JPEG and PNG files are accepted";
  }

  if (input.declaredMimeType && input.declaredMimeType !== detectedMimeType) {
    return "File content does not match its declared type";
  }

  return null;
}
