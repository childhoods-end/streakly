import Foundation

enum InsightService {
    static func generateWeeklyInsight(habits: [Habit], checkIns: [CheckIn]) -> String {
        let activeHabits = habits.filter { !$0.isArchived }
        guard !activeHabits.isEmpty else {
            return "Create one small habit to start building consistency this week."
        }

        let weeklyRate = overallCompletionRate(habits: activeHabits, checkIns: checkIns, days: 7)
        var messages: [String] = []

        if weeklyRate >= 0.8 {
            messages.append("Great consistency this week.")
        } else if weeklyRate < 0.5 {
            messages.append("Keep it simple next week. Try reducing your daily target.")
        } else {
            messages.append("You are building momentum. Keep the next check-in easy to start.")
        }

        if let streakHabit = activeHabits.first(where: { StreakService.calculateCurrentStreak(habit: $0, checkIns: checkIns) >= 7 }) {
            messages.append("You built a 7-day streak on \(streakHabit.title).")
        }

        if activeHabits.count > 1 && weeklyRate < 0.5 {
            messages.append("Focus on one habit first.")
        }

        return messages.joined(separator: " ")
    }

    static func overallCompletionRate(habits: [Habit], checkIns: [CheckIn], days: Int) -> Double {
        let activeHabits = habits.filter { !$0.isArchived }
        guard !activeHabits.isEmpty, days > 0 else { return 0 }

        let total = activeHabits.reduce(0.0) { partial, habit in
            partial + StreakService.calculateCompletionRate(habit: habit, checkIns: checkIns, days: days)
        }
        return total / Double(activeHabits.count)
    }
}
