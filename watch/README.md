# Treksor watch identity

Status: reusable design source, not a connected or installed watchOS app.

The repository currently has an iPhone HealthKit reader, not a watchOS application target. These SwiftUI components and the original app logo establish the same Architect identity for that future target. Add the Swift source and asset catalog to the actual watchOS target when it exists.

- Exact navy, ivory, champagne gold and status colors from `theme/architect.ts`.
- Original app logo, copied byte-for-byte; no substituted symbol.
- System type, SF Symbols and Dynamic Type. No emoji navigation.
- Rest card: gold while resting, muted during exercise and reduced-luminance mode. The workout engine supplies phase and time; the design does not fabricate, run or sync a workout.
- No health permissions, account pairing, WatchConnectivity or HealthKit sessions are implemented here.

Requires Xcode/watchOS compilation, device sizing/accessibility review and real workout-state integration before release. The Linux workspace cannot validate a native watch binary.
