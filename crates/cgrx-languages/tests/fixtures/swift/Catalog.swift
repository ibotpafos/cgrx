import Foundation

public struct PluginVersion: Comparable, Hashable {
    public let major: Int
    public init?(_ value: String) {
        guard let major = Int(value) else { return nil }
        self.major = major
    }
    public static func < (lhs: Self, rhs: Self) -> Bool { lhs.major < rhs.major }
    public static func == (lhs: Self, rhs: Self) -> Bool { lhs.major == rhs.major }
    public func hash(into hasher: inout Hasher) { hasher.combine(major) }
}

public enum PluginFormat: String {
    case au, vst3
    public var displayName: String { rawValue.uppercased() }
}

public struct PluginCatalog {
    public var version: PluginVersion
    public static func load(from url: URL) throws -> Self {
        let data = try Data(contentsOf: url)
        return Self(version: PluginVersion(String(decoding: data, as: UTF8.self))!)
    }
    public func mergingCached(_ cached: Self) -> Self { cached }
}

public extension PluginCatalog {
    func title(prefix: String) -> String { prefix }
    func title(count: Int) -> String { String(count) }
}

typealias Catalog = PluginCatalog

public struct ReleaseChannelService {
    public struct ChannelRelease { public var assets: [ChannelAsset] }
    public struct ChannelAsset { public var url: URL }
    public static func verify(metadata: Data, catalogue data: Data,
                              channel: String, expected: PluginCatalog) throws {}
    private func read(from url: URL) async throws -> Data { try Data(contentsOf: url) }
}
