import SwiftUI

struct HabitCard: View {
    let habit: Habit
    let streak: Int
    let isCompletedToday: Bool
    let checkInAction: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                Image(systemName: habit.category.iconName)
                    .font(.title3)
                    .foregroundStyle(.tint)
                    .frame(width: 36, height: 36)
                    .background(Color.accentColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))

                VStack(alignment: .leading, spacing: 4) {
                    Text(habit.title)
                        .font(.headline)
                    Text("\(habit.category.displayName) • \(habit.targetDescription)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()
                StreakBadge(streak: streak)
            }

            Button(action: checkInAction) {
                Label(isCompletedToday ? "Completed" : "Check In", systemImage: isCompletedToday ? "checkmark.circle.fill" : "plus.circle.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(isCompletedToday)
            .tint(isCompletedToday ? .green : .accentColor)
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(.quaternary, lineWidth: 1)
        }
    }
}
