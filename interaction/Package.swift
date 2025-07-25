// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "advx-interaction",
    products: [
        .library(name: "Interact", targets: ["Interact"]),
        .executable(name: "TestPort", targets: ["TestPort"])
    ],
    targets: [
        .target(
            name: "Interact",
            path: "Sources",
            sources: ["interact.swift"]
        ),
        .executableTarget(
            name: "TestPort",
            dependencies: ["Interact"],
            path: "Sources",
            sources: ["test.swift"]
        )
    ]
)
