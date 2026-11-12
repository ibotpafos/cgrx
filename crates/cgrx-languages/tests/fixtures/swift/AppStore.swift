import Foundation
import SwiftUI

struct PluginProduct { let id: String }

@MainActor
final class AppStore: ObservableObject {
    @Published var products: [PluginProduct] = []
    @Published private(set) var isInstalling = false
    init() {}
    deinit {}
    func refresh() async throws {
        let ids = products.map { $0.id }
        isInstalling = !ids.isEmpty
    }
    @discardableResult
    private func performInstall(_ product: PluginProduct, localSource: URL?) async -> Bool {
        isInstalling = true
        return localSource != nil
    }
    subscript(index: Int) -> PluginProduct { products[index] }
}

extension AppStore {
    var title: String { "Plugins" }
    func install(_ product: PluginProduct) async {
        await performInstall(product, localSource: nil)
    }
}

struct CatalogView: View {
    @ObservedObject var store: AppStore
    var body: some View {
        List(store.products, id: \.id) { product in Text(product.id) }
    }
}

actor CatalogCache {
    var latest: PluginProduct?
    func store(_ product: PluginProduct) async throws { latest = product }
}
