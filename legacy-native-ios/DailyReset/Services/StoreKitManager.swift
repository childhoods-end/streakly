import Foundation
import Observation

@Observable
final class StoreKitManager {
    var isPremium = false
    var availablePlans: [String] = ["Monthly", "Yearly"]

    func loadProducts() async {
        availablePlans = ["Monthly", "Yearly"]
    }

    func purchaseMonthly() async {
        isPremium = true
    }

    func purchaseYearly() async {
        isPremium = true
    }

    func restorePurchases() async {
        isPremium = false
    }
}
