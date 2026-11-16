# Mobile trial: fixed route, navy and daily walks

- A single `AppFrame` sits outside the root navigator's screen content. It keeps
  the current route and 44-point Back, Home and pillar controls visible while
  screen content scrolls. Outside a pillar the third control opens the pillar
  chooser. Auth screens and native modal dialogs retain their own presentation.
- `BodyPageHeading` and the shared `Header` keep their titles while avoiding
  repeated navigation controls when the fixed frame is present. Insets consumed
  by the frame are not added again by descendants using the safe-area hook.
- The mobile palette trial is defined in `theme/architect.ts`: navy background
  `#0B1930`, surface `#132640`, raised surface `#1B3352`. Gold and typography are
  retained. Existing dark surfaces/gradients now use shared tokens; status and
  media colors are not recolored. This trial does not change website colors.
- Body has Daily walks, a manual completed-walk record with optional duration.
  Progress shows today's count, last-seven-day count and actual active-day
  evidence. Walks never increase gym session counts or invent step counts.
- Storage is account-scoped on this device, serialized, retry-safe and retained
  across app restarts. It is explicitly labeled local/manual in the UI. No new
  native modules, motion permissions, backend tables or website sync are added.

Validation: full release checks; `tests/fixed-route.cjs`, `tests/walks.cjs`, and
`tests/brand-identity.cjs`. Physical iPhone scrolling and safe-area behavior still
need confirmation in Treksor Dev. The guarded Windows updater adapts the user's
existing checkout, preserves unrelated changes, compares TypeScript diagnostics
before writing and creates a sibling backup with a file manifest.
