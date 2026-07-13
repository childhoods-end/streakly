import SwiftData
import SwiftUI

struct PaywallView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(StoreKitManager.self) private var storeKitManager
    var onContinue: (() -> Void)?

    private let benefits = [
        "Unlimited habits",
        "Advanced insights",
        "Custom themes",
        "Widgets",
        "Cloud sync",
        "Premium achievement cards"
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Daily Reset Plus")
                            .font(.largeTitle.bold())
                        Text("Build deeper streaks with more room to grow.")
                            .foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        ForEach(benefits, id: \.self) { benefit in
                            Label(benefit, systemImage: "checkmark.circle.fill")
                                .foregroundStyle(.primary)
                        }
                    }
                    .padding()
                    .background(.background, in: RoundedRectangle(cornerRadius: 8))
                    .overlay {
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(.quaternary, lineWidth: 1)
                    }

                    HStack(spacing: 12) {
                        PlanCard(title: "Monthly", price: "$4.99", subtitle: "Flexible plan")
                        PlanCard(title: "Yearly", price: "$29.99", subtitle: "Best value")
                    }

                    VStack(spacing: 12) {
                        Button {
                            Task { await storeKitManager.purchaseMonthly() }
                        } label: {
                            Text("Start Monthly")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)

                        Button {
                            Task { await storeKitManager.purchaseYearly() }
                        } label: {
                            Text("Start Yearly")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)

                        Button("Continue Free") {
                            if let onContinue {
                                onContinue()
                            } else {
                                dismiss()
                            }
                        }
                        .foregroundStyle(.secondary)
                    }
                }
                .padding()
            }
            .navigationTitle("Upgrade")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
        .task {
            await storeKitManager.loadProducts()
        }
    }
}

private struct PlanCard: View {
    let title: String
    let price: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            Text(price)
                .font(.title2.bold())
            Text(subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(.quaternary, lineWidth: 1)
        }
    }
}
