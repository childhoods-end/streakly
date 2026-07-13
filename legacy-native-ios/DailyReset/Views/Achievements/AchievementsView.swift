import SwiftData
import SwiftUI

struct AchievementsView: View {
    @Query(sort: \BadgeDefinition.code) private var badgeDefinitions: [BadgeDefinition]
    @Query(sort: \UserBadge.unlockedAt, order: .reverse) private var userBadges: [UserBadge]
    @Query(sort: \Habit.createdAt) private var habits: [Habit]
    @Query(sort: \CheckIn.createdAt, order: .reverse) private var checkIns: [CheckIn]

    private var unlockedDefinitions: [BadgeDefinition] {
        badgeDefinitions.filter { badge(for: $0) != nil }
    }

    private var lockedDefinitions: [BadgeDefinition] {
        badgeDefinitions.filter { badge(for: $0) == nil }
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Unlocked") {
                    if unlockedDefinitions.isEmpty {
                        Text("Your first badge will appear after a check-in.")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(unlockedDefinitions) { definition in
                            NavigationLink {
                                BadgeDetailView(definition: definition, userBadge: badge(for: definition))
                            } label: {
                                BadgeCard(definition: definition, userBadge: badge(for: definition), progressText: nil)
                            }
                        }
                    }
                }

                Section("Locked") {
                    ForEach(lockedDefinitions) { definition in
                        NavigationLink {
                            BadgeDetailView(definition: definition, userBadge: nil)
                        } label: {
                            BadgeCard(
                                definition: definition,
                                userBadge: nil,
                                progressText: BadgeEngine.progressText(for: definition, habits: habits, checkIns: checkIns)
                            )
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Achievements")
        }
    }

    private func badge(for definition: BadgeDefinition) -> UserBadge? {
        userBadges.first { $0.badgeCode == definition.code }
    }
}
