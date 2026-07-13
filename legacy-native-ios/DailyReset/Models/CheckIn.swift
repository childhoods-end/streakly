import Foundation
import SwiftData

@Model
final class CheckIn {
    @Attribute(.unique) var id: UUID
    var habitId: UUID
    var date: Date
    var value: Double?
    var note: String?
    var createdAt: Date

    init(
        id: UUID = UUID(),
        habitId: UUID,
        date: Date = Date(),
        value: Double? = nil,
        note: String? = nil,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.habitId = habitId
        self.date = date
        self.value = value
        self.note = note
        self.createdAt = createdAt
    }
}
