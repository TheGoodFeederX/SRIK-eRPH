# Technology Stack

**Project:** eRPH (Malaysian e-Records for Teachers)
**Researched:** 2025-05-18

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18+ | UI Framework | Current project base; component-driven for modular eRPH forms. |
| Supabase | Latest | Backend-as-a-Service | Provides PostgreSQL, Auth, and Storage with minimal infra overhead. |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 15+ | Relational DB | Supabase's core. Native JSONB support is critical for nested RPH data. |
| pg_trgm / FTS | N/A | Search | Efficient server-side text search for large record lists. |

### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Edge | N/A | Serverless Logic | (Future) for complex PDF generation if client-side JS becomes slow. |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| html2pdf.js / jsPDF | Latest | PDF Export | Essential for generating official eRPH printouts for submission. |
| Lucide React | Latest | Icons | Standard, lightweight icon set. |
| XLSX | Latest | Excel Export | For bulk data export and teacher reporting. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Schema | Hybrid (Typed + JSONB) | Fully Normalized | Normalizing every single activity step/objective creates excessive joins for simple RPH views. |
| Schema | Hybrid (Typed + JSONB) | Fully JSONB | Fully JSONB loses PostgreSQL's powerful relational features for filtering core metadata. |
| PDF Gen | Client-side (jsPDF) | Server-side (Puppeteer) | Client-side is faster for single records; only use server-side if bulk generation is frequent. |

## Installation

```bash
# Current project uses pnpm
pnpm install lucide-react html2pdf.js jspdf xlsx
```

## Sources

- [PostgreSQL JSONB vs Relational Benchmarks](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase Performance Best Practices](https://supabase.com/docs/guides/database/performance)
