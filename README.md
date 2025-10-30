## DeepRadar

DeepRadar is an AI-enabled industry monitoring system — think modern, enterprise-grade Google Alerts. It continuously scans sources, filters noise, synthesizes what matters, and delivers concise, shareable updates that keep the entire organization in the loop.

### What it does

- **Personalized signal detection**: Learns what matters (companies, topics, competitors, signals) to your specific role and industry.
- **Automated synthesis**: Generates radar reports with context, trends, and implications.
- **Org-wide loop**: Shares updates across teams via reports, dashboards, and links.

### Why this approach

- **Relevance over breadth**: Signals are scored and filtered to match your radar.
- **Sharing over silos**: Designed for org-wide distribution, not just individual alerts.

## Architecture Overview

### High level

- **Next.js App Router** for UI and API routes (serverless functions)
- **Firebase (Auth, Firestore, Functions)** for identity, data, and background jobs
- **LLM Orchestration** for generation and synthesis (via API routes and functions)

## Project Structure

```
/functions                # Firebase Cloud Functions (server-side tasks)
/public                   # Static assets
/scripts                  # Automation and utility scripts
/src
  /app                   # Next.js App Router pages and API routes
    /(root)              # User-facing routes (dashboard, radar, profile, etc.)
    /api                 # Serverless endpoints (radar runs, reports, integrations)
  /assets                # Sample data and fixtures
  /components            # UI components (radar canvas, report view, etc.)
  /config                # App-level config
  /contexts              # React contexts (Auth)
  /hooks                 # Custom hooks (API, Firestore, analytics)
  /lib                   # Core libraries (Firebase, prompts, services, logging)
```

### Key directories and roles

- `src/app/(root)`: UI routes
  - `radar/create`, `radar/[radarId]`: Create and view radars
  - `dashboard`, `profile`, `company-overview`, `examples`: Primary navigation pages
- `src/app/api`: Serverless APIs
  - `radars/*/run`: Execute a radar (v1, v2)
  - `radars/*/reports/latest`: Fetch latest synthesized report
  - `deepinfra`, `youcom`: Model/integration test endpoints
  - `extract-pdf`: Content extraction utility
- `src/components/radar`: Radar canvas and flow components
- `src/components/report`: Report rendering, share modal, and run button
- `src/lib`: Firebase clients, admin, prompts, and services
  - `prompts/radarGeneration.js`, `prompts/reportSynthesis.js`: Prompt templates
  - `services/youcom.js`: Integration with an external search/content provider
  - `firestore/schemas.js`: Firestore schema helpers
- `functions/`: Firebase Functions entrypoint for scheduled or heavy tasks

## Data & Persistence

- **Auth**: Firebase Auth manages users and sessions (`src/contexts/AuthContext.js`, `src/lib/firebaseClient.js`).
- **Data**: Firestore stores user profiles, radars, runs, and reports (`src/lib/firestore/*`).
- **Runs**: Radar runs are triggered via API endpoints and can be backed by Cloud Functions for scheduling.

## AI & Synthesis Flow

1. User defines a Radar (entities, queries, sources, goals).
2. System fetches and extracts candidate content (web/search/PDFs) via integrations.
3. Content is filtered and scored for relevance.
4. LLM synthesizes a concise report with key points, trends, and implications using prompts in `src/lib/prompts/`.
5. Results are saved to Firestore and rendered in the UI; users can share or refine.

## Notable Files

- `src/lib/prompts/radarGeneration.js`: Generates queries/scope from a radar definition.
- `src/lib/prompts/reportSynthesis.js`: Produces the readable, structured report.
- `src/components/radar/RadarCanvas.js`: Visual display of radar items/signals.
- `src/components/report/ReportView.js`: Renders synthesized reports.
- `src/app/api/radars/[radarId]/run/(v2)/route.js`: Newer radar execution flow.

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project (Firestore + Auth enabled)
- Environment variables configured (see below)

### Install
```bash
npm install
```

### Local development
```bash
npm run dev
```
This starts Next.js locally with App Router.

### Firebase Functions (optional)
```bash
cd functions
npm install
npm run build # if applicable
```

## Configuration

Create environment variables (e.g., `.env.local`) for:

- Firebase client keys
- Set up your YOU_DOT_COM and DEEP_INFRA_API environment variables

## License
Proprietary – internal use only unless otherwise specified.

Created for You.com Agentic AI Hackathon 