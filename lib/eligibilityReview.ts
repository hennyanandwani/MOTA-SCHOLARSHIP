export const eligibilityProfileFields = [
  { key: "subCaste", label: "Sub-caste" },
  { key: "annualIncome", label: "Annual income" },
  { key: "academicPercentage", label: "Academic percentage" },
  { key: "courseName", label: "Course" },
  { key: "instituteName", label: "Institution" },
] as const;

export type EligibilityProfile = Partial<
  Record<(typeof eligibilityProfileFields)[number]["key"], unknown>
>;

export function assessEligibility(profile: EligibilityProfile) {
  const profileFields = eligibilityProfileFields.map(({ key, label }) => ({
    key,
    label,
    provided: profile[key] !== null &&
      profile[key] !== undefined &&
      String(profile[key]).trim().length > 0,
  }));

  return {
    status: "cannot_determine" as const,
    confirmedCriteria: [] as string[],
    missingProfileFields: profileFields
      .filter((field) => !field.provided)
      .map((field) => field.label),
    profileFields,
  };
}
