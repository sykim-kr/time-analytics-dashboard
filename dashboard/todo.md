# todo.md

## Phase 0. Planning
- [ ] Read the workflow markdown carefully
- [ ] Inspect current repo structure
- [ ] Decide whether to use Next.js App Router or adapt existing app
- [ ] Confirm environment variable strategy

## Phase 1. Foundation
- [ ] Set up app shell
- [ ] Set up Tailwind styling
- [ ] Create header layout
- [ ] Create tab navigation
- [ ] Create shared loading / empty / error components

## Phase 2. Mixpanel connection flow
- [ ] Add `.env.example`
- [ ] Implement server-side Mixpanel auth helper
- [ ] Implement `POST /api/mixpanel/auth`
- [ ] Implement `GET /api/mixpanel/projects`
- [ ] Build `ConnectMixpanelButton`
- [ ] Build `ProjectSelector`
- [ ] Connect auth state to UI

## Phase 3. Shared data layer
- [ ] Create `lib/mixpanel/client.ts`
- [ ] Create `lib/mixpanel/query.ts`
- [ ] Create `lib/mixpanel/schemas.ts`
- [ ] Create shared response types
- [ ] Add query error normalization
- [ ] Add basic caching strategy

## Phase 4. Analysis routes with mock data
- [ ] Create calendar route
- [ ] Create timetox route
- [ ] Create retention route
- [ ] Create velocity route
- [ ] Create lifecycle route
- [ ] Create context route
- [ ] Return stable mock response shapes first

## Phase 5. Frontend tab rendering
- [ ] Build `AnalysisTabs`
- [ ] Build KPI card component
- [ ] Build reusable chart wrappers
- [ ] Connect each tab to its endpoint
- [ ] Load only the active tab eagerly
- [ ] Support project change refetching

## Phase 6. Real Mixpanel integration
- [ ] Implement schema discovery / event mapping
- [ ] Wire Calendar Time queries
- [ ] Wire Time-to-X queries
- [ ] Wire Retention queries
- [ ] Wire Velocity / Lag queries
- [ ] Wire Lifecycle derivation logic
- [ ] Wire External Context queries

## Phase 7. Edge cases
- [ ] Handle missing signup event
- [ ] Handle missing purchase event
- [ ] Handle missing session event
- [ ] Handle missing campaign/context properties
- [ ] Add user-friendly empty states
- [ ] Add rate-limit aware retry / backoff strategy

## Phase 8. Quality
- [ ] Review responsiveness
- [ ] Review security boundaries
- [ ] Review tab performance
- [ ] Add README setup instructions
- [ ] Update CLAUDE.md
- [ ] Mark completed items
- [ ] Add open issues and assumptions section

## Open Issues
- [ ] Confirm exact Mixpanel authentication method used in deployment
- [ ] Confirm region/domain handling
- [ ] Confirm default event mappings per project

## Assumptions
- Mixpanel credentials are available server-side as environment variables
- The project has at least some event data available
- Some analysis tabs may require fallback messaging if required events are absent
