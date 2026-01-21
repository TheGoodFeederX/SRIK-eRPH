# Technology Stack

**Analysis Date:** 2025-02-13

## Languages

**Primary:**
- TypeScript (~5.9.3) - Used for all frontend application logic and components in `src/`.
- JavaScript (ES Modules) - Used for configuration files like `eslint.config.js` and utility scripts in `scripts/`.

**Secondary:**
- SQL (PostgreSQL) - Used for database schema, security policies, and business logic in `supabase/` migrations.

## Runtime

**Environment:**
- Node.js (Development/Build)
- Modern Web Browsers (Production)

**Package Manager:**
- pnpm (Inferred from `pnpm-lock.yaml`)
- Lockfile: `pnpm-lock.yaml` present.

## Frameworks

**Core:**
- React (19.2.0) - Frontend library for building the user interface.
- Vite (7.2.4) - Build tool and development server.

**Testing:**
- Not detected. No testing framework found in `package.json`.

**Build/Dev:**
- ESLint (9.39.1) - Linting.
- TypeScript (~5.9.3) - Static type checking.
- Vite (7.2.4) - Bundling and HMR.

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` (^2.89.0) - Official client for interacting with Supabase services (Auth, Database).
- `framer-motion` (^12.24.5) - Animation library for React.
- `lucide-react` (^0.562.0) - Icon library.

**Infrastructure:**
- `date-fns` (^4.1.0) - Date utility library.
- `xlsx` (^0.18.5) - SheetJS for Excel file processing.
- `html2pdf.js` (^0.13.0) - HTML to PDF conversion.
- `jspdf` (^4.0.0) - PDF generation.
- `html2canvas` (^1.4.1) - Screenshot/canvas capture for PDF generation.

## Configuration

**Environment:**
- Configured via `.env` files (not tracked) and `import.meta.env`.
- Key configs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

**Build:**
- `vite.config.ts`: Configures Vite, including React plugin and server settings.
- `tsconfig.json` & `tsconfig.app.json`: TypeScript configuration.

## Platform Requirements

**Development:**
- Node.js environment with `pnpm` or `npm`.
- Supabase project for backend services.

**Production:**
- Static site hosting (compatible with Vite output).
- Host mentioned in config: `erph.zulnajmi.my`.

---

*Stack analysis: 2025-02-13*
