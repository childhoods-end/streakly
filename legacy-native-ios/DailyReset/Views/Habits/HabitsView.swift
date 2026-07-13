import SwiftData
import SwiftUI

struct HabitsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Habit.createdAt) private var habits: [Habit]
    @Query(sort: \CheckIn.createdAt) private var checkIns: [CheckIn]

    @State private var showCreate = false
    @State private var showPaywall = false
    @State private var habitToEdit: Habit?
    @State private var habitToDelete: Habit?

    private var activeHabits: [Habit] {
        habits.filter { !$0.isArchived }
    }

    var body: some View {
        NavigationStack {
            Group {
                if activeHabits.isEmpty {
                    EmptyStateView(
                        title: "No active habits",
                        message: "Start with one habit you can repeat today.",
                        systemImage: "plus.circle",
                        actionTitle: "Create Habit",
                        action: openCreateFlow
                    )
                } else {
                    List {
                        ForEach(activeHabits) { habit in
                            NavigationLink {
                                HabitDetailView(habit: habit)
                            } label: {
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(habit.title)
                                        .font(.headline)
                                    Text("\(habit.category.displayName) • \(habit.targetDescription)")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .swipeActions(edge: .trailing) {
                                Button(role: .destructive) {
                                    habitToDelete = habit
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }

                                Button {
                                    archive(habit)
                                } label: {
                                    Label("Archive", systemImage: "archivebox")
                                }
                                .tint(.orange)
                            }
                            .swipeActions(edge: .leading) {
                                Button {
                                    habitToEdit = habit
                                } label: {
                                    Label("Edit", systemImage: "pencil")
                                }
                                .tint(.blue)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Habits")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: openCreateFlow) {
                        Label("Add", systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $showCreate) {
                HabitCreateEditView()
            }
            .sheet(item: $habitToEdit) { habit in
                HabitCreateEditView(habit: habit)
            }
            .sheet(isPresented: $showPaywall) {
                PaywallView {
                    showPaywall = false
                    showCreate = true
                }
            }
            .confirmationDialog("Delete habit?", isPresented: Binding(
                get: { habitToDelete != nil },
                set: { if !$0 { habitToDelete = nil } }
            ), titleVisibility: .visible) {
                Button("Delete Habit", role: .destructive) {
                    if let habitToDelete {
                        delete(habitToDelete)
                    }
                    habitToDelete = nil
                }
                Button("Cancel", role: .cancel) {
                    habitToDelete = nil
                }
            } message: {
                Text("This removes the habit and its check-ins from this device.")
            }
        }
    }

    private func openCreateFlow() {
        if activeHabits.count >= 2 {
            modelContext.insert(PaywallEvent(eventType: "third_habit_create"))
            try? modelContext.save()
            showPaywall = true
        } else {
            showCreate = true
        }
    }

    private func archive(_ habit: Habit) {
        habit.isArchived = true
        NotificationService.cancelReminder(for: habit)
        try? modelContext.save()
    }

    private func delete(_ habit: Habit) {
        NotificationService.cancelReminder(for: habit)
        checkIns.filter { $0.habitId == habit.id }.forEach { modelContext.delete($0) }
        modelContext.delete(habit)
        try? modelContext.save()
    }
}
