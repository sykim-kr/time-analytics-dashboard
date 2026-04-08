# CLAUDE.md

## Goal
Build a secure web app that connects to Mixpanel on the server side, loads available projects, and renders six analysis tabs based on the selected project:

1. Calendar Time
2. Event-relative Time (Time-to-X)
3. Cohort & Retention Curve
4. Velocity / Lag
5. Lifecycle Time
6. External Context

## Product Requirements
- The browser must never receive raw Mixpanel credentials.
- The flow must be:
  1. Connect Mixpanel
  2. Load project list
  3. Select project
  4. View tabbed analytics
- Every tab must support:
  - KPI summary
  - chart area
  - empty state
  - warning state
  - loading state

## Technical Requirements
- Use TypeScript
- Prefer Next.js App Router
- Use Tailwind CSS
- Use reusable chart components
- Use server-side API routes for all Mixpanel calls
- Keep implementation modular

## Workflow
1. Read the workflow document carefully.
2. Inspect the existing codebase before making changes.
3. Write a concrete implementation plan in `todo.md`.
4. Implement the app in small steps.
5. Start with mock data if needed, then wire real Mixpanel APIs.
6. Keep all secrets server-side.
7. Add graceful fallbacks when data or event mappings are missing.
8. Split logic into:
   - UI components
   - API routes
   - Mixpanel client helpers
   - analysis adapters
9. At the end, update `todo.md` with completed work, open issues, assumptions, and next steps.

## Code Style
- Keep functions small
- Prefer explicit types
- Validate inputs with zod where useful
- Avoid giant files
- Extract shared logic when repeated

## Analysis Guidance
- Calendar Time: hour-of-day, weekday, heatmap, month phase
- Time-to-X: event pair lag and funnel time-to-convert
- Cohort & Retention: D1/D7/D30 and retention curves
- Velocity / Lag: events per user, session interval, lag comparisons
- Lifecycle: derive lifecycle states from recency and repeat behavior
- External Context: before/after, campaign/non-campaign, payday/holiday comparisons

## Security Guidance
- Never expose service account username/secret in client bundles
- Never log secrets
- Use only server routes for Mixpanel API access
- Sanitize and validate request params

## Definition of Done
- User can click Connect Mixpanel
- User sees available projects
- User selects a project
- User can switch across all six tabs
- Each tab shows real or clearly marked mock data
- Empty/error states are handled
- README contains setup and run steps
