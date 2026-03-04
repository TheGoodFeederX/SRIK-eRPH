# Phase 2: UX & Performance Optimization - Plan

## Objective
Optimize the application for scalability and enhanced user experience through server-side pagination, a streamlined multi-step form, and advanced DSKP lookup.

## Success Criteria
- [ ] Large RPH datasets can be navigated and searched without performance issues.
- [ ] RPH creation is easier and more guided for the user.
- [ ] DSKP selection is accurate and hierarchically filtered.

## Plans

### Wave 1: Core Performance & Logic
- **02-01-pagination-PLAN.md**: Server-side pagination and search.
- **02-03-dskp-lookup-PLAN.md**: Hierarchical DSKP auto-lookup optimization.

### Wave 2: User Interface Refactoring
- **02-02-form-wizard-PLAN.md**: RPHForm refactoring into a 4-step wizard.

## Constraints & Assumptions
- Supabase `.range()` and `.ilike()` will be used for performance.
- Framer Motion will be used for all step transitions in the form.
- The existing JSONB schema remains stable.

## Verification
1. Run `pnpm build` to ensure no regressions or type errors.
2. Manually verify pagination and search functionality in the RPH record list.
3. Test the full multi-step form flow, including the DSKP hierarchical lookup.
