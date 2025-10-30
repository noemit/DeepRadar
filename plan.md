DeepRadar — Project Plan (Markdown)

Personalized, daily industry scans that adapt to the user’s role, domain, and evolving interests.

1) Summary

DeepRadar lets users define a personalized “radar” of topics, sources, and signals. The app turns that profile into daily search queries, runs them via the You.com API on demand (client-triggered), synthesizes findings with an LLM, and renders a clean, shareable report. Users refine their radar via a chat loop that regenerates a Mermaid diagram and the underlying search plan.

Stack: React + Next.js (App Router), Node/Edge routes, Firebase Auth + Firestore/Storage, You.com Search API, DeepInfra LLM APIs.
Persistence: We cache user radars and generated reports in Firestore so reloads don’t always re-fetch.

2) Goals & Non-Goals

Goals (v1)

Capture a user’s role, industry, audience, geography, and topic focus.

Generate a query plan (search queries + permutations).

On client action, call You.com to fetch results and synthesize a daily report.

Show and edit a Mermaid “radar” diagram driven by the user’s profile.

Provide a chat refinement loop that updates the radar and query plan.

Create shareable snippets in the user’s voice (DeepInfra LLM).

Store radars, query plans, execution logs, and reports in Firestore.

Non-Goals (v1)

Scheduled/background crawlers or cron jobs.

Multi-tenant admin dashboards.

Complex deduping/resolve across paywalled sources.

Full recommendation learning loop (we’ll just log clicks to inform future models).

3) Primary User Story (Example)

A U.S. high school ed-tech product manager who cares about interactive content, accessibility, and emerging web tech wants daily scans of interactive HS content, U.S. ed-tech company news, and relevant policy that impacts interactive learning.

4) User Flows
4.1 Landing

CTA: “Create your DeepRadar” or “Explore Examples”

Examples: prebuilt radars the user can fork.

4.2 Create Radar

Form collects: role, industry, product type, audience, geography, topics to prioritize and avoid.

On submit, LLM generates:

Mermaid radar diagram

Query plan (base queries, permutations, source hints)

4.3 Edit via Chat

User: “Drop policy, add web gaming and accessibility.”

System: LLM updates Mermaid + query plan, returns diff and new plan.

UI: live-update Mermaid diagram; show plan preview chips.

4.4 Deploy & Generate Report

User hits Deploy.

Client triggers server route: runs You.com searches for the plan.

Results → LLM synthesis (DeepInfra) → Report with sections, links, short summaries.

Save report in Firestore; render instantly.

4.5 Share

For any item: “Share” → LLM creates a short blip in user voice.

Copy to clipboard or Slack share (web-intent) and log the share action.

5) Architecture
5.1 High-Level Diagram (Mermaid)
flowchart LR
  U[User] --> W[Next.js UI]
  W -->|Auth| FB[(Firebase Auth)]
  W --> API[/Next.js API routes/]
  API --> YU[You.com Search API]
  API --> DI[DeepInfra LLMs]
  API --> FS[(Firestore)]
  W --> FS

5.2 Execution Model

Client-triggered: no cron/scheduler required in v1.

Caching: latest report stored per radar; re-use unless user requests “fresh run.”

6) Data Model (Firestore)
/users/{userId}
  displayName
  email
  voiceProfile: { toneHints: string[], samplePhrases: string[] }

/radars/{radarId}
  ownerId
  title
  createdAt, updatedAt
  profile: {
    role, industry, productFocus, audience, geography,
    priorities: string[], avoid: string[]
  }
  mermaidDiagram: string
  queryPlan: {
    queries: string[], permutations: string[],
    sourcesHint: string[], lastLLMPrompt: string
  }
  settings: { defaultFreshRun: boolean, maxResultsPerQuery: number }

/radars/{radarId}/reports/{reportId}
  createdAt
  freshnessWindow: { fromISO, toISO }
  inputs: { queryPlanHash, apiVersion }
  sections: [
    { title, items: [{ headline, url, source, snippet, tags: string[] }] }
  ]
  summary: string
  metrics: { totalSources: number, uniqueDomains: number }

