import SwiftData
import SwiftUI

struct ProgressView: View {
    @Query(sort: \Habit.createdAt) private var habits: [Habit]
    @Query(sort: \CheckIn.createdAt, order: .reverse) private var checkIns: [CheckIn]

    private var activeHabits: [Habit] {
        habits.filter { !$0.isArchived }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    insightCard
                    statsGrid

                    Text("Habit Stats")
                        .font(.headline)

                    if activeHabits.isEmpty {
                        EmptyStateView(
                            title: "No progress yet",
                            message: "Create a habit and check in to see your progress.",
                            systemImage: "chart.bar"
                        )
                    } else {
                        ForEach(activeHabits) { habit in
                            HabitProgressCard(habit: habit, checkIns: checkIns)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Progress")
        }
    }

    private var insightCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Weekly Insight", systemImage: "sparkles")
                .font(.headline)
            Text(InsightService.generateWeeklyInsight(habits: habits, checkIns: checkIns))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(.quaternary, lineWidth: 1)
        }
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(title: "Active Habits", value: "\(activeHabits.count)", systemImage: "list.bullet")
            StatCard(title: "Today", value: percent(InsightService.overallCompletionRate(habits: activeHabits, checkIns: checkIns, days: 1)), systemImage: "sun.max")
            StatCard(title: "This Week", value: percent(InsightService.overallCompletionRate(habits: activeHabits, checkIns: checkIns, days: 7)), systemImage: "calendar")
            StatCard(title: "This Month", value: percent(InsightService.overallCompletionRate(habits: activeHabits, checkIns: checkIns, days: 30)), systemImage: "calendar.badge.clock")
            StatCard(title: "Check-ins", value: "\(checkIns.count)", systemImage: "checkmark.circle")
            StatCard(title: "Current Best", value: "\(currentLongestStreak)", systemImage: "flame")
            StatCard(title: "All-time Best", value: "\(bestStreak)", systemImage: "trophy")
        }
    }

    private var currentLongestStreak: Int {
        activeHabits.map { StreakService.calculateCurrentStreak(habit: $0, checkIns: checkIns) }.max() ?? 0
    }

    private var bestStreak: Int {
        activeHabits.map { StreakService.calculateBestStreak(habit: $0, checkIns: checkIns) }.max() ?? 0
    }

    private func percent(_ value: Double) -> String {
        value.formatted(.percent.precision(.fractionLength(0)))
    }
}

private struct StatCard: View {
    let title: String
    let value: String
    let systemImage: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: systemImage)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title2.bold())
                .contentTransition(.numericText())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(.quaternary, lineWidth: 1)
        }
    }
}

private struct HabitProgressCard: View {
    let habit: Habit
    let checkIns: [CheckIn]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label(habit.title, systemImage: habit.category.iconName)
                    .font(.headline)
                Spacer()
                StreakBadge(streak: StreakService.calculateCurrentStreak(habit: habit, checkIns: checkIns))
            }

            HStack(spacing: 12) {
                MiniMetric(title: "Best", value: "\(StreakService.calculateBestStreak(habit: habit, checkIns: checkIns))")
                MiniMetric(title: "7 Days", value: percent(StreakService.calculateCompletionRate(habit: habit, checkIns: checkIns, days: 7)))
                MiniMetric(title: "30 Days", value: percent(StreakService.calculateCompletionRate(habit: habit, checkIns: checkIns, days: 30)))
            }
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(.quaternary, lineWidth: 1)
        }
    }

    private func percent(_ value: Double) -> String {
        value.formatted(.percent.precision(.fractionLength(0)))
    }
}

private struct MiniMetric: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
