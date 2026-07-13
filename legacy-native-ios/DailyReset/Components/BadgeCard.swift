import SwiftUI

struct BadgeCard: View {
    let definition: BadgeDefinition
    let userBadge: UserBadge?
    let progressText: String?

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: definition.iconName)
                .font(.title2)
                .foregroundStyle(userBadge == nil ? .secondary : .white)
                .frame(width: 48, height: 48)
                .background(iconBackground, in: RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 4) {
                Text(definition.title)
                    .font(.headline)
                Text(definition.subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                Text(bottomText)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(userBadge == nil ? .secondary : definition.badgeLevel.color)
            }

            Spacer()

            Image(systemName: userBadge == nil ? "lock.fill" : "checkmark.seal.fill")
                .foregroundStyle(userBadge == nil ? .secondary : .green)
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(.quaternary, lineWidth: 1)
        }
    }

    private var iconBackground: some ShapeStyle {
        userBadge == nil ? AnyShapeStyle(.quaternary) : AnyShapeStyle(definition.badgeLevel.gradient)
    }

    private var bottomText: String {
        if let userBadge {
            return "Unlocked \(userBadge.unlockedAt.formatted(date: .abbreviated, time: .omitted))"
        }
        return progressText ?? definition.badgeLevel.displayName
    }
}
