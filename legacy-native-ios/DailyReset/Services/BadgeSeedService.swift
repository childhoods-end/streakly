import SwiftData

enum BadgeSeedService {
    @MainActor
    static func seedIfNeeded(existingDefinitions: [BadgeDefinition], context: ModelContext) {
        guard existingDefinitions.isEmpty else { return }
        seedDefinitions().forEach { context.insert($0) }
        try? context.save()
    }

    static func seedDefinitions() -> [BadgeDefinition] {
        [
            BadgeDefinition(code: "streak_3", title: "First Spark", subtitle: "Complete a 3-day streak.", category: "streak", badgeType: "streak", threshold: 3, level: .bronze, iconName: "flame.fill", colorName: "orange"),
            BadgeDefinition(code: "streak_7", title: "One Week Strong", subtitle: "Complete a 7-day streak.", category: "streak", badgeType: "streak", threshold: 7, level: .bronze, iconName: "flame.fill", colorName: "orange"),
            BadgeDefinition(code: "streak_14", title: "Rising Momentum", subtitle: "Complete a 14-day streak.", category: "streak", badgeType: "streak", threshold: 14, level: .silver, iconName: "bolt.fill", colorName: "blue"),
            BadgeDefinition(code: "streak_30", title: "Monthly Master", subtitle: "Complete a 30-day streak.", category: "streak", badgeType: "streak", threshold: 30, level: .gold, iconName: "crown.fill", colorName: "yellow"),
            BadgeDefinition(code: "streak_100", title: "Centurion", subtitle: "Complete a 100-day streak.", category: "streak", badgeType: "streak", threshold: 100, level: .platinum, iconName: "star.circle.fill", colorName: "teal"),
            BadgeDefinition(code: "total_10", title: "Getting Started", subtitle: "Complete 10 total check-ins.", category: "total", badgeType: "total", threshold: 10, level: .bronze, iconName: "checkmark.circle.fill", colorName: "green"),
            BadgeDefinition(code: "total_30", title: "Habit Explorer", subtitle: "Complete 30 total check-ins.", category: "total", badgeType: "total", threshold: 30, level: .silver, iconName: "map.fill", colorName: "blue"),
            BadgeDefinition(code: "total_100", title: "Habit Builder", subtitle: "Complete 100 total check-ins.", category: "total", badgeType: "total", threshold: 100, level: .gold, iconName: "building.2.fill", colorName: "yellow"),
            BadgeDefinition(code: "reading_500_pages", title: "Book Wanderer", subtitle: "Read 500 total pages.", category: "reading", badgeType: "category", threshold: 500, level: .silver, iconName: "books.vertical.fill", colorName: "purple"),
            BadgeDefinition(code: "fitness_600_minutes", title: "Motion Maker", subtitle: "Log 600 fitness minutes.", category: "fitness", badgeType: "category", threshold: 600, level: .silver, iconName: "figure.run", colorName: "red"),
            BadgeDefinition(code: "study_3000_minutes", title: "Deep Learner", subtitle: "Log 3000 study minutes.", category: "study", badgeType: "category", threshold: 3000, level: .gold, iconName: "brain.head.profile", colorName: "indigo"),
            BadgeDefinition(code: "sleep_14_days", title: "Night Guardian", subtitle: "Complete 14 sleep check-in days.", category: "sleep", badgeType: "category", threshold: 14, level: .silver, iconName: "moon.stars.fill", colorName: "mint"),
            BadgeDefinition(code: "detox_7_days", title: "Mind Clear", subtitle: "Build a 7-day digital detox streak.", category: "digitalDetox", badgeType: "category", threshold: 7, level: .bronze, iconName: "iphone.slash", colorName: "cyan"),
            BadgeDefinition(code: "first_checkin", title: "First Step", subtitle: "Complete your first check-in.", category: "special", badgeType: "special", threshold: 1, level: .bronze, iconName: "shoeprints.fill", colorName: "green"),
            BadgeDefinition(code: "three_habits_one_day", title: "Triple Win", subtitle: "Complete 3 habits in one day.", category: "special", badgeType: "special", threshold: 3, level: .silver, iconName: "3.circle.fill", colorName: "blue")
        ]
    }
}
