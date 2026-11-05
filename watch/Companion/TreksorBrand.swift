import SwiftUI

// Shared watchOS presentation.
// Palette source: theme/architect.ts and design/architect.tokens.json.
enum TreksorBrand {
    private static func color(_ hex: UInt32) -> Color {
        Color(.sRGB, red: Double((hex >> 16) & 255) / 255,
              green: Double((hex >> 8) & 255) / 255, blue: Double(hex & 255) / 255, opacity: 1)
    }
    static let background = color(0x02050C)
    static let surface = color(0x111820)
    static let surfaceRaised = color(0x19222C)
    static let text = color(0xF5F4F1)
    static let secondary = color(0xC8C3BA)
    static let muted = color(0xA5AAAF)
    static let gold = color(0xD7B877)
    static let success = color(0xACD6C0)
    static let danger = color(0xE7A3A0)
}

struct TreksorWatchBrandHeader: View {
    var body: some View {
        HStack(spacing: 8) {
            Image("TreksorMark").resizable().scaledToFit().frame(width: 28, height: 28)
                .clipShape(RoundedRectangle(cornerRadius: 7)).accessibilityHidden(true)
            Text("TREKSOR").font(.system(.caption2, design: .default).weight(.semibold))
                .tracking(1.5).foregroundStyle(TreksorBrand.text)
        }
        .accessibilityElement(children: .combine)
    }
}

// Presentation only: the workout engine must supply actual phase and remaining seconds.
struct TreksorWatchRestCard: View {
    enum Phase { case resting, exercising }
    let phase: Phase
    let remainingSeconds: Int
    @Environment(\.isLuminanceReduced) private var isLuminanceReduced
    private var resting: Bool { phase == .resting }
    private var time: String {
        let seconds = max(0, remainingSeconds)
        return String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(resting ? "Rest" : "Exercise", systemImage: resting ? "timer" : "figure.strengthtraining.traditional")
                .font(.caption).foregroundStyle(TreksorBrand.secondary)
            Text(time).font(.system(.largeTitle, design: .rounded).weight(.medium)).monospacedDigit()
                .foregroundStyle(resting && !isLuminanceReduced ? TreksorBrand.gold : TreksorBrand.muted)
                .lineLimit(1)
            Text(resting ? "Time to recover" : "Rest timer paused")
                .font(.caption2).foregroundStyle(TreksorBrand.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading).padding(12)
        .background(TreksorBrand.surface, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(
            resting && !isLuminanceReduced ? TreksorBrand.gold.opacity(0.5) : TreksorBrand.muted.opacity(0.15)))
        .accessibilityElement(children: .combine)
    }
}
