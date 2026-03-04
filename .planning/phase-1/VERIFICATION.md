# Phase 1 Plan Verification: Foundation & Data Integrity

## Status: ISSUES FOUND

**Plans checked:**
- 01-01-database-PLAN.md
- 01-02-ui-integration-PLAN.md
- 01-03-jawi-font-PLAN.md

**Issues:** 1 blocker(s), 2 warning(s), 1 info

---

### Blockers (must fix)

**1. [verification_derivation] Missing must_haves frontmatter**
- **Plan:** 01-01, 01-02, 01-03
- **Description:** All plans are missing the `must_haves` field in their frontmatter. This field is required to define observable truths, artifacts, and key links for verification.
- **Fix:** Add `must_haves` block to each plan frontmatter following the GSD standard (truths, artifacts, key_links).

---

### Warnings (should fix)

**1. [requirement_coverage] Requirement ID Mismatch**
- **Description:** Requirement IDs in plans (e.g., `FOUNDATION-SCHEMA`) do not match the IDs defined in `RESEARCH.md` (e.g., `REQ-02`). Furthermore, `ROADMAP.md` is missing an explicit `**Requirements:**` line for Phase 1.
- **Fix:** Synchronize requirement IDs across `ROADMAP.md`, `RESEARCH.md`, and all plans. Add `**Requirements:** [REQ-01, REQ-02, REQ-03, REQ-04]` to the Phase 1 section of `ROADMAP.md`.

**2. [key_links_planned] DSKP Data Seeding Missing**
- **Description:** `RESEARCH.md` recommends a "Wave 0" task to seed the DSKP table with full hierarchical data (SK -> SP -> SPI). This is not present in any plan. While Phase 2 focuses on auto-lookup, having the schema/data ready is part of "Stabilizing DSKP integration."
- **Fix:** Add a task to Plan 01-01 or a new Wave 1 plan to seed `referensi_rph` with complete DSKP data or at least the expanded schema.

---

### Info (suggestions)

**1. [nyquist_compliance] Feedback Latency**
- **Description:** Verification steps use `grep`. Consider adding a Wave 0 task for a simple smoke test (e.g., a Vitest unit test for the TypeScript interface) to provide faster, more reliable feedback than static grep.

---

## Detailed Evaluation

### Dimension 1: Requirement Coverage
| Requirement (from Research) | Plan(s) | Status |
|-----------------------------|---------|--------|
| REQ-01: DSKP-Based RPH Generation | 01-01 | Partial (Schema only) |
| REQ-02: Data Persistence | 01-01, 01-02 | Covered |
| REQ-03: Jawi Character Support | 01-03 | Covered |
| REQ-04: Robust Error Handling | 01-02 | Covered |

### Dimension 2: Task Completeness
- All tasks have `<name>`, `<files>`, `<action>`, `<verify>`, and `<done>`.
- Actions are specific and technical.

### Dimension 3: Dependency Correctness
- Graph is acyclic.
- Plan 01-02 (Wave 2) correctly depends on 01-01 (Wave 1).

### Dimension 4: Key Links Planned
- Schema changes in 01-01 are wired to UI changes in 01-02.
- Font installation in 01-03 is wired to `src/index.css` and applied to components.

### Dimension 5: Scope Sanity
- Each plan has 2-3 tasks.
- Estimated context usage is low (< 30%).

---

## Structured Issues (YAML)

```yaml
issues:
  - plan: "01-01"
    dimension: "verification_derivation"
    severity: "blocker"
    description: "Missing must_haves frontmatter field"
    fix_hint: "Add must_haves with truths, artifacts, and key_links"

  - plan: "01-02"
    dimension: "verification_derivation"
    severity: "blocker"
    description: "Missing must_haves frontmatter field"
    fix_hint: "Add must_haves with truths, artifacts, and key_links"

  - plan: "01-03"
    dimension: "verification_derivation"
    severity: "blocker"
    description: "Missing must_haves frontmatter field"
    fix_hint: "Add must_haves with truths, artifacts, and key_links"

  - plan: null
    dimension: "requirement_coverage"
    severity: "warning"
    description: "Requirement IDs mismatch between research and plans"
    fix_hint: "Align IDs (REQ-XX) and add **Requirements:** line to ROADMAP.md"
```