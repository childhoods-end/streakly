import Foundation

enum BadgeEngine {
    static func evaluateBadges(
        for habit: Habit,
        allHabits: [Habit],
        allCheckIns: [CheckIn],
        existingBadges: [UserBadge],
        badgeDefinitions: [BadgeDefinition]
    ) -> [BadgeDefinition] {
        let existingCodes = Set(existingBadges.map(\.badgeCode))
        let activeDefinitions = badgeDefinitions.filter { $0.isActive && !existingCodes.contains($0.code) }

        return activeDefinitions.filter { definition in
            hasUnlocked(
                definition: definition,
                habit: habit,
                allHabits: allHabits,
                allCheckIns: allCheckIns
            )
        }
    }

    static func progressText(for definition: BadgeDefinition, habits: [Habit], checkIns: [CheckIn]) -> String {
        let progress = progressValue(for: definition, habits: habits, checkIns: checkIns)
        let remaining = max(definition.threshold - progress, 0)
        let whole = Int(ceil(remaining))

        switch definition.code {
        case "reading_500_pages":
            return "\(whole) pages left"
        case "fitness_600_minutes", "study_3000_minutes":
            return "\(whole) minutes left"
        case "streak_3", "streak_7", "streak_14", "streak_30", "streak_100", "detox_7_days":
            return "\(whole) days away"
        default:
            return "\(whole) check-ins left"
        }
    }

    static func progressValue(for definition: BadgeDefinition, habits: [Habit], checkIns: [CheckIn]) -> Double {
        switch definition.badgeType {
        case "streak":
            return Double(habits.map { StreakService.calculateCurrentStreak(habit: $0, checkIns: checkIns) }.max() ?? 0)
        case "total":
            return Double(uniqueCheckInDaysByHabit(checkIns: checkIns).count)
        case "category":
            return categoryProgress(definition: definition, habits: habits, checkIns: checkIns)
        case "special":
            return specialProgress(definition: definition, habits: habits, checkIns: checkIns)
        default:
            return 0
        }
    }

    private static func hasUnlocked(
        definition: BadgeDefinition,
        habit: Habit,
        allHabits: [Habit],
        allCheckIns: [CheckIn]
    ) -> Bool {
        switch definition.badgeType {
        case "streak":
            return StreakService.calculateCurrentStreak(habit: habit, checkIns: allCheckIns) >= Int(definition.threshold)
        case "total":
            return uniqueCheckInDaysByHabit(checkIns: allCheckIns).count >= Int(definition.threshold)
        case "category":
            return categoryProgress(definition: definition, habits: allHabits, checkIns: allCheckIns) >= definition.threshold
        case "special":
            return specialProgress(definition: definition, habits: allHabits, checkIns: allCheckIns) >= definition.threshold
        default:
            return false
        }
    }

    private static func categoryProgress(definition: BadgeDefinition, habits: [Habit], checkIns: [CheckIn]) -> Double {
        let categoryHabits = habits.filter { $0.category.rawValue == definition.category }

        if definition.code == "detox_7_days" {
            return Double(categoryHabits.map { StreakService.calculateCurrentStreak(habit: $0, checkIns: checkIns) }.max() ?? 0)
        }

        if definition.code == "sleep_14_days" {
            return Double(categoryHabits.reduce(0) { $0 + StreakService.completedDaysCount(for: $1, checkIns: checkIns) })
        }

        return categoryHabits.reduce(0) { total, habit in
            let values = StreakService.checkInsForHabit(habit: habit, allCheckIns: checkIns)
                .map { $0.value ?? habit.targetValue ?? 1 }
            return total + values.reduce(0, +)
        }
    }

    private static func specialProgress(definition: BadgeDefinition, habits: [Habit], checkIns: [CheckIn]) -> Double {
        let calendar = Calendar.current

        if definition.code == "first_checkin" {
            return checkIns.isEmpty ? 0 : 1
        }

        if definition.code == "three_habits_one_day" {
            let grouped = Dictionary(grouping: checkIns) { calendar.startOfDay(for: $0.date) }
            let maxHabitsInOneDay = grouped.values.map { Set($0.map(\.habitId)).count }.max() ?? 0
            return Double(maxHabitsInOneDay)
        }

        return 0
    }

    private static func uniqueCheckInDaysByHabit(checkIns: [CheckIn]) -> Set<String> {
        let calendar = Calendar.current
        return Set(checkIns.map { "\($0.habitId.uuidString)-\(calendar.startOfDay(for: $0.date).timeIntervalSince1970)" })
    }
}
