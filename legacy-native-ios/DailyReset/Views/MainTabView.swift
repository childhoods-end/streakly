import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            TodayView()
                .tabItem {
                    Label("Today", systemImage: "sun.max")
                }

            ProgressView()
                .tabItem {
                    Label("Progress", systemImage: "chart.bar")
                }

            HabitsView()
                .tabItem {
                    Label("Habits", systemImage: "list.bullet")
                }

            AchievementsView()
                .tabItem {
                    Label("Achievements", systemImage: "rosette")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
    }
}
