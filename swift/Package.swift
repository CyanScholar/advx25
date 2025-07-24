// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "swift",
    targets: [
        .executableTarget(
            name: "swift",
            path: "Sources"
        )
    ]
)
