# Phase 3: Jawi & PDF Excellence - Plan

## Objective
Perfect the Jawi rendering and PDF export capabilities by integrating specialized text processing logic and a robust PDF engine.

## Success Criteria
- [ ] Jawi ligatures are rendered correctly in all exported PDFs.
- [ ] PDF quality is high (vector-based) and layouts match KSSR standards.
- [ ] Bulk export is fast and reliable.

## Plans

### Wave 1: Text Processing Logic
- **03-01-jawi-logic-PLAN.md**: Implement Jawi reshaping and Bidi logic.

### Wave 2: PDF Engine Migration
- **03-02-pdf-engine-PLAN.md**: Migrate to `pdfmake` and integrate `Noto Sans Arabic`.

### Wave 3: UI Integration & Templates
- **03-03-kssr-template-PLAN.md**: Finalize KSSR templates and implement bulk export in the UI.

## Constraints & Assumptions
- `pdfmake` is chosen for its superior RTL and tabular layout support.
- `Noto Sans Arabic` is the primary font for Jawi.
- Client-side generation is sufficient for current user volume.

## Verification
1. Run `pnpm build` to check for type errors and build issues.
2. Manually verify Jawi rendering in single and bulk PDF exports.
3. Compare exported layout against physical KSSR samples.
