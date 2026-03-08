

## Implementation Plan: Deliberation-Enhanced Discussion Platform

### File Structure

```text
src/
  data/
    mockData.ts              — All mock topics, posts, tensions, clusters, questions, guidance
  types/
    discussion.ts            — TypeScript types for all domain objects
  context/
    DiscussionContext.tsx     — Shared state: highlighted post IDs, active filter, scroll target
  pages/
    Index.tsx                — Home page (topic list with deliberation previews)
    Discussion.tsx           — Full discussion page (thread + sidebar)
  components/
    TopicCard.tsx            — Home page card with mini-deliberation stats
    discussion/
      TopicHeader.tsx        — Title, category, status, author
      ProposalPrompt.tsx     — The framing text/proposal
      ThreadView.tsx         — Post list with highlight/filter support
      PostCard.tsx           — Single post: author, text, reactions, reply toggle
      ReplyCard.tsx          — Nested reply (1 level)
      ComposerBox.tsx        — Context-aware contribution composer
    deliberation/
      DeliberationSidebar.tsx — Container for all sidebar sections
      DiscussionSummary.tsx
      TensionCard.tsx        — Single tension (clickable → highlights posts)
      TensionList.tsx
      ClusterList.tsx        — Grouped list with counts (no tag cloud)
      OpenQuestions.tsx       — Clickable items that scroll/highlight
      ContributionGuidance.tsx
```

### Interaction Model (DiscussionContext)

A React context holds:
- `highlightedPostIds: string[]` — posts currently highlighted (yellow/amber ring)
- `activeFilter: { type: 'tension'|'cluster'|'question', id: string } | null`
- `scrollToPostId: string | null`

Sidebar clicks update this context. `ThreadView` reads it to:
- Add a highlight ring to matching posts
- Optionally filter (dim non-matching posts rather than hide, preserving thread continuity)
- Scroll to a specific post via `useEffect` + `scrollIntoView`

### Page Layouts

**Home (`/`):**
- Header with platform name and tagline referencing deliberation
- Grid of `TopicCard`s — each shows title, excerpt, participant count, plus mini stats: number of tensions, open questions, top cluster. This signals the platform is deliberation-aware from the start.

**Discussion (`/discussion/:id`):**
- `TopicHeader` + `ProposalPrompt` span full width at top
- Below: two-column flex layout (lg:basis-2/3 thread, lg:basis-1/3 sidebar)
- On mobile: sidebar becomes a collapsible sheet/drawer toggled by a floating button
- Thread ends with `ComposerBox`

### Key Design Decisions

1. **Highlighting over filtering** — clicking a tension dims unrelated posts (opacity) and adds an amber ring to related ones, keeping thread readable. A clear "×" button resets.

2. **Cluster cards, not tag cloud** — each cluster is a compact card: theme name, short description, post count badge, clickable.

3. **Context-aware composer** — reads `ContributionGuidance` data and shows the most relevant hint above the textarea (e.g., "No one has discussed environmental impact yet — consider adding evidence"). Changes based on which guidance items exist.

4. **Home page signals deliberation** — topic cards include a small "Deliberation pulse" section showing 2-3 key stats so users immediately see this isn't a plain forum.

### Mock Data

One rich topic: **"Should the city implement a congestion pricing zone?"**
- 10 posts with varied perspectives (commuters, business owners, environmentalists, transit riders, disabled access advocates)
- 3 tensions (e.g., "Economic burden vs. Environmental benefit")
- 4 argument clusters with post mappings
- 3 open questions with post references
- 4 contribution guidance items
- 2-3 additional stub topics for the home page

### Styling

- Thread-dominant: main column visually heavier, sidebar uses muted/secondary background
- Highlighted posts: `ring-2 ring-amber-400 bg-amber-50/50` transition
- Sidebar sections use `Collapsible` from shadcn, all open by default
- Reactions as small pill buttons with counts
- Clean, forum-like typography — not dashboard-y

