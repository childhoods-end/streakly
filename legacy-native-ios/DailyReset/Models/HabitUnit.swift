enum HabitUnit: String, CaseIterable, Codable, Identifiable {
    case yesNo
    case minutes
    case pages
    case times
    case kilometers
    case custom

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .yesNo: "Yes / No"
        case .minutes: "Minutes"
        case .pages: "Pages"
        case .times: "Times"
        case .kilometers: "Kilometers"
        case .custom: "Custom"
        }
    }

    var shortName: String {
        switch self {
        case .yesNo: "done"
        case .minutes: "min"
        case .pages: "pages"
        case .times: "times"
        case .kilometers: "km"
        case .custom: "units"
        }
    }

    var needsValue: Bool { self != .yesNo }
}