/interactions/{interactionId}
  userId, radarId, type: "share"|"click"|"edit"
  payload
  createdAt

7) Query Plan Spec
{
  "version": "1.0",
  "role": "Product Manager",
  "industry": "EdTech",
  "audience": "US high school",
  "focus": ["interactive content", "accessibility", "web gaming", "JS libraries"],
  "avoid": ["policy", "textbook content"],
  "geography": ["United States"],
  "queries": [
    "interactive 'high school' edtech",
    "accessibility 'interactive' classroom tools",
    "web gaming 'education' high school",
    "javascript library 'interactive learning' demo"
  ],
  "permutations": [
    "site:medium.com OR site:dev.to OR site:hackernoon.com",
    "\"case study\" OR \"pilot\" OR \"rollout\"",
    "2024..2025"
  ],
  "sourcesHint": ["company blogs", "GitHub releases", "teacher forums"]
}

The server combines queries × permutations, dedupes, caps per-query results, and tags findings.

8) Mermaid “Radar” Diagram

Mermaid doesn’t have a native radar chart, so we’ll simulate rings and sectors with subgraphs and styling, optionally overlaying a CSS animated sweep.

8.1 Example Mermaid (simulated rings)
flowchart TB
  subgraph Core["Core Focus (Ring 1)"]
    A[Interactive HS Content]
    B[Accessibility]
  end

  subgraph Near["Adjacent (Ring 2)"]
    C[Web Gaming]
    D[JS Libraries]
  end

  subgraph Watch["Watchlist (Ring 3)"]
    E[US EdTech Company News]
    F[Policy (Muted)]
  end

  classDef muted opacity:0.35,stroke-dasharray: 4 2;
  class F muted;

Animation: place a CSS canvas/SVG sweep beneath the Mermaid container to mimic a rotating radar line.

9) Key API Contracts
9.1 Create/Update Radar

POST /api/radars

body: { profile, voiceProfile? }

server: calls DeepInfra to produce mermaidDiagram + queryPlan

returns { radarId, mermaidDiagram, queryPlan }

PATCH /api/radars/{radarId}

update profile; regenerate diagram/plan via DeepInfra.

9.2 Generate Report (Client-Triggered)

POST /api/radars/{radarId}/run

loads latest queryPlan, hits You.com for each query/permutation.

synthesizes via DeepInfra: returns a structured report JSON.

persists and returns { reportId, report }.

9.3 Share Snippet

POST /api/share

body: { reportId, itemIndex }

server: DeepInfra style prompt using user’s voiceProfile.

returns { text } and logs /interactions.

10) Prompting (LLM)
10.1 Mermaid + Plan Generation

System Prompt (sketch):

“You are a research planner. Given a user profile, output:

a Mermaid flowchart simulating a 3-ring radar,

a query plan JSON with focused queries, permutations, and sourcesHint.
Keep output strictly in two code blocks: mermaid then json.”

User Input (example):

Role, industry, geography, focus, avoid.

10.2 Synthesis to Report

Summarize top items into sections (e.g., Interactive Tech, Accessibility, Company Moves).

For each item: 1-2 sentence summary + tags.

Include a top-line “Why this matters.”

10.3 Share Snippet (User Voice)

Use voiceProfile hints to produce a 140–220 char blip with 1 link, no hashtags unless specified.

11) Report Format (Rendered)

# DeepRadar — Oct 29, 2025

## TL;DR

- Interactive HS tools are trending toward lightweight JS + accessibility-first patterns.

## Interactive Tech

- **New library:** HyperCanvas v0.9 adds WCAG-friendly focus states. [hypercanvas.dev]
- **Case study:** Cedar HS piloted map-based lab with live annotations…

## Accessibility

- **Guide:** “Keyboard-only interactivity for labs” (Dev.to) — practical patterns…

## Company Moves

- **Launch:** AcmeEd’s “Interact Lab 2.0” adds WebGL overlays…

---
*Generated from your profile: US HS ed-tech, interactive content, accessibility, web gaming; policy deprioritized.*

