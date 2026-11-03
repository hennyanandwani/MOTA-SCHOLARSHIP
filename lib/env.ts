export function requireEnvironmentVariable(
  name: string,
  value: string | undefined,
): string {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}.`);
  }

  return value;
}
