export function getInitialStudentAutoFillEnabled(
  configuration: { defaultAutoFillEnabled: boolean } | null | undefined,
): boolean {
  return configuration?.defaultAutoFillEnabled ?? false;
}
