import Photos
import SwiftUI
import UIKit

@MainActor
enum BadgeShareService {
    static func renderBadgeCard(
        definition: BadgeDefinition,
        userBadge: UserBadge?,
        currentStreak: Int
    ) -> UIImage? {
        let renderer = ImageRenderer(
            content: BadgeShareCard(
                definition: definition,
                userBadge: userBadge,
                currentStreak: currentStreak
            )
            .frame(width: 360, height: 450)
        )
        renderer.scale = 3
        return renderer.uiImage
    }

    static func makeShareImage(
        definition: BadgeDefinition,
        userBadge: UserBadge?,
        currentStreak: Int
    ) -> UIImage? {
        renderBadgeCard(definition: definition, userBadge: userBadge, currentStreak: currentStreak)
    }

    static func saveToPhotoLibrary(image: UIImage) async -> Bool {
        let status = PHPhotoLibrary.authorizationStatus(for: .addOnly)
        let finalStatus: PHAuthorizationStatus

        if status == .notDetermined {
            finalStatus = await PHPhotoLibrary.requestAuthorization(for: .addOnly)
        } else {
            finalStatus = status
        }

        guard finalStatus == .authorized || finalStatus == .limited else { return false }

        return await withCheckedContinuation { continuation in
            PHPhotoLibrary.shared().performChanges {
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            } completionHandler: { success, _ in
                continuation.resume(returning: success)
            }
        }
    }
}
