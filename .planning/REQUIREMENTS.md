# Requirements - ERPH Digital

## Core Features (Functional Requirements)

### 1. DSKP-Based RPH Generation
- [ ] Users must be able to select Grade (Tahun), Subject (Subjek), Field (Bidang), Content Standard (SK), and Learning Standard (SP).
- [ ] The system must automatically populate description fields based on DSKP data.
- [ ] Support for SMART Objectives and Success Criteria inputs.
- [ ] Support for Multi-step Activities (Set Induksi, Langkah 1-3, Penutup).

### 2. Data Persistence (Supabase)
- [ ] CRUD operations for RPH records tied to the authenticated user.
- [ ] Hybrid schema: Fixed columns for metadata + JSONB for nested RPH content.
- [ ] Efficient list view with server-side pagination/filtering to avoid client-side bottlenecks.

### 3. Jawi Character Support
- [ ] Input fields must support Jawi character entry.
- [ ] UI must correctly render Jawi ligatures and shaping (RTL).
- [ ] Integration of `arabic-persian-reshaper` for correct character display in components.

### 4. PDF Export & Printing
- [ ] Clean, official RPH template matching Malaysian teacher standards.
- [ ] Jawi support in PDF output (requires embedded fonts like Amiri/Noto Sans Arabic).
- [ ] Client-side or server-side PDF generation (Puppeteer recommended for complex RTL).

## Non-Functional Requirements
- **UX**: Fast, intuitive interface optimized for busy teachers.
- **Performance**: Rapid DSKP lookup and efficient record loading.
- **Reliability**: All saves must be verified with error handling.

## Technical Constraints
- Must work within existing React + Supabase infrastructure.
- Jawi rendering depends on specific font availability.
