// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "CoverageFixture", targets: [
    .target(name: "FixtureSupport", path: "Modules/FixtureSupport"),
    .target(name: "Corpus", dependencies: ["FixtureSupport"], path: "Sources/Corpus")
])
