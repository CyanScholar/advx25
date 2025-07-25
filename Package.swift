// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "interaction",
    platforms: [
        .macOS(.v10_15), .linux
    ],
    products: [
        .executable(name: "interaction-test", targets: ["interaction"])
    ],
    dependencies: [
        // 无外部依赖
    ],
    targets: [
        .executableTarget(
            name: "interaction",
            path: "Sources",
            exclude: [],
            resources: []
        )
    ]
) 