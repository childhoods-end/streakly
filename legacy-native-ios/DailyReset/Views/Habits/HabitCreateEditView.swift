import SwiftData
import SwiftUI

struct HabitCreateEditView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    private let habit: Habit?

    @State private var title: String
    @State private var category: HabitCategory
    @State private var unit: HabitUnit
    @State private var targetValue: Double
    @State private var reminderEnabled: Bool
    @State private var reminderDate: Date
    @State private var showValidation = false

    init(habit: Habit? = nil) {
        self.habit = habit
        _title = State(initialValue: habit?.title ?? "")
        _category = State(initialValue: habit?.category ?? .custom)
        _unit = State(initialValue: habit?.unit ?? habit?.category.defaultUnit ?? .yesNo)
        _targetValue = State(initialValue: habit?.targetValue ?? 1)
        _reminderEnabled = State(initialValue: habit?.reminderEnabled ?? false)
        let hour = habit?.reminderHour ?? 21
        let minute = habit?.reminderMinute ?? 0
        _reminderDate = State(initialValue: Calendar.current.date(bySettingHour: hour, minute: minute, second: 0, of: Date()) ?? Date())
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Habit") {
                    TextField("Habit name", text: $title)
                    Picker("Category", selection: $category) {
                        ForEach(HabitCategory.allCases) { category in
                            Label(category.displayName, systemImage: category.iconName).tag(category)
                        }
                    }
                    .onChange(of: category) { _, newValue in
                        unit = newValue.defaultUnit
                        targetValue = defaultTarget(for: newValue.defaultUnit)
                    }
                }

                Section("Daily target") {
                    Picker("Unit", selection: $unit) {
                        ForEach(HabitUnit.allCases) { unit in
                            Text(unit.displayName).tag(unit)
                        }
                    }

                    if unit.needsValue {
                        Stepper(value: $targetValue, in: 0.5...10000, step: unit == .kilometers ? 0.5 : 1) {
                            Text("\(formattedTarget) \(unit.shortName)")
                        }
                    } else {
                        Label("One tap check-in", systemImage: "checkmark.circle")
                    }
                }

                Section("Reminder") {
                    Toggle("Daily reminder", isOn: $reminderEnabled)
                    if reminderEnabled {
                        DatePicker("Time", selection: $reminderDate, displayedComponents: .hourAndMinute)
                    }
                }
            }
            .navigationTitle(habit == nil ? "New Habit" : "Edit Habit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                }
            }
            .alert("Habit name required", isPresented: $showValidation) {
                Button("OK", role: .cancel) {}
            }
        }
    }

    private var formattedTarget: String {
        targetValue.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(targetValue)) : String(format: "%.1f", targetValue)
    }

    private func save() {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else {
            showValidation = true
            return
        }

        let components = Calendar.current.dateComponents([.hour, .minute], from: reminderDate)

        if let habit {
            habit.title = trimmedTitle
            habit.category = category
            habit.unit = unit
            habit.targetValue = unit.needsValue ? targetValue : nil
            habit.reminderEnabled = reminderEnabled
            habit.reminderHour = components.hour ?? 21
            habit.reminderMinute = components.minute ?? 0

            if reminderEnabled {
                Task { await NotificationService.updateReminder(for: habit) }
            } else {
                NotificationService.cancelReminder(for: habit)
            }
        } else {
            let newHabit = Habit(
                title: trimmedTitle,
                category: category,
                targetValue: unit.needsValue ? targetValue : nil,
                unit: unit,
                reminderHour: components.hour ?? 21,
                reminderMinute: components.minute ?? 0,
                reminderEnabled: reminderEnabled
            )
            modelContext.insert(newHabit)
            if reminderEnabled {
                Task { await NotificationService.scheduleDailyReminder(for: newHabit) }
            }
        }

        try? modelContext.save()
        dismiss()
    }

    private func defaultTarget(for unit: HabitUnit) -> Double {
        switch unit {
        case .yesNo: 1
        case .minutes: 10
        case .pages: 20
        case .times: 1
        case .kilometers: 1
        case .custom: 1
        }
    }
}
