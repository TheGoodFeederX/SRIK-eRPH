---
phase: 05-ui-overhaul
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/index.css
  - src/components/RPHForm.tsx
  - src/components/DSKPManager.tsx
  - src/components/RPHRecords.tsx
  - src/components/LoginPage.tsx
  - src/components/PDFReadyModal.tsx
autonomous: true
requirements: [UI-01, UI-04]

must_haves:
  truths:
    - "Glassmorphism 2.0 CSS variables (--glass-*) are defined in :root"
    - "The .glass-modern utility class implements backdrop-filter with blur and saturate"
    - "Accessibility media queries for transparency and motion are present in src/index.css"
    - "RTL mirroring utility (.rtl-mirror) correctly flips elements in [dir='rtl']"
    - "Major UI containers use .glass-modern instead of legacy styling"
  artifacts:
    - path: "src/index.css"
      provides: "Liquid Glass theme engine and RTL utilities"
  key_links:
    - from: "src/index.css"
      to: "Browser Rendering Engine"
      via: "backdrop-filter"
      pattern: "backdrop-filter: blur\\("
---

<objective>
Refactor the theme engine to implement "Glassmorphism 2.0" (Liquid Glass) aesthetic and ensure full RTL/accessibility support.

Purpose: Modernize the design with a premium, performant aesthetic while ensuring inclusivity and Jawi parity.
Output: Enhanced CSS variables, modern glass utility classes, and system-aware accessibility fallbacks.
</objective>

<execution_context>
@/home/dietpi/.gemini/get-shit-done/workflows/execute-plan.md
@/home/dietpi/.gemini/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-5/05-CONTEXT.md
@.planning/phase-5/05-RESEARCH.md
@src/index.css

<interfaces>
<!-- Key CSS Variables and Utilities to be established -->
:root {
  --glass-bg: rgba(255, 255, 255, 0.15);
  --glass-blur: 16px;
  --glass-saturate: 180%;
  --glass-border: rgba(255, 255, 255, 0.2);
  --shadow-glass: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.15);
}

.glass-modern {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}

[dir="rtl"] .rtl-mirror {
  transform: scaleX(-1);
}
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Core Theme Engine Refactor</name>
  <files>src/index.css</files>
  <action>
    Update `src/index.css` to define the "Liquid Glass" variables and utilities (per D-01).
    1. Update `:root` with `--glass-bg`, `--glass-blur`, `--glass-saturate`, `--glass-border`, and `--shadow-glass`.
    2. Implement `.glass-modern` utility with `backdrop-filter`, `background`, `border`, and `box-shadow`.
    3. Add accessibility fallbacks using `@media (prefers-reduced-transparency: reduce)` (opaque background) and `@media (prefers-reduced-motion: reduce)` (disable transitions).
    4. Implement `.rtl-mirror` utility for directional icons using `[dir="rtl"] .rtl-mirror { transform: scaleX(-1); }`.
  </action>
  <verify>
    grep -E "--glass-bg|\.glass-modern|prefers-reduced-transparency|rtl-mirror" src/index.css
  </verify>
  <done>Core CSS variables and utility classes are implemented and accessible.</done>
</task>

<task type="auto">
  <name>Task 2: Component Migration to Glassmorphism 2.0</name>
  <files>src/components/RPHForm.tsx, src/components/DSKPManager.tsx, src/components/RPHRecords.tsx, src/components/LoginPage.tsx, src/components/PDFReadyModal.tsx</files>
  <action>
    Migrate existing components to use the new `.glass-modern` utility and remove redundant legacy styling.
    1. Replace instances of `.glass-card` or custom glass-like inline styles with `.glass-modern`.
    2. Ensure containers in `RPHForm`, `RPHRecords`, and `LoginPage` leverage the new theme.
    3. Remove any hardcoded `backgroundColor` or `backdropFilter` that conflicts with the theme variables.
  </action>
  <verify>
    grep -r "glass-modern" src/components/
  </verify>
  <done>Major UI components are migrated to the new theme engine.</done>
</task>

<task type="auto">
  <name>Task 3: RTL Mirroring Implementation</name>
  <files>src/components/RPHForm.tsx, src/components/RPHRecords.tsx</files>
  <action>
    Apply the `.rtl-mirror` utility to directional icons in navigation and pagination elements.
    1. Identify icons that imply direction (e.g., `ChevronLeft`, `ChevronRight`, `ArrowLeft`) in `RPHForm` wizard and `RPHRecords` pagination.
    2. Add the `rtl-mirror` class to these elements to ensure they point the correct way in Jawi (RTL) mode.
  </action>
  <verify>
    grep -r "rtl-mirror" src/components/
  </verify>
  <done>Directional icons correctly mirror in RTL/Jawi layouts.</done>
</task>

</tasks>

<verification>
- Check `src/index.css` for new variables and classes.
- Verify `rtl-mirror` exists and mirrors correctly.
- Verify components use `glass-modern`.
</verification>

<success_criteria>
- "Liquid Glass" aesthetic is consistently applied across the app.
- Accessibility preferences (transparency, motion) are respected.
- RTL layout support is parity-complete for directional navigation.
</success_criteria>

<output>
After completion, create `.planning/phase-5/05-01-SUMMARY.md`
</output>
