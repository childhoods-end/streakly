import SwiftUI

struct BadgeShareCard: View {
    let definition: BadgeDefinition
    let userBadge: UserBadge?
    let currentStreak: Int

    var body: some View {
        ZStack {
            definition.badgeLevel.gradient

            VStack(spacing: 22) {
                Text("Achievement Unlocked")
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.9))
                    .padding(.top, 28)

                ZStack {
                    Circle()
                        .fill(.white.opacity(0.24))
                        .frame(width: 132, height: 132)
                    Image(systemName: definition.iconName)
                        .font(.system(size: 58, weight: .bold))
                        .foregroundStyle(.white)
                }

                VStack(spacing: 8) {
                    Text(definition.title)
                        .font(.system(size: 32, weight: .bold))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.white)
                    Text(definition.subtitle)
                        .font(.body)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.white.opacity(0.86))
                }
                .padding(.horizontal, 26)

                HStack(spacing: 12) {
                    StatPill(title: "Level", value: definition.badgeLevel.displayName)
                    StatPill(title: "Streak", value: "\(currentStreak) days")
                }

                if let date = userBadge?.unlockedAt {
                    Text(date.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.white.opacity(0.8))
                }

                Spacer()

                VStack(spacing: 4) {
                    Text("Daily Reset")
                        .font(.headline.weight(.bold))
                    Text("Build your streak, one day at a time.")
                        .font(.caption)
                }
                .foregroundStyle(.white)
                .padding(.bottom, 26)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }
}

private struct StatPill: View {
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 3) {
            Text(title.uppercased())
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.white.opacity(0.72))
            Text(value)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white)
        }
        .frame(width: 112, height: 48)
        .background(.white.opacity(0.18), in: Capsule())
    }
}
