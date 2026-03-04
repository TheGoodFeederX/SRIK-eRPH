# Research Summary: eRPH Supabase Schema & Performance

**Domain:** Educational Record Management (eRPH)
**Researched:** 2025-05-18
**Overall confidence:** HIGH

## Executive Summary

The current eRPH implementation uses a basic, flat table structure in Supabase for storing teaching records (`rph_records`). While sufficient for MVP, it lacks the granularity required for modern educational standards (DSKP) and will face performance issues as user data grows. 

Research indicates that a **hybrid schema approach** is best for eRPH: using typed columns for core metadata (date, subject, class) to ensure fast filtering/sorting, while employing **JSONB** for nested, variable-length data like objectives and activities. This provides flexibility without sacrificing the integrity of the core relational data.

Key findings highlight the need to transition from client-side filtering to server-side search and the introduction of Standard Pembelajaran (SP) and Standard Prestasi (SPI) into the DSKP reference data to meet Malaysian educational requirements.

## Key Findings

**Stack:** Supabase (PostgreSQL) with a hybrid Typed + JSONB schema.
**Architecture:** Relational core for metadata, JSONB for nested objectives/activities, and normalized tables for DSKP reference data.
**Critical pitfall:** Client-side filtering in `RPHRecords.tsx` will become a performance bottleneck as record counts grow.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase: Schema Modernization** - Implement a hybrid schema to support structured objectives and activities.
   - Addresses: Nested data storage, structured inputs in `RPHForm.tsx`.
   - Avoids: Flat-text limitations for reporting.

2. **Phase: DSKP Granularity** - Expand reference data to include Standard Pembelajaran (SP) and Standard Prestasi (SPI).
   - Addresses: Compliancy with KSSR/KSSM standards.
   - Enables: Granular objective tracking.

3. **Phase: Performance Optimization** - Implement server-side search, pagination, and GIN indices.
   - Addresses: Scalability bottlenecks in `RPHRecords.tsx`.
   - Prevents: UI lag and large payload sizes.

**Phase ordering rationale:**
- Structural changes (Schema) should come first to avoid complex migrations later. DSKP granularity is a prerequisite for more advanced features like automated reporting. Performance optimization is critical before the user base scales.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Supabase/PostgreSQL is ideal for this hybrid approach. |
| Features | HIGH | DSKP (SK/SP/SPI) is the standard Malaysian curriculum structure. |
| Architecture | MEDIUM | JSONB vs Normalized trade-offs depend on specific reporting needs. |
| Pitfalls | HIGH | Client-side filtering is a known anti-pattern for growing datasets. |

## Gaps to Address

- Need to verify the specific JSON structure for Standard Prestasi (SPI) as it varies significantly between subjects.
- Investigate the specific requirements for "Impak/Refleksi" (e.g., number of students achieved vs. not) to ensure the schema supports quantitative reporting.
