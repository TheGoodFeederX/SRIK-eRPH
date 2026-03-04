---
phase: 02-ux-performance
plan: 02
type: execute
wave: 2
depends_on: []
files_modified:
  - src/components/RPHForm.tsx
autonomous: false
requirements:
  - REQ-06
must_haves:
  truths:
    - "RPH creation/edit is divided into 4 clear steps"
    - "User can navigate between steps (Next/Back)"
    - "Current step and progress are visually indicated"
    - "Framer Motion is used for step transitions"
  artifacts:
    - path: "src/components/RPHForm.tsx"
      provides: "Refactored multi-step form wizard UI"
  key_links:
    - from: "src/components/RPHForm.tsx"
      to: "framer-motion"
      via: "import and motion components for transitions"
---

<objective>
Refactor the RPHForm component into a multi-step wizard to reduce cognitive load and improve the user experience of creating lesson plans.
</objective>

<execution_context>
@/home/dietpi/.gemini/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phase-2/RESEARCH.md
@src/components/RPHForm.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Setup wizard state and basic step structure</name>
  <files>src/components/RPHForm.tsx</files>
  <action>
    - Introduce `currentStep` state in `RPHForm.tsx` (1 to 4).
    - Define the 4 steps:
        1. Maklumat Asas (Basic Info)
        2. DSKP & Standard
        3. Kandungan PdPC (Content)
        4. Semakan (Review)
    - Create a wrapper component for steps using `AnimatePresence` and `motion.div`.
    - Implement `nextStep` and `prevStep` functions with validation for each step.
  </action>
  <verify>
    <automated>grep -q "currentStep" src/components/RPHForm.tsx && grep -q "AnimatePresence" src/components/RPHForm.tsx</automated>
  </verify>
  <done>Step-based navigation and basic wizard structure implemented.</done>
</task>

<task type="auto">
  <name>Task 2: Partition form fields into steps</name>
  <files>src/components/RPHForm.tsx</files>
  <action>
    - Group existing form fields into the 4 steps according to the research.
    - Implement a progress indicator (stepper) at the top of the form.
    - Ensure field validation is performed before moving to the next step.
    - Finalize the Review step with a concise summary of the entered data.
  </action>
  <verify>
    <automated>grep -q "Step 1" src/components/RPHForm.tsx || grep -q "case 1" src/components/RPHForm.tsx</automated>
  </verify>
  <done>Form fields are logically organized into 4 steps with a progress indicator.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Verify form wizard UX</name>
  <what-built>Multi-step wizard for RPH creation/editing.</what-built>
  <how-to-verify>
    1. Start creating a new RPH.
    2. Confirm that only basic info is requested in Step 1.
    3. Click 'Next' and verify the transition to the DSKP step.
    4. Fill out the DSKP and Content steps.
    5. In the Review step, verify that all information is summarized correctly.
    6. Click 'Back' to return to previous steps and ensure data is preserved.
    7. Complete the submission and confirm the record is saved.
  </how-to-verify>
  <resume-signal>approved</resume-signal>
</task>

</tasks>

<verification>
- Form is split into 4 steps.
- Framer Motion transitions are present.
- Navigation (Next/Back) works correctly.
- Final step allows for review and submission.
</verification>

<success_criteria>
- The form feels less overwhelming and more guided for the teacher.
- Errors are caught early at each step.
</success_criteria>

<output>
After completion, create `.planning/phases/02-ux-performance/02-02-SUMMARY.md`
</output>
