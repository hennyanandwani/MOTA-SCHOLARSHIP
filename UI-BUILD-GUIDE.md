# Shiksha Setu: UI Build Guide

SIH 2026, Problem Statement 26239: AI-Enabled Scholarship and Fellowship Management System for Scheduled Tribes (Ministry of Tribal Affairs).

This file holds everything needed to build the **UI layer only** with GitHub Copilot: setup steps, the permanent context file, and the prompts for Phase 0 (P0), stage by stage.

---

## How to use this file

1. Do the **Setup** below once.
2. Create the context file from **Part 1**.
3. Paste **Stage 1 to Stage 6** (Part 2) into Copilot **one at a time**, in order. Use a **new chat per stage**, in **Agent mode**.
4. After each stage, run the "Done when" check, then commit and push.
5. Send the review items in Part 3 to the project lead before continuing.

---

## Setup (once)

```bash
# Node 20+ and pnpm
node -v
npm i -g pnpm

# inside the empty cloned repo
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

Accept the defaults if it asks about extra options.

Then:

1. Create `.github/copilot-instructions.md` at the repo root and paste the block from Part 1.
2. Commit and push:

```bash
git add -A
git commit -m "chore: next.js scaffold and copilot instructions"
git push -u origin HEAD
```

3. Open VS Code on the **repo root** (not a subfolder). Open Copilot Chat and switch to **Agent mode**.

---

## Part 1: `.github/copilot-instructions.md`

Copy everything inside the block into the file.

```text
# SHIKSHA SETU: permanent project context (read on every request)

## What we are building
A national, one-window portal for scholarships and fellowships for Scheduled
Tribe students, run by the Ministry of Tribal Affairs (MoTA), Government of
India. Hackathon: SIH 2026, Problem Statement 26239 "AI-Enabled Scholarship and
Fellowship Management System for Scheduled Tribes". It must stand out among
500 teams (only 5 get selected).

## Scope: UI LAYER ONLY
No real backend, no real AI. All data comes from a typed mock layer (MSW in the
browser) so the demo runs fully offline. A real backend must be able to replace
the mocks later without changing components.

## Non-negotiables
- GOVERNMENT PORTAL, not a startup: no pricing, testimonials, SaaS hero
  sections, growth language. Tone: calm, official, respectful.
- SCHEME-AGNOSTIC: NFST and NOS are only examples. The platform runs ANY
  number of schemes (Pre-Matric, Post-Matric, Top Class, NFST, NOS, future
  ones) from a SchemeConfig object. NEVER hard-code scheme logic in components.
- AI only ASSISTS. It never makes a final decision. Every AI output shows
  reason, confidence, evidence, override-with-reason, and "reviewed by".
- Every action is auditable. Applications are frozen to the scheme version
  they were submitted under.
- No national emblem (placeholder slot only). No lorem ipsum.
- Numbers for seats, quotas and income caps are ILLUSTRATIVE mock data.

## Design principles
- VISUAL-FIRST, MINIMAL TEXT: icons, illustrations, numbers and colour before
  sentences. Labels <= 4 words, helper text <= 1 short sentence, details in
  tooltips/drawers.
- Status = icon + colour + shape, never colour alone.
- Every empty/error/success state has an illustration or animation.
- Large touch targets (>= 44px), icon-first navigation for low-literacy users.
- Official look: tricolour accent strip, navy primary, saffron accent, green
  success. Subtle Warli/Gond-inspired line-art motifs, dignified, never
  stereotypical.
- WCAG 2.1 AA, keyboard and screen-reader friendly, three themes (light, dark,
  high-contrast), text-size control.
- Low-bandwidth friendly: mobile-first, skeletons, lazy images, lite mode,
  offline drafts (PWA later).
- Multilingual: English and Hindi fully; other scheduled/tribal languages as
  labelled placeholders. All UI strings via i18n, none hard-coded.

## Tech stack
Next.js App Router + React + TypeScript (strict), Tailwind, shadcn/ui,
Framer Motion, lucide-react, lottie-react, TanStack Query + Table, Zustand,
react-hook-form + zod, next-intl, MSW (browser), faker, json-logic-js,
Recharts + ECharts, React Flow, dnd-kit, react-querybuilder, react-pdf,
qrcode.react, jsPDF, cmdk, Serwist. Install libraries only when their phase
needs them. Data fetching is client-side only (TanStack Query -> MSW).

