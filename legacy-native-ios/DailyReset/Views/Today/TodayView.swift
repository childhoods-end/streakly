import SwiftData
import SwiftUI
import UIKit

struct TodayView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Habit.createdAt) private var habits: [Habit]
    @Query(sort: \CheckIn.createdAt, order: .reverse) private var checkIns: [CheckIn]
    @Query(sort: \UserBadge.unlockedAt, order: .reverse) private var userBadges: [UserBadge]
    @Query(sort: \BadgeDefinition.code) private var badgeDefinitions: [BadgeDefinition]

    @State private var valueHabit: Habit?
    @State private var unlockedPresentation: UnlockedBadgePresentation?

    private var activeHabits: [Habit] {
        habits.filter { !$0.isArchived }
    }

    private var completedTodayCount: Int {
        activeHabits.filter { StreakService.isCheckedInToday(habit: $0, checkIns: checkIns) }.count
    }

    private var longestCurrentStreak: Int {
        activeHabits.map { StreakService.calculateCurrentStreak(habit: $0, checkIns: checkIns) }.max() ?? 0
    }

    var body: some View {
        NavigationStack {
            Group {
                if activeHabits.isEmpty {
                    EmptyStateView(
                        title: "No habits yet",
                        message: "Create one small daily habit to start your streak.",
                        systemImage: "plus.circle"
                    )
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            summaryHeader

                            ForEach(activeHabits) { habit in
                                HabitCard(
                                    habit: habit,
                                    streak: StreakService.calculateCurrentStreak(habit: habit, checkIns: checkIns),
                                    isCompletedToday: StreakService.isCheckedInToday(habit: habit, checkIns: checkIns)
                                ) {
                                    beginCheckIn(for: habit)
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Today")
            .sheet(item: $valueHabit) { habit in
                ValueCheckInSheet(habit: habit) { value in
                    completeCheckIn(for: habit, value: value)
                }
            }
            .sheet(item: $unlockedPresentation) { presentation in
                AchievementUnlockedSheet(
                    definition: presentation.definition,
                    userBadge: presentation.userBadge,
                    currentStreak: presentation.currentStreak
                )
            }
        }
    }

    private var summaryHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(Date().formatted(.dateTime.weekday(.wide).month(.wide).day()))
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                SummaryTile(title: "Completed", value: "\(completedTodayCount)/\(activeHabits.count)", systemImage: "checkmark.circle.fill", color: .green)
                SummaryTile(title: "Longest Streak", value: "\(longestCurrentStreak)", systemImage: "flame.fill", color: .orange)
            }
        }
    }

    private func beginCheckIn(for habit: Habit) {
        guard !StreakService.isCheckedInToday(habit: habit, checkIns: checkIns) else { return }

        if habit.unit.needsValue {
            valueHabit = habit
        } else {
            completeCheckIn(for: habit, value: nil)
        }
    }

    private func completeCheckIn(for habit: Habit, value: Double?) {
        guard !StreakService.isCheckedInToday(habit: habit, checkIns: checkIns) else { return }

        let checkIn = CheckIn(habitId: habit.id, value: value ?? habit.targetValue)
        modelContext.insert(checkIn)

        let updatedCheckIns = [checkIn] + checkIns
        let unlockedDefinitions = BadgeEngine.evaluateBadges(
            for: habit,
            allHabits: habits,
            allCheckIns: updatedCheckIns,
            existingBadges: userBadges,
            badgeDefinitions: badgeDefinitions
        )

        let newUserBadges = unlockedDefinitions.map { definition in
            UserBadge(badgeCode: definition.code, habitId: habit.id)
        }
        newUserBadges.forEach { modelContext.insert($0) }

        try? modelContext.save()

        UINotificationFeedbackGenerator().notificationOccurred(.success)

        if let firstDefinition = unlockedDefinitions.first,
           let userBadge = newUserBadges.first(where: { $0.badgeCode == firstDefinition.code }) {
            unlockedPresentation = UnlockedBadgePresentation(
                definition: firstDefinition,
                userBadge: userBadge,
                currentStreak: StreakService.calculateCurrentStreak(habit: habit, checkIns: updatedCheckIns)
            )
        }
    }
}

private struct SummaryTile: View {
    let title: String
    let value: String
    let systemImage: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: systemImage)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title2.bold())
                .foregroundStyle(color)
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

private struct ValueCheckInSheet: View {
    let habit: Habit
    let onComplete: (Double) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var value: Double

    init(habit: Habit, onComplete: @escaping (Double) -> Void) {
        self.habit = habit
        self.onComplete = onComplete
        _value = State(initialValue: habit.targetValue ?? 1)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Stepper(value: $value, in: 0.5...10000, step: habit.unit == .kilometers ? 0.5 : 1) {
                        Text("\(formattedValue) \(habit.unit.shortName)")
                    }
                } header: {
                    Text(habit.title)
                }
            }
            .navigationTitle("Check In")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onComplete(value)
                        dismiss()
                    }
                }
            }
        }
    }

    private var formattedValue: String {
        value.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(value)) : String(format: "%.1f", value)
    }
}

struct UnlockedBadgePresentation: Identifiable {
    let id = UUID()
    let definition: BadgeDefinition
    let userBadge: UserBadge
    let currentStreak: Int
}
