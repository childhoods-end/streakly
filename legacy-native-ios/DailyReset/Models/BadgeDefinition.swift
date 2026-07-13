import Foundation
import SwiftData

@Model
final class BadgeDefinition {
    @Attribute(.unique) var id: UUID
    @Attribute(.unique) var code: String
    var title: String
    var subtitle: String
    var category: String
    var badgeType: String
    var threshold: Double
    var level: String
    var iconName: String
    var colorName: String
    var isActive: Bool

    init(
        id: UUID = UUID(),
        code: String,
        title: String,
        subtitle: String,
        category: String,
        badgeType: String,
        threshold: Double,
        level: BadgeLevel,
        iconName: String,
        colorName: String,
        isActive: Bool = true
    ) {
        self.id = id
        self.code = code
        self.title = title
        self.subtitle = subtitle
        self.category = category
        self.badgeType = badgeType
        self.threshold = threshold
        self.level = level.rawValue
        self.iconName = iconName
        self.colorName = colorName
        self.isActive = isActive
    }

    var badgeLevel: BadgeLevel {
        BadgeLevel(rawValue: level) ?? .bronze
    }
}