## Architecture rules
- src/lib/api: typed client and hooks. MSW handlers implement the contract.
- src/lib/integrations: adapter interfaces + mocks (DigiLocker document
  source, AISHE/UDISE institution check, Aadhaar-masked identity, PFMS/DBT
  payments, notifications, translation). Components use adapters through a
  provider, never mocks directly. Aadhaar is always masked.
- src/lib/scheme: pure rule engine (json-logic) and form/document resolvers.
- src/lib/workflow: ONE typed state machine for the application lifecycle.
  All steppers, badges and actions read from it.
- All app-wide names/nav/colours come from src/config. Shared types live in
  src/types.

## Roles
student, guardian, institution_officer, state_officer, ministry_reviewer,
selection_committee, scheme_admin, finance_officer, leadership, auditor,
super_admin. Route guards are UI behaviour only and NOT security controls.

## Signature features (build in later phases)
DigiLocker one-tap document fetch with source badges; explainable eligibility;
document evidence viewer with OCR boxes; deficiency-to-resubmission loop;
green/amber/red triage lanes; Sankey bottleneck view; India map analytics;
no-code scheme builder with versioning; policy simulator; fraud/duplicate
graph; assisted (CSC) mode; guardian flow for minors; QR-verifiable letters;
voice input and read-aloud; demo mode with a guided Judge Tour.

## How to work
Build ONE stage at a time as instructed, then stop and summarise. Never start
the next stage on your own. After each stage, typecheck, lint, test and build
must pass. If something conflicts with these rules, say so instead of
improvising.
```

---

## Part 2: Phase 0 stage prompts

### Stage 1: Project setup, config, route stubs

```text
Read .github/copilot-instructions.md first. Do ONLY Stage 1 (project setup,
config, route stubs), then stop and summarise.
Next.js is already scaffolded and pnpm is set up, so skip the scaffolding step.

SETUP
- shadcn/ui init, then add: button, card, input, label, select, checkbox,
  switch, tabs, dialog, sheet, drawer, dropdown-menu, tooltip, badge, progress,
  skeleton, sonner, separator, scroll-area, popover, command.
- Install now: framer-motion, lucide-react, lottie-react, zustand,
  @tanstack/react-query, msw, @faker-js/faker, zod, react-hook-form,
  @hookform/resolvers, next-intl, next-themes, json-logic-js (+types),
  date-fns, vitest, @testing-library/react. Nothing else.
- Run `npx msw init public/`. Scripts: dev, build, start, lint, typecheck, test.
- Fonts via next/font: Noto Sans, Noto Sans Devanagari, Noto Sans Ol Chiki.
- Prettier + ESLint with import sorting.
- If Next.js + MSW + next-intl will conflict in a way that costs time, STOP and
  propose falling back to Vite + React Router. Architecture stays identical.

FOLDER STRUCTURE
src/
  app/ with route groups (public)(auth)(student)(admin), layout.tsx, globals.css
  components/ ui shared public student admin scheme-builder
  config/ site.ts nav.ts
  demo/  features/ (applications documents deficiencies eligibility schemes
  workflow audit)  hooks/  lib/ (api integrations scheme workflow
  accessibility utils)  messages/ (en.json hi.json)  mocks/ (browser.ts
  handlers/ seed/ db.ts)  stores/  types/
public/ images/ icons/ lottie/

ROUTES (every page renders <PageStub phase="P#"> for now)
(public): /, /schemes, /schemes/[schemeId], /track, /eligibility,
  /verify/[id], /notices, /grievance, /help, /transparency
(auth): /login, /register
(student): /portal, /portal/profile, /portal/schemes,
  /portal/schemes/[schemeId]/apply, /portal/applications/[applicationId],
  /portal/documents, /portal/documents/digilocker, /portal/alerts,
  /portal/payments, /portal/grievance, /portal/assisted, /portal/help
(admin): /admin, /admin/queue, /admin/applications/[applicationId],
  /admin/schemes, /admin/schemes/builder, /admin/schemes/[schemeId]/versions,
  /admin/selection, /admin/simulator, /admin/fraud, /admin/communications,
  /admin/post-selection, /admin/reports, /admin/audit, /admin/grievances,
  /admin/users, /admin/integrations
