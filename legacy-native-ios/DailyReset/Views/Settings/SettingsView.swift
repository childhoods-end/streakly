import SwiftData
import SwiftUI
import UserNotifications

struct SettingsView: View {
    @AppStorage("onboardingCompleted") private var onboardingCompleted = false
    @Environment(\.modelContext) private var modelContext
    @Query private var habits: [Habit]
    @Query private var checkIns: [CheckIn]
    @Query private var badgeDefinitions: [BadgeDefinition]
    @Query private var userBadges: [UserBadge]
    @Query private var paywallEvents: [PaywallEvent]

    @State private var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @State private var showPaywall = false
    @State private var showResetConfirmation = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Notifications") {
                    HStack {
                        Text("Permission")
                        Spacer()
                        Text(notificationStatusText)
                            .foregroundStyle(.secondary)
                    }

                    Button("Request Permission") {
                        Task {
                            _ = await NotificationService.requestAuthorization()
                            authorizationStatus = await NotificationService.authorizationStatus()
                        }
                    }
                }

                Section("Premium") {
                    Button("Open Daily Reset Plus") {
                        showPaywall = true
                    }
                }

                Section("Data") {
                    Button("Reset All Data", role: .destructive) {
                        showResetConfirmation = true
                    }
                }

                Section("About") {
                    LabeledContent("App", value: "Daily Reset")
                    LabeledContent("Version", value: version)
                    Text("Build your streak, one day at a time.")
                }

                Section("Disclaimer") {
                    Text("This app is a habit tracking and self-improvement tool. It is not medical advice, therapy, or a treatment product.")
                }
            }
            .navigationTitle("Settings")
            .task {
                authorizationStatus = await NotificationService.authorizationStatus()
            }
            .sheet(isPresented: $showPaywall) {
                PaywallView()
            }
            .confirmationDialog("Reset all data?", isPresented: $showResetConfirmation, titleVisibility: .visible) {
                Button("Reset Everything", role: .destructive, action: resetAllData)
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This deletes habits, check-ins, badges, and paywall events from this device.")
            }
        }
    }

    private var notificationStatusText: String {
        switch authorizationStatus {
        case .notDetermined: "Not Determined"
        case .denied: "Denied"
        case .authorized: "Authorized"
        case .provisional: "Provisional"
        case .ephemeral: "Ephemeral"
        @unknown default: "Unknown"
        }
    }

    private var version: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }

    private func resetAllData() {
        habits.forEach {
            NotificationService.cancelReminder(for: $0)
            modelContext.delete($0)
        }
        checkIns.forEach { modelContext.delete($0) }
        badgeDefinitions.forEach { modelContext.delete($0) }
        userBadges.forEach { modelContext.delete($0) }
        paywallEvents.forEach { modelContext.delete($0) }
        try? modelContext.save()
        onboardingCompleted = false
    }
}
