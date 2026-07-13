import SwiftData
import SwiftUI
import UIKit

struct BadgeDetailView: View {
    let definition: BadgeDefinition
    let userBadge: UserBadge?

    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Habit.createdAt) private var habits: [Habit]
    @Query(sort: \CheckIn.createdAt, order: .reverse) private var checkIns: [CheckIn]

    @State private var shareImage: UIImage?
    @State private var showShare = false
    @State private var showSavedAlert = false

    private var currentStreak: Int {
        habits.map { StreakService.calculateCurrentStreak(habit: $0, checkIns: checkIns) }.max() ?? 0
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Image(systemName: definition.iconName)
                    .font(.system(size: 76, weight: .bold))
                    .foregroundStyle(userBadge == nil ? .secondary : .white)
                    .frame(width: 150, height: 150)
                    .background(userBadge == nil ? AnyShapeStyle(.quaternary) : AnyShapeStyle(definition.badgeLevel.gradient), in: Circle())

                VStack(spacing: 8) {
                    Text(definition.title)
                        .font(.largeTitle.bold())
                        .multilineTextAlignment(.center)
                    Text(definition.subtitle)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Text(definition.badgeLevel.displayName)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(definition.badgeLevel.color)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(definition.badgeLevel.color.opacity(0.12), in: Capsule())
                }

                VStack(alignment: .leading, spacing: 12) {
                    InfoRow(title: "Condition", value: definition.subtitle)
                    InfoRow(title: "Progress", value: progressText)
                    if let userBadge {
                        InfoRow(title: "Unlocked", value: userBadge.unlockedAt.formatted(date: .abbreviated, time: .shortened))
                    }
                }
                .padding()
                .background(.background, in: RoundedRectangle(cornerRadius: 8))
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(.quaternary, lineWidth: 1)
                }

                if userBadge != nil {
                    VStack(spacing: 12) {
                        Button {
                            prepareShare()
                        } label: {
                            Label("Share", systemImage: "square.and.arrow.up")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)

                        Button {
                            saveImage()
                        } label: {
                            Label("Save Image", systemImage: "square.and.arrow.down")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Badge")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showShare) {
            if let shareImage {
                ActivityView(activityItems: [shareImage])
            }
        }
        .alert("Saved to Photos", isPresented: $showSavedAlert) {
            Button("OK", role: .cancel) {}
        }
    }

    private var progressText: String {
        if userBadge != nil { return "Unlocked" }
        return BadgeEngine.progressText(for: definition, habits: habits, checkIns: checkIns)
    }

    private func prepareShare() {
        shareImage = BadgeShareService.makeShareImage(
            definition: definition,
            userBadge: userBadge,
            currentStreak: currentStreak
        )
        userBadge?.shareCount += 1
        try? modelContext.save()
        showShare = shareImage != nil
    }

    private func saveImage() {
        guard let image = BadgeShareService.makeShareImage(
            definition: definition,
            userBadge: userBadge,
            currentStreak: currentStreak
        ) else { return }

        Task {
            let saved = await BadgeShareService.saveToPhotoLibrary(image: image)
            showSavedAlert = saved
        }
    }
}

private struct InfoRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack(alignment: .top) {
            Text(title)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .multilineTextAlignment(.trailing)
        }
        .font(.subheadline)
    }
}
