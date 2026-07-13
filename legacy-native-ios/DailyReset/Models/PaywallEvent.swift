import Foundation
import SwiftData

@Model
final class PaywallEvent {
    @Attribute(.unique) var id: UUID
    var eventType: String
    var createdAt: Date

    init(id: UUID = UUID(), eventType: String, createdAt: Date = Date()) {
        self.id = id
        self.eventType = eventType
        self.createdAt = createdAt
    }
}