Also a dev-only /dev/design-system page (stub for now).
PageStub (minimal for now): centered icon, page title, "Coming in P#". No
blank pages, no 404s.

CONFIG (single source of truth)
config/site.ts: appName "Shiksha Setu", tagline, ministryName "Ministry of
Tribal Affairs", govLine "Government of India", helpline placeholder,
supportedLocales [{code, nativeName, ready}] (en, hi ready; other Indian and
tribal languages ready:false).
config/nav.ts: nav items per role (icon, labelKey, href, roles[]).
No app name or nav string may be hard-coded anywhere else.

FINISH: run typecheck, lint, build. Reply with the folder tree, how to run, and
any conflicts found.
```

**Done when:** `pnpm dev` runs, every route in the list opens a stub, and `pnpm build` passes.

### Stage 2: Design system and shared components

```text
Read .github/copilot-instructions.md first. Stage 1 is complete. Do ONLY
Stage 2 (design system), then stop. Keep dependencies as they are.

TOKENS AND THEMES
CSS variables in globals.css, mapped in the Tailwind theme. Three themes via
next-themes with data-theme: light | dark | contrast (high contrast).
Palette (verify every text/background pair >= 4.5:1 and UI components >= 3:1;
adjust any value that fails):
- primary navy 900 #0F1E4A / 700 #1E3A8A / 100 #E0E7FF
- accent saffron #FF9933 (dark text on it)
- success green #138808 (text variant #0B6B05)
- pending amber, deficient red, in-review blue, warm neutral greys
Type scale 12/14/16/18/20/24/30/36/48, body line-height 1.5. Radius 12px on
cards, soft shadows, 8px spacing grid, minimum touch target 44px.
Text-size control (A- / A / A+) scales the root font-size (14/16/18/20) and the
whole UI must scale without breaking.

STATUS SYSTEM (never colour alone)
StatusChip takes a status key and renders icon + colour + shape:
verified (check-circle, green, round), pending (clock, amber, round),
deficient (alert-triangle, red), in-review (eye, blue, square),
selected (award), rejected (x-circle), waitlisted (hourglass),
draft (pencil), on-hold (pause). All keys typed in one union.

MOTIF
Three reusable Warli/Gond-inspired line-art SVG pieces: <PatternDivider/>,
<PatternBackdrop/>, corner ornament. Subtle, low contrast, dignified, no
caricature.

MOTION
One file of Framer Motion presets (fade-up, stagger, scale-in). All disabled
under prefers-reduced-motion.

COMPONENTS (in components/shared)
StatusChip, KpiTile (animated counter + sparkline slot), EmptyState
(illustration or Lottie slot, plus title, one-line hint, optional action),
PageStub (upgrade it to use EmptyState + phase badge), PatternDivider,
AccessibilityToolbar (skip-to-content, A- A A+, contrast toggle, dark toggle,
language slot), LanguageSwitcher (shell only), Logo (emblem placeholder box +
wordmark from config), SchemeCard (icon, name, benefit chips, closing-date
chip, "Apply"), IconTile (large icon action tile), SectionHeader,
ConfidenceMeter (0-100 ring or bar with label), AIChip ("AI-assisted" with
Explain popover slot).
Create src/images.ts as the single image manifest, with SVG placeholders and
gradient art now (real photos will be added later).

DESIGN SYSTEM PAGE
/dev/design-system (dev-only) shows every token and every component, with a
theme switcher to compare light, dark and contrast.

FINISH: typecheck, lint, build. Reply with a short list of components and any
palette pairs you had to adjust for contrast.
```

**Done when:** `/dev/design-system` looks right in all three themes and A+ does not break the layout.

### Stage 3: Layout shells, session and roles, login, i18n

```text
Read .github/copilot-instructions.md first. Stages 1-2 are complete. Do ONLY
Stage 3, then stop.

