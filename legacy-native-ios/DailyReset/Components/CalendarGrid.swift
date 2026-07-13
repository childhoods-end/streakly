import SwiftUI

struct CalendarGrid: View {
    let completedDates: Set<Date>
    var month: Date = Date()

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 6), count: 7)
    private let weekdaySymbols = Calendar.current.shortStandaloneWeekdaySymbols

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(month.formatted(.dateTime.month(.wide).year()))
                .font(.headline)

            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(weekdaySymbols, id: \.self) { symbol in
                    Text(String(symbol.prefix(2)))
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }

                ForEach(monthDays(), id: \.self) { date in
                    if let date {
                        DayCell(
                            day: Calendar.current.component(.day, from: date),
                            isCompleted: completedDates.contains(Calendar.current.startOfDay(for: date)),
                            isToday: Calendar.current.isDateInToday(date)
                        )
                    } else {
                        Color.clear
                            .frame(height: 34)
                    }
                }
            }
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(.quaternary, lineWidth: 1)
        }
    }

    private func monthDays() -> [Date?] {
        let calendar = Calendar.current
        guard
            let interval = calendar.dateInterval(of: .month, for: month),
            let daysRange = calendar.range(of: .day, in: .month, for: month)
        else { return [] }

        let firstWeekday = calendar.component(.weekday, from: interval.start)
        let leadingEmpty = firstWeekday - calendar.firstWeekday
        let normalizedLeading = leadingEmpty >= 0 ? leadingEmpty : leadingEmpty + 7
        let days = daysRange.compactMap { day -> Date? in
            calendar.date(byAdding: .day, value: day - 1, to: interval.start)
        }

        return Array(repeating: nil, count: normalizedLeading) + days
    }
}

private struct DayCell: View {
    let day: Int
    let isCompleted: Bool
    let isToday: Bool

    var body: some View {
        Text("\(day)")
            .font(.caption.weight(isToday ? .bold : .regular))
            .foregroundStyle(isCompleted ? .white : .primary)
            .frame(maxWidth: .infinity, minHeight: 34)
            .background {
                if isCompleted {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(.green)
                } else if isToday {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(.tint, lineWidth: 2)
                }
            }
    }
}
