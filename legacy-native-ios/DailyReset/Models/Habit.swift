import Foundation
import SwiftData

@Model
final class Habit {
    @Attribute(.unique) var id: UUID
    var title: String
    var category: HabitCategory
    var targetValue: Double?
    var unit: HabitUnit
    var reminderHour: Int
    var reminderMinute: Int
    var reminderEnabled: Bool
    var createdAt: Date
    var isArchived: Bool

    init(
        id: UUID = UUID(),
        title: String,
        category: HabitCategory,
        targetValue: Double? = nil,
        unit: HabitUnit,
        reminderHour: Int = 21,
        reminderMinute: Int = 0,
        reminderEnabled: Bool = false,
        createdAt: Date = Date(),
        isArchived: Bool = false
    ) {
        self.id = id
        self.title = title
        self.category = category
        self.targetValue = targetValue
        self.unit = unit
        self.reminderHour = reminderHour
        self.reminderMinute = reminderMinute
        self.reminderEnabled = reminderEnabled
        self.createdAt = createdAt
        self.isArchived = isArchived
    }

    var targetDescription: String {
        guard unit.needsValue, let targetValue else { return "Daily check-in" }
        let value = targetValue.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(targetValue)) : String(format: "%.1f", targetValue)
        return "\(value) \(unit.shortName)"
    }

    var reminderIdentifier: String { "habit-reminder-\(id.uuidString)" }
}
