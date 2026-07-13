import Foundation
import SwiftData

@Model
final class UserBadge {
    @Attribute(.unique) var id: UUID
    var badgeCode: String
    var habitId: UUID?
    var unlockedAt: Date
    var shareCount: Int

    init(
        id: UUID = UUID(),
        badgeCode: String,
        habitId: UUID? = nil,
        unlockedAt: Date = Date(),
        shareCount: Int = 0
    ) {
        self.id = id
        self.badgeCode = badgeCode
        self.habitId = habitId
        self.unlockedAt = unlockedAt
        self.shareCount = shareCount
    }
}