LAYOUT SHELLS
PublicShell: thin tricolour strip; gov header (emblem placeholder box, ministry
name, appName, govLine); AccessibilityToolbar; main nav; footer (helpline
placeholder, policy links, "last updated", visitor counter mock). Sticky,
responsive, keyboard-friendly.
StudentShell: mobile = bottom tab bar with 5 large icons (Home, Schemes,
Applications, Documents, Alerts) plus a "More" sheet; desktop = left icon
sidebar. Header with language switcher, notifications bell, profile menu, and an
empty slot for an offline indicator.
AdminShell: collapsible sidebar grouped by function; top bar with scheme
switcher (All schemes / one scheme), global search + Ctrl+K command palette
(cmdk, navigates routes for now), notifications, role badge, breadcrumbs.
Navigation renders from config/nav.ts filtered by current role.

SESSION AND ROLES (UI behaviour only)
Zustand session store, persisted: currentUser, role, locale, theme prefs,
liteMode.
Roles: student, guardian, institution_officer, state_officer,
ministry_reviewer, selection_committee, scheme_admin, finance_officer,
leadership, auditor, super_admin. Define each role's home route.
RoleSwitcher: floating pill bottom-left, visible only when
NEXT_PUBLIC_DEMO=1 or ?demo=1. Switching updates nav and redirects to that
role's home.
RouteGuard: if the role lacks access, show an illustrated "Not available for
this role" screen with a button to switch role. Add a code comment that these
guards are UI behaviour and NOT security controls.

AUTH PAGES
/login and /register: mobile number + OTP mock flow (demo OTP 123456 shown in a
small demo hint), role picker for demo, large friendly inputs, icons, minimal
text. Full validation with react-hook-form + zod.

i18n
next-intl WITHOUT a [locale] route segment. Locale comes from the session
store, messages load client-side. src/messages/en.json and hi.json fully
translated for every string used so far. LanguageSwitcher lists English, Hindi,
and the other languages from config marked "coming soon". Keep strings short.
No hard-coded UI strings in components.

FINISH: typecheck, lint, build. Reply with what was built and any issues with
next-intl in a route-segment-free setup.
```

**Done when:** switching roles changes the nav, guards block the wrong routes, the Hindi toggle works, and login works with OTP `123456`.

### Stage 4: Types, rule engine, workflow state machine

```text
Read .github/copilot-instructions.md first. Stages 1-3 are complete. Do ONLY
Stage 4, then stop. No UI work in this stage, only pure TypeScript + tests.

TYPES (real files in src/types, with zod schemas where useful)
I18nText = { en: string; hi?: string; [lang: string]: string | undefined }
SchemeConfig {
  id, code, slug, category('pre-matric'|'post-matric'|'fellowship'|'overseas'|
  'top-class'|'other'), name:I18nText, tagline:I18nText, icon,
  status('draft'|'published'|'archived'),
  version{number, publishedAt, publishedBy, changeNote},
  applicantType('self'|'guardian-led'), window{opensAt, closesAt},
  benefits: BenefitDef[]{icon,label,amount?,unit?},
  seats?{total, quotas: QuotaDef[]},
  sections: FormSection[]{key,label,fields:FieldDef[]},
  documents: DocumentDef[]{key,label,mandatory,acceptedSources,preferredSource,
    validityMonths?,ocrFields:OcrFieldDef[],maxSizeMb,mimeTypes,showIf?:JsonLogic},
  rules: RuleDef[]{key,label,kind('eligibility'|'document'|'selection-gate'),
    logic:JsonLogic, severity('blocking'|'warning'), explainMet:I18nText,
    explainFail:I18nText, dataDeps:string[]},
  workflow{stages: StageDef[]{key,label,role,slaDays,order,
    kind('auto'|'human'|'committee')}, transitions: TransitionDef[]{from,to,
    allowedRoles,requiresReason}},
  selection{method('rank'|'threshold'|'manual'), criteria: CriterionDef[]
    {key,label,weight,source}, tieBreakers, quotas},
  communication{templates keyed by trigger},
  postSelection{tasks: TaskDef[], paymentSchedule}
}
FieldDef {key,label,type('text'|'number'|'date'|'select'|'multiselect'|
'boolean'|'phone'|'email'|'address'|'file'|'institution'|'course'|'tribe'),
required, showIf?, validation (serializable), prefillFrom?{source:
'digilocker'|'profile', path}, helper?, icon?}
Also: Application, ApplicationDocument (source digilocker|upload|registry),
AIFinding (advisory: type, reason, confidence, evidenceRefs, overrideReason,
reviewer), WorkflowStage, WorkflowTransition, Deficiency, AuditEvent
(who/what/when/why), User, Role, ApplicantProfile, Guardian, AssistedSession,
DigiLockerConsent, Notification, PaymentStatus, Sanction, Grievance,
TriageLane('green'|'amber'|'red'), FraudCluster, PolicySimulation, and typed
ApiResponse / Paginated envelopes.
Application separates stageKey (from scheme config) from status (draft |
in_progress | deficient | on_hold | selected | waitlisted | rejected |
withdrawn | closed) and stores schemeVersion frozen at submission.

