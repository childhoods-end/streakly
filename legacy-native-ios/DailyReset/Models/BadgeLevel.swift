import SwiftUI

enum BadgeLevel: String, CaseIterable, Codable, Identifiable {
    case bronze
    case silver
    case gold
    case platinum
    case diamond

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .bronze: "Bronze"
        case .silver: "Silver"
        case .gold: "Gold"
        case .platinum: "Platinum"
        case .diamond: "Diamond"
        }
    }

    var color: Color {
        switch self {
        case .bronze: Color(red: 0.72, green: 0.42, blue: 0.21)
        case .silver: Color(red: 0.58, green: 0.63, blue: 0.70)
        case .gold: Color(red: 0.95, green: 0.67, blue: 0.16)
        case .platinum: Color(red: 0.40, green: 0.72, blue: 0.82)
        case .diamond: Color(red: 0.45, green: 0.53, blue: 0.96)
        }
    }

    var gradient: LinearGradient {
        LinearGradient(
            colors: [color.opacity(0.95), color.opacity(0.55), .white.opacity(0.35)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    var priority: Int {
        switch self {
        case .bronze: 1
        case .silver: 2
        case .gold: 3
        case .platinum: 4
        case .diamond: 5
        }
    }
}
