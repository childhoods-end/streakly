import SwiftUI

enum HabitCategory: String, CaseIterable, Codable, Identifiable {
    case fitness
    case reading
    case study
    case sleep
    case digitalDetox
    case custom

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .fitness: "Fitness"
        case .reading: "Reading"
        case .study: "Study"
        case .sleep: "Sleep"
        case .digitalDetox: "Digital Detox"
        case .custom: "Custom"
        }
    }

    var iconName: String {
        switch self {
        case .fitness: "figure.strengthtraining.traditional"
        case .reading: "book"
        case .study: "graduationcap"
        case .sleep: "moon"
        case .digitalDetox: "iphone.slash"
        case .custom: "sparkles"
        }
    }

    var defaultUnit: HabitUnit {
        switch self {
        case .fitness: .minutes
        case .reading: .pages
        case .study: .minutes
        case .sleep: .yesNo
        case .digitalDetox: .yesNo
        case .custom: .yesNo
        }
    }
}
