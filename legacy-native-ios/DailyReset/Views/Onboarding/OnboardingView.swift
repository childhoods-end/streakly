import SwiftData
import SwiftUI

struct OnboardingView: View {
    @AppStorage("onboardingCompleted") private var onboardingCompleted = false
    @Environment(\.modelContext) private var modelContext

    @State private var step = 0
    @State private var category: HabitCategory = .fitness
    @State private var title = ""
    @State private var targetValue = 10.0
    @State private var unit: HabitUnit = .minutes
    @State private var reminderEnabled = true
    @State private var reminderDate = Calendar.current.date(bySettingHour: 21, minute: 0, second: 0, of: Date()) ?? Date()
    @State private var showValidation = false

    private let placeholders = [
        "Read 20 pages",
        "Workout 10 minutes",
        "Study Java",
        "Sleep before 11:30 PM",
        "No social media after 10 PM"
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                SwiftUI.ProgressView(value: Double(step + 1), total: 4)
                    .padding(.horizontal)

                TabView(selection: $step) {
                    categoryStep.tag(0)
                    nameStep.tag(1)
                    targetStep.tag(2)
                    reminderStep.tag(3)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                HStack {
                    if step > 0 {
                        Button("Back") {
                            withAnimation { step -= 1 }
                        }
                    }

                    Spacer()

                    Button(step == 3 ? "Start" : "Next") {
                        next()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            }
            .navigationTitle("Daily Reset")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: category) { _, newValue in
                unit = newValue.defaultUnit
                targetValue = defaultTarget(for: newValue.defaultUnit)
            }
            .alert("Habit name required", isPresented: $showValidation) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("Add a short name for your daily habit.")
            }
        }
    }

    private var categoryStep: some View {
        VStack(alignment: .leading, spacing: 22) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Build your streak, one day at a time.")
                    .font(.title.bold())
                Text("Choose the kind of daily reset you want to start with.")
                    .foregroundStyle(.secondary)
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(HabitCategory.allCases) { item in
                    Button {
                        category = item
                    } label: {
                        VStack(spacing: 10) {
                            Image(systemName: item.iconName)
                                .font(.title2)
                            Text(item.displayName)
                                .font(.subheadline.weight(.semibold))
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity, minHeight: 92)
                    }
                    .buttonStyle(.bordered)
                    .tint(category == item ? .accentColor : .secondary)
                }
            }

            Spacer()
        }
        .padding()
    }

    private var nameStep: some View {
        Form {
            Section {
                TextField(placeholders.randomElement() ?? "Read 20 pages", text: $title)
                    .textInputAutocapitalization(.sentences)
            } header: {
                Text("Habit name")
            } footer: {
                Text("Keep it concrete and small enough to repeat daily.")
            }
        }
    }

    private var targetStep: some View {
        Form {
            Section("Daily target") {
                Picker("Unit", selection: $unit) {
                    ForEach(HabitUnit.allCases) { unit in
                        Text(unit.displayName).tag(unit)
                    }
                }

                if unit.needsValue {
                    Stepper(value: $targetValue, in: 1...10000, step: unit == .kilometers ? 0.5 : 1) {
                        Text("\(formattedTarget) \(unit.shortName)")
                    }
                } else {
                    Label("One tap check-in", systemImage: "checkmark.circle")
                }
            }
        }
    }

    private var reminderStep: some View {
        Form {
            Section {
                Toggle("Daily reminder", isOn: $reminderEnabled)
                if reminderEnabled {
                    DatePicker("Reminder time", selection: $reminderDate, displayedComponents: .hourAndMinute)
                }
            } header: {
                Text("Reminder")
            } footer: {
                Text("You can change this later in habit settings.")
            }
        }
    }

    private var formattedTarget: String {
        targetValue.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(targetValue)) : String(format: "%.1f", targetValue)
    }

    private func next() {
        if step == 1 && title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            showValidation = true
            return
        }

        if step < 3 {
            withAnimation { step += 1 }
        } else {
            createFirstHabit()
        }
    }

    private func createFirstHabit() {
        let components = Calendar.current.dateComponents([.hour, .minute], from: reminderDate)
        let habit = Habit(
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            category: category,
            targetValue: unit.needsValue ? targetValue : nil,
            unit: unit,
            reminderHour: components.hour ?? 21,
            reminderMinute: components.minute ?? 0,
            reminderEnabled: reminderEnabled
        )

        modelContext.insert(habit)
        try? modelContext.save()

        if reminderEnabled {
            Task { await NotificationService.scheduleDailyReminder(for: habit) }
        }

        onboardingCompleted = true
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
