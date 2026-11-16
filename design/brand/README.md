# Treksor identity

The reference is TreksorAdmin `fix/architect-supabase-integration-2026` at
`0da58d8a59a1e21ee4df8573df88e3f8b05b0b34`.

- Main mark: `assets/images/appicon-treksor.png`, identical to dashboard
  `public/treksor-mark.png` (Git blob `a08f5879ea79fd5766369458fbde9910d0deaace`).
- Body: Lucide Dumbbell; Mind: Brain; Balance: Leaf; Purpose: Compass.
- Community: Users; Guide: Sparkles. The same shapes are used at every size.
- `icons.json` contains unmodified geometry from the dashboard's locked
  `lucide-react@0.468.0` package. License included. View box 24 × 24,
  stroke 2, rounded joins and caps. Color comes from the surrounding theme.
- Mobile uses `components/ui/BrandIcon.tsx`, with existing icons retained for
  controls outside the brand set. Use `brain` for Mind, not a book.
- Website icon definitions mirror the geometry. The hosted Site has its own
  source repository; apply focused changes there without replacing its newer
  application code with this repository's web snapshot.
- Watch logo and app icon already use the canonical file. Its existing screens
  do not have a four-pillar navigation; no new navigation is introduced.

Run `node tests/brand-identity.cjs` to check app/web geometry and logo parity.
Android launcher asset changes require a native build. A Metro reload is enough
for the in-app icons; no dependency installation is required.
