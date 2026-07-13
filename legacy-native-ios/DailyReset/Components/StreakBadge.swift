import SwiftUI

struct StreakBadge: View {
    let streak: Int

    var body: some View {
        Label("\(streak)", systemImage: "flame.fill")
            .font(.caption.weight(.semibold))
            .foregroundStyle(streak > 0 ? .orange : .secondary)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.thinMaterial, in: Capsule())
            .accessibilityLabel("Current streak \(streak) days")
    }
}