12) UI Components

RadarCanvas: Mermaid container + CSS radar sweep.

ProfileForm: capture role/industry/audience/geography/topics.

ChatRefine: chat UI → calls /api/radars/:id to regenerate.

PlanPreview: shows queries/permutations as chips, expandable JSON.

RunReportButton + ReportView.

ShareBlipModal with voice options and copy button.

ExamplesGallery with fork UI.

13) State & Caching

Keep radar, plan, and last report in React Query/Store.

When Run: show optimistic spinner; if report < N hours old, prompt “Use cached or Refresh?” per user setting.

Save all generated artifacts to Firestore for auditability.

14) Error Handling

You.com quota/rate-limit → degrade: fewer queries, mark sections as partial.

LLM fail → retry with shorter context; fallback template (raw links).

Mermaid validation → if broken, show last good diagram + diff.

15) Security & Privacy

Firebase Auth (Email/Google).

Store API keys server-side only; client calls our API routes.

Per-user Firestore rules on /radars and /reports.

PII minimization; allow Export/Delete My Data.

16) Analytics (v1 lightweight)

Log: run duration, #queries, #unique domains, CTR on items, shares.

Simple dashboard page per user: runs/week, fav sections, domains.

17) Accessibility & Perf

WCAG AA: keyboard navigation, focus states, ARIA for Mermaid container.

Streaming LLM synthesis where possible; progressive render of sections.

Batch and parallelize search calls; cap items per section.

18) Example Example-Radar (Starter Templates)

Ed-Tech HS Interactive (US)

Healthcare GenAI Compliance Updates (EU)

Retail eCom Merchandising Experiments (NA)

Climate Tech Funding & Pilots (Global)

Each template ships with a ready Mermaid + plan for instant demo.

19) Acceptance Criteria (v1)

Create, edit via chat, and save a radar with valid Mermaid and a non-empty query plan.

“Run” produces a report with ≥3 sections and ≥8 unique items in <30s on typical network.

Share blip generates in <3s and copies cleanly.

Refresh logic offers cached vs fresh choice.

Firestore shows persisted radar, plan, report, and share interaction.

20) Milestones & Timeline

M1: Skeleton (UI + Auth + Firestore)

M2: LLM Plan/Diagram Generation

M3: You.com Integration + Synthesis

M4: Share Snippets + Voice Profile

M5: Examples Gallery + Polish (perf, a11y)

M6: Beta Feedback + Iteration

21) Open Assumptions

You.com API permits the required query volume with client-triggered cadence.

Mermaid’s flowchart + CSS overlay is acceptable for v1 “radar” look.

DeepInfra models available with prompt+JSON guarantees we need.

22) Stretch (Post-v1)

Scheduled daily runs + notifications.

Source whitelists/blacklists per user.

Multi-radar dashboards and team sharing.

Learning loop: boost topics/domains with high CTR/share rates.

Inline “explain this” expansions inside reports.

23) Sample Tickets (Ready to Copy)

FE: Implement RadarCanvas with Mermaid mount/unmount + CSS sweep.

FE: Build ProfileForm and write validators.

BE: /api/radars route to call DeepInfra → Mermaid + plan.

BE: /api/radars/:id/run to assemble queries, call You.com, synthesize.

BE: /api/share to generate voice-style blips; log /interactions.

FE: ReportView with sections, link tracking, “Share” modal.

Infra: Firestore rules for per-user doc access.

QA: Mermaid break test: malformed nodes; ensure graceful fallback.

24) Example Chat Refinement Prompt (to LLM)
System: You update a user's DeepRadar. Return two blocks only:
1) ```mermaid``` updated diagram
2) ```json``` updated queryPlan object

User profile:

- Role: Product Manager
- Industry: EdTech
- Audience: US high school
- Focus: interactive content, accessibility, web gaming, JS libraries
- Avoid: policy, textbook content

User says:
"Move away from policy, emphasize tech interactivity & web gaming. Keep accessibility."

If you want, I can turn this into a GitHub-ready README.md plus scaffold a /docs/ folder with API and prompt specs.
