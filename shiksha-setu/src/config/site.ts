// ─── Single source of truth for all app-wide config ───────────────────────────
// DO NOT hard-code these values anywhere else in the codebase.

export const siteConfig = {
  appName: 'Shiksha Setu',
  tagline: 'Scholarships for Every Dream',
  ministryName: 'Ministry of Tribal Affairs',
  govLine: 'Government of India',
  helplinePlaceholder: '1800-XXX-XXXX (Toll Free)',
  year: new Date().getFullYear(),

  supportedLocales: [
    { code: 'en', nativeName: 'English', ready: true },
    { code: 'hi', nativeName: 'हिन्दी', ready: true },
    { code: 'or', nativeName: 'ଓଡ଼ିଆ', ready: false },
    { code: 'bn', nativeName: 'বাংলা', ready: false },
    { code: 'te', nativeName: 'తెలుగు', ready: false },
    { code: 'ta', nativeName: 'தமிழ்', ready: false },
    { code: 'gu', nativeName: 'ગુજરાતી', ready: false },
    { code: 'sa', nativeName: 'संताली', ready: false },
  ] as const,

  // Colour token reference (actual values in globals.css)
  colours: {
    navyDark: '#0F1E4A',
    navyMid: '#1E3A8A',
    navyLight: '#E0E7FF',
    saffron: '#FF9933',
    saffronDark: '#CC7A29',
    successGreen: '#138808',
    successText: '#0B6B05',
    pendingAmber: '#D97706',
    deficientRed: '#DC2626',
    reviewBlue: '#2563EB',
  },

  // How long OTP is valid in demo (seconds)
  demoOtpCode: '123456',
  demoOtpHint: 'Demo OTP: 123456',
} as const;

export type SupportedLocaleCode = (typeof siteConfig.supportedLocales)[number]['code'];
