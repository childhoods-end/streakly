import Foundation
import UserNotifications

enum NotificationService {
    static func requestAuthorization() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
        } catch {
            return false
        }
    }

    static func authorizationStatus() async -> UNAuthorizationStatus {
        await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
    }

    static func scheduleDailyReminder(for habit: Habit) async {
        guard habit.reminderEnabled else {
            cancelReminder(for: habit)
            return
        }

        _ = await requestAuthorization()
        cancelReminder(for: habit)

        var dateComponents = DateComponents()
        dateComponents.hour = habit.reminderHour
        dateComponents.minute = habit.reminderMinute

        let content = UNMutableNotificationContent()
        content.title = "Time to check in: \(habit.title)"
        content.body = "Keep your streak alive today."
        content.sound = .default

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(
            identifier: habit.reminderIdentifier,
            content: content,
            trigger: trigger
        )

        try? await UNUserNotificationCenter.current().add(request)
    }

    static func cancelReminder(for habit: Habit) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [habit.reminderIdentifier])
    }

    static func updateReminder(for habit: Habit) async {
        cancelReminder(for: habit)
        await scheduleDailyReminder(for: habit)
    }
}
