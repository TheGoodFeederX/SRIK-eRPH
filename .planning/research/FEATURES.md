# Feature Landscape: eRPH

**Domain:** Educational Record Management (eRPH)
**Researched:** 2025-05-18

## Table Stakes

Features required for basic eRPH compliance in Malaysian schools.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| DSKP Mapping (SK & SP) | Core requirement. Teachers must link lessons to Standard Kandungan & Pembelajaran. | Medium | Requires structured reference data and multi-select UI. |
| PDF Export | Teachers must submit physical/digital copies weekly. | High | Layout must be "Wysiwyg" or match official templates perfectly. |
| Duplicate/Clone Record | Lessons often repeat across classes. | Low | Critical for time-saving. |
| Weekly View | Teachers plan by week (Minggu 1-42). | Medium | Requires date manipulation and grouping. |

## Differentiators

Features that make this eRPH superior to manual Word/Excel templates.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-Reflection Stats | "25/30 murid menguasai" -> auto-calculates percentage. | Low | Simple math but high perceived value. |
| Smart Search | Find "Induction activities for Science Year 1" across all past records. | High | Uses full-text search on JSONB activities. |
| Bulk Print | Print/PDF all RPH for a specific week or month in one click. | High | Solves major pain point of end-of-month reporting. |
| Custom Activity Banks | Save favorite activities and drag-and-drop them into new RPH. | Medium | Personalization engine. |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Free-text "Standard Kandungan" | Prone to typos, impossible to analyze coverage. | Force selection from DSKP database, allow "Custom" only as fallback. |
| Client-side Filter for All Records | Crashes browser after ~500 records. | Server-side filtering with Supabase `.ilike()`. |

## Feature Dependencies

```
DSKP Database (SK/SP) -> Structured RPH Form -> Auto-Reflection Stats
```

## MVP Recommendation

Prioritize:
1. **DSKP Reference Data**: Populate `referensi_rph` with accurate SK and SP data.
2. **Structured Form**: Update `RPHForm` to save SK/SP IDs, not just text.
3. **PDF Export**: Ensure the print layout works for the new data structure.

Defer: **Social Sharing** (sharing RPH between teachers) - high complexity, data privacy issues.

## Sources

- [KPM DSKP Documents](https://bpk.moe.gov.my/)
- [Supabase Filters](https://supabase.com/docs/reference/javascript/filter)
