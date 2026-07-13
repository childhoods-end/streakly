import SwiftData
import SwiftUI

struct HabitDetailView: View {
    let habit: Habit

    @Query(sort: \CheckIn.date, order: .reverse) private var allCheckIns: [CheckIn]
    @State private var showEdit = false

    private var habitCheckIns: [CheckIn] {
        StreakService.checkInsForHabit(habit: habit, allCheckIns: allCheckIns)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                header

                HStack(spacing: 12) {
                    DetailMetric(title: "Current", value: "\(StreakService.calculateCurrentStreak(habit: habit, checkIns: allCheckIns))", subtitle: "streak")
                    DetailMetric(title: "Best", value: "\(StreakService.calculateBestStreak(habit: habit, checkIns: allCheckIns))", subtitle: "streak")
                }

                HStack(spacing: 12) {
                    DetailMetric(title: "Last 7 Days", value: percent(StreakService.calculateCompletionRate(habit: habit, checkIns: allCheckIns, days: 7)), subtitle: "complete")
                    DetailMetric(title: "Last 30 Days", value: percent(StreakService.calculateCompletionRate(habit: habit, checkIns: allCheckIns, days: 30)), subtitle: "complete")
                }

                CalendarGrid(completedDates: StreakService.completedDays(for: habit, checkIns: allCheckIns))

                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Check-ins")
                        .font(.headline)

                    if habitCheckIns.isEmpty {
                        Text("No check-ins yet.")
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding()
                            .background(.background, in: RoundedRectangle(cornerRadius: 8))
                    } else {
                        ForEach(habitCheckIns.prefix(20)) { checkIn in
                            HStack {
                                Label(checkIn.date.formatted(date: .abbreviated, time: .shortened), systemImage: "checkmark.circle.fill")
                                    .foregroundStyle(.green)
                                Spacer()
                                if let value = checkIn.value, habit.unit.needsValue {
                                    Text("\(format(value)) \(habit.unit.shortName)")
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .font(.subheadline)
                            .padding()
                            .background(.background, in: RoundedRectangle(cornerRadius: 8))
                            .overlay {
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(.quaternary, lineWidth: 1)
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle(habit.title)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showEdit = true
                } label: {
                    Label("Edit", systemImage: "pencil")
                }
            }
        }
        .sheet(isPresented: $showEdit) {
            HabitCreateEditView(habit: habit)
        }
    }

    private var header: some View {
        HStack(spacing: 14) {
            Image(systemName: habit.category.iconName)
                .font(.largeTitle)
                .foregroundStyle(.tint)
                .frame(width: 64, height: 64)
                .background(Color.accentColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 4) {
                Text(habit.title)
                    .font(.title2.bold())
                Text("\(habit.category.displayName) • \(habit.targetDescription)")
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
    }

    private func percent(_ value: Double) -> String {
        value.formatted(.percent.precision(.fractionLength(0)))
    }

    private func format(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(value)) : String(format: "%.1f", value)
    }
}

private struct DetailMetric: View {
    let title: String
    let value: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title.bold())
            Text(subtitle)
                .font(.caption)
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
}