RULE ENGINE (src/lib/scheme, pure functions, no React)
- evaluateRules(scheme, data) -> per rule {key, status 'met'|'failed'|'unsure',
  reason:I18nText, evidence}. Use json-logic-js. 'unsure' when required data is
  missing.
- resolveForm(scheme, data): visible sections/fields after showIf.
- resolveDocuments(scheme, data): required documents after showIf.
- computeMatchScore(scheme, profile): % plus met/failed/unsure counts.

WORKFLOW STATE MACHINE (src/lib/workflow, pure TS)
getStages(scheme), getAllowedTransitions(app, role, scheme),
applyTransition(app, to, actor, reason?) -> {app, auditEvent},
getSlaState(app, scheme) -> 'on_track'|'at_risk'|'breached'.
Enforce requiresReason. EVERY transition emits an AuditEvent.

TESTS (vitest)
Rule engine: met, failed, unsure, showIf, and a rule change producing a
different result. Workflow: allowed, forbidden role, missing reason,
deficiency loop (deficient -> resubmitted -> back to review), SLA states, and
an application staying on its frozen scheme version after the scheme changes.

FINISH: typecheck and test must pass. Reply with a summary of the types and
test results.
```

**Done when:** `pnpm test` is green. **Review checkpoint:** send the `src/types` files and the test output to the project lead before Stage 5.

### Stage 5: Adapters, MSW, seed data

```text
Read .github/copilot-instructions.md first. Stages 1-4 are complete. Do ONLY
Stage 5, then stop.

INTEGRATION ADAPTERS (src/lib/integrations)
Interfaces + mock implementations with configurable latency (300-1200ms) and
failure injection controlled by a demo-flags store (e.g. digilocker:
'ok'|'denied'|'timeout'|'unavailable'):
- DocumentSourceAdapter (DigiLocker): getConsentRequest(), link(consent),
  revoke(), listIssuedDocuments(), fetchDocument(id) -> {file, fields, issuer,
  fetchedAt, hash}
- InstitutionAdapter (AISHE/UDISE): verify(instituteCode) ->
  {registered, source, flags}
- IdentityAdapter: getMaskedIdentity(). It must NEVER return a full Aadhaar
  number, only masked.
- PaymentAdapter (PFMS/DBT): getPaymentStatus(sanctionId), getTimeline()
- NotifyAdapter: preview(channel 'sms'|'email'|'whatsapp', template, vars)
- TranslateAdapter: translate(text, toLocale), readAloud(text, locale)
Provide them through a React provider. No component may import a mock
directly.

MSW
- Browser worker with an init gate: the app renders only after the worker is
  ready and shows a branded loading screen meanwhile.
- Deterministic seed: faker.seed(26239). Persist DB state in IndexedDB so it
  survives reload. Provide reset() and ?reset=1.
- Latency and error toggles from the demo-flags store.
- Typed REST-style handlers: schemes CRUD + versions, applicants, applications
  (list/filter/paginate/detail/transition), documents, deficiencies, audit,
  notifications, payments, grievances, stats.
- TanStack Query provider and typed hooks in src/lib/api.

SEED DATA
- 6 schemes: Pre-Matric, Post-Matric, Top Class, NFST, NOS, and one blank
  template. All numbers illustrative (say so in a code comment).
- FULL detail for two schemes that must differ in fields, documents, rules,
  workflow and selection:
  1. NFST (fellowship): research fields, supervisor, merit scoring, 3 human
     stages, selection committee.
  2. Pre-Matric (guardian-led): school documents, institution-level
     verification first, no committee.
  The other four may be lighter but must validate against the schema.
