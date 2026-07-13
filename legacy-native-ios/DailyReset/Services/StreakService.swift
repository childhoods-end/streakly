import Foundation

enum StreakService {
    static func checkInsForHabit(habit: Habit, allCheckIns: [CheckIn]) -> [CheckIn] {
        allCheckIns
            .filter { $0.habitId == habit.id }
            .sorted { $0.date > $1.date }
    }

    static func isCheckedInToday(habit: Habit, checkIns: [CheckIn]) -> Bool {
        let calendar = Calendar.current
        return checkInsForHabit(habit: habit, allCheckIns: checkIns).contains {
            calendar.isDateInToday($0.date)
        }
    }

    static func calculateCurrentStreak(habit: Habit, checkIns: [CheckIn]) -> Int {
        let calendar = Calendar.current
        let days = completedDays(for: habit, checkIns: checkIns)
        let today = calendar.startOfDay(for: Date())
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today) ?? today

        guard days.contains(today) || days.contains(yesterday) else { return 0 }

        var cursor = days.contains(today) ? today : yesterday
        var count = 0

        while days.contains(cursor) {
            count += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = previous
        }

        return count
    }

    static func calculateBestStreak(habit: Habit, checkIns: [CheckIn]) -> Int {
        let calendar = Calendar.current
        let sortedDays = completedDays(for: habit, checkIns: checkIns).sorted()
        guard !sortedDays.isEmpty else { return 0 }

        var best = 1
        var current = 1

        for index in 1..<sortedDays.count {
            let previous = sortedDays[index - 1]
            let expected = calendar.date(byAdding: .day, value: 1, to: previous)
            if expected == sortedDays[index] {
                current += 1
                best = max(best, current)
            } else {
                current = 1
            }
        }

        return best
    }

    static func calculateCompletionRate(habit: Habit, checkIns: [CheckIn], days: Int) -> Double {
        guard days > 0 else { return 0 }
        let calendar = Calendar.current
        let completed = completedDays(for: habit, checkIns: checkIns)
        let today = calendar.startOfDay(for: Date())

        let completedCount = (0..<days).reduce(0) { count, offset in
            guard let day = calendar.date(byAdding: .day, value: -offset, to: today) else { return count }
            return count + (completed.contains(day) ? 1 : 0)
        }

        return Double(completedCount) / Double(days)
    }

    static func completedDays(for habit: Habit, checkIns: [CheckIn]) -> Set<Date> {
        let calendar = Calendar.current
        let habitCheckIns = checkInsForHabit(habit: habit, allCheckIns: checkIns)
        return Set(habitCheckIns.map { calendar.startOfDay(for: $0.date) })
    }

    static func completedDaysCount(for habit: Habit, checkIns: [CheckIn]) -> Int {
        completedDays(for: habit, checkIns: checkIns).count
    }
}
