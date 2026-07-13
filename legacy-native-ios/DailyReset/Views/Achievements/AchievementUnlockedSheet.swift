import SwiftData
import SwiftUI
import UIKit

struct AchievementUnlockedSheet: View {
    let definition: BadgeDefinition
    let userBadge: UserBadge
    let currentStreak: Int

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @State private var animate = false
    @State private var shareImage: UIImage?
    @State private var showShare = false
    @State private var showSavedAlert = false

    var body: some View {
        VStack(spacing: 22) {
            Text("Achievement Unlocked")
                .font(.title.bold())

            Image(systemName: definition.iconName)
                .font(.system(size: 62, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 132, height: 132)
                .background(definition.badgeLevel.gradient, in: Circle())
                .scaleEffect(animate ? 1 : 0.82)
                .opacity(animate ? 1 : 0)

            VStack(spacing: 8) {
                Text(definition.title)
                    .font(.title2.bold())
                Text(definition.subtitle)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                Text(definition.badgeLevel.displayName)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(definition.badgeLevel.color)
            }

            HStack(spacing: 12) {
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
                    Label("Save", systemImage: "square.and.arrow.down")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }

            Button("Done") {
                dismiss()
            }
            .buttonStyle(.plain)
            .foregroundStyle(.secondary)
        }
        .padding(24)
        .presentationDetents([.medium])
        .onAppear {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            withAnimation(.spring(response: 0.45, dampingFraction: 0.72)) {
                animate = true
            }
        }
        .sheet(isPresented: $showShare) {
            if let shareImage {
                ActivityView(activityItems: [shareImage])
            }
        }
        .alert("Saved to Photos", isPresented: $showSavedAlert) {
            Button("OK", role: .cancel) {}
        }
    }

    private func prepareShare() {
        shareImage = BadgeShareService.makeShareImage(
            definition: definition,
            userBadge: userBadge,
            currentStreak: currentStreak
        )
        userBadge.shareCount += 1
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