- About 200 applicants/applications across all stages and schemes with these
  scenarios: perfect, deficiency loop, low-OCR-confidence, duplicate cluster,
  fake-institution flag, rejected, waitlisted, selected + disbursed, minor with
  guardian, assisted-mode application. Indian names, states, districts,
  institutions, amounts.

FINISH: typecheck, lint, test. Then reply with the FULL JSON of the NFST and
Pre-Matric SchemeConfig so it can be approved.
```

**Done when:** the app loads behind the MSW gate and a reload keeps the data. **Review checkpoint:** send the full NFST and Pre-Matric SchemeConfig JSON to the project lead before Stage 6.

### Stage 6: Landing page and quality gate

```text
Read .github/copilot-instructions.md first. Stages 1-5 are complete and the
SchemeConfig is approved. Do ONLY Stage 6, then stop. Do NOT start P1.

LANDING PAGE (public "/", uses the mock APIs, all strings via i18n)
1. Hero: illustrated scene (SVG/Lottie from images.ts), a one-line heading, and
   THREE big IconTiles: Apply, Track Application, Check Eligibility.
2. Live stats strip: 4 KpiTiles with animated counters from the mock stats
   endpoint (schemes live, applications, disbursed, avg. days to process).
3. Scheme grid: SchemeCards from the mock catalog, icon + benefit chips +
   closing-date chip, with category filter chips.
4. "How it works": 5-icon horizontal stepper (Register, Apply, Verify, Select,
   Receive), one short label each, animated on scroll.
5. Trust row: chips for DigiLocker, Aadhaar-secured, Verified colleges,
   Audit-traced (generic icons, no third-party logos).
6. Notices ticker (marquee, pausable) plus Help/Grievance shortcuts.
7. Footer from PublicShell.
Requirements: fully responsive, works in all three themes, keyboard navigable,
skeleton loaders, error and empty states, lite-mode friendly (no heavy visuals
when liteMode is on). Lighthouse accessibility >= 95.

QUALITY GATE
- pnpm typecheck, lint, test, build all pass.
- README section: setup, demo flags, MSW notes, how to swap MSW for a real API.
- A manual test checklist that can be ticked in 5 minutes.

FINISH: reply with (1) what P0 delivered, (2) final folder tree, (3) how to run,
(4) any deviations or skipped items.
```

**Done when:** the landing page looks like a real government portal in all three themes and Lighthouse accessibility is at least 95.

---

## Part 3: Working rules and checkpoints

- **One chat per stage**, in Agent mode. A single long chat drifts.
- **Green before moving on:** typecheck, lint, test and build must all pass before the next stage.
- **Commit and push after every stage:** `git add -A && git commit -m "stage N" && git push`.
- **If Copilot breaks something:** paste the error with "fix only this, don't touch anything else." Do not stack new prompts on a broken state.
- **If stuck after two attempts:** send the error to the project lead.

**Send to the project lead:**

| When | What |
| --- | --- |
| After Stage 4 | `src/types` files and the test output |
| After Stage 5 | Full NFST and Pre-Matric SchemeConfig JSON |
| Any time | Errors Copilot could not fix after two attempts |

---

## Part 4: What comes after P0

Prompts for these phases will be written after P0 is reviewed, so they match what was actually built.

| Phase | Scope |
| --- | --- |
| P1 | Public portal, student home, profile, scheme finder, eligibility |
| P2 | Dynamic application form engine, DigiLocker flow, document centre |
| P3 | Deficiency loop, tracker, alerts, post-selection, offline/PWA, voice |
| P4 | Admin dashboard (Sankey, India map), queue, triage lanes, workspace, evidence viewer |
| P5 | Scheme builder, rules, versioning, live new-scheme demo |
| P6 | Selection, fairness, policy simulator, communication, reports, audit log |
| P7 | Fraud graph, chatbot, i18n, accessibility, lite mode, demo mode, final README |

---

## Notes

- Seat counts, quotas and income caps in mock data are **illustrative**, not official figures.
- Do not use the national emblem unless the official usage guidelines are followed. The UI keeps a placeholder slot.
- Add real photos to `public/images` and update `src/images.ts` when available.
- Check that the name "Shiksha Setu" does not clash with an existing government portal before the final pitch. It lives in one constant, `src/config/site.ts`.