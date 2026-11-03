const FALLBACK_DESTINATION = "/student";
const VALIDATION_ORIGIN = "https://fellowshift.invalid";

function decodeRepeatedly(value: string): string | null {
  let decoded = value;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return decoded;
      decoded = next;
    } catch {
      return null;
    }
  }

  try {
    return decodeURIComponent(decoded) === decoded ? decoded : null;
  } catch {
    return null;
  }
}

function containsEncodedPathSeparator(pathname: string): boolean {
  let value = pathname;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (/%(?:2f|5c)/i.test(value)) return true;

    const decoded = decodeRepeatedlyOnce(value);
    if (decoded === null) return true;
    if (decoded === value) return false;
    value = decoded;
  }

  return true;
}

function decodeRepeatedlyOnce(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function getSafeAuthRedirectPath(destination: string | null): string {
  if (
    !destination ||
    !destination.startsWith("/") ||
    destination.startsWith("//")
  ) {
    return FALLBACK_DESTINATION;
  }

  const fullyDecoded = decodeRepeatedly(destination);
  if (
    fullyDecoded === null ||
    fullyDecoded.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(fullyDecoded)
  ) {
    return FALLBACK_DESTINATION;
  }

  try {
    const base = new URL(VALIDATION_ORIGIN);
    const parsed = new URL(destination, base);
    const decodedPath = decodeRepeatedly(parsed.pathname);

    if (
      parsed.origin !== base.origin ||
      parsed.username ||
      parsed.password ||
      !parsed.pathname.startsWith("/") ||
      parsed.pathname.startsWith("//") ||
      decodedPath === null ||
      decodedPath.startsWith("//") ||
      decodedPath.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(decodedPath) ||
      containsEncodedPathSeparator(parsed.pathname)
    ) {
      return FALLBACK_DESTINATION;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return FALLBACK_DESTINATION;
  }
}
