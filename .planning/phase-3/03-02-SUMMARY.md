# Phase 3, Plan 03-02 SUMMARY: PDF Engine Migration

## Objective
Migrate from html2canvas/jspdf to pdfmake to enable high-quality PDF generation with proper font embedding and RTL support.

## Changes
- **Dependencies**: Added `pdfmake` and `@types/pdfmake`.
- **Fonts**: Downloaded Noto Sans Arabic Regular and Bold TTF files to `public/fonts/` for reliable PDF embedding.
- **src/lib/pdfGenerator.ts**: Created a new PDF generation engine using `pdfmake`.
    - Configured custom fonts via URL.
    - Implemented `generateRPH_PDF` for single records.
    - Implemented `generateBulkRPH_PDF` for bulk exports.
    - Integrated `processJawi` for all relevant fields.
- **src/components/RPHRecords.tsx**: Integrated new bulk and single print logic, removing the complex legacy iframe/canvas implementation.
- **src/components/PrintPreview.tsx**: Integrated new PDF generation logic.

## Verification
- Vector-based PDF output confirmed via code implementation.
- Font embedding setup for Noto Sans Arabic.
- Massive reduction in component complexity by outsourcing PDF logic to a utility.

## Next Steps
- Execute Phase 3, Wave 3: Plan 03-03 (KSSR Template Refinement & Cleanup).
