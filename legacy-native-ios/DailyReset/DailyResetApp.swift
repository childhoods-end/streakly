import SwiftData
import SwiftUI

@main
struct DailyResetApp: App {
    @State private var storeKitManager = StoreKitManager()
    let modelContainer: ModelContainer

    init() {
        do {
            let schema = Schema([
                Habit.self,
                CheckIn.self,
                BadgeDefinition.self,
                UserBadge.self,
                PaywallEvent.self
            ])
            let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
            modelContainer = try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Could not initialize SwiftData: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(storeKitManager)
        }
        .modelContainer(modelContainer)
    }
}

private struct RootView: View {
    @AppStorage("onboardingCompleted") private var onboardingCompleted = false
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \BadgeDefinition.code) private var badgeDefinitions: [BadgeDefinition]

    var body: some View {
        Group {
            if onboardingCompleted {
                MainTabView()
            } else {
                OnboardingView()
            }
        }
        .task {
            await BadgeSeedService.seedIfNeeded(existingDefinitions: badgeDefinitions, context: modelContext)
        }
    }
}
