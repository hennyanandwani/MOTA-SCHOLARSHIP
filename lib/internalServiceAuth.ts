import { createHash, timingSafeEqual } from "node:crypto";

export function isAuthorizedInternalBearer(
  authorization: string | null,
  expectedToken: string,
): boolean {
  const normalizedToken = expectedToken.trim();
  if (normalizedToken.length < 32 || !authorization) return false;
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  if (!match) return false;

  const expectedDigest = createHash("sha256").update(normalizedToken).digest();
  const providedDigest = createHash("sha256").update(match[1]).digest();
  return timingSafeEqual(expectedDigest, providedDigest);
}
