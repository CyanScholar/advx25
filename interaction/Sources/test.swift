import Interact
import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

// 示例：调用 /ocr 接口
let imageDir = "test/images"
let topic = "焦虑"
let type = "thought"
let fm = FileManager.default
let imageFiles = try! fm.contentsOfDirectory(atPath: imageDir).filter { $0.hasSuffix(".png") || $0.hasSuffix(".jpg") || $0.hasSuffix(".jpeg") }
for img in imageFiles {
    let imgPath = "\(imageDir)/\(img)"
    let imgData = try! Data(contentsOf: URL(fileURLWithPath: imgPath))
    ocrAPI(imageData: imgData, type: type, topicName: topic) { result in
        print("OCR \(img):", result)
    }
}

// 示例：删除节点1,2,3
for id in 1...3 {
    sendAPIRequest(endpoint: "delete", params: ["id": wrapAnyEncodable(id)]) { result in
        print("DELETE id \(id):", result)
    }
}

// 示例：调用 /post 接口，上传整个测试文件
let testDataPath = "test/test_data.text"
let lines = try! String(contentsOfFile: testDataPath).split(separator: "\n")
for line in lines {
    guard let jsonData = line.data(using: .utf8),
          let dict = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else { continue }
    let params = dict.mapValues { wrapAnyEncodable($0) }
    sendAPIRequest(endpoint: "post", params: params) { result in
        print("POST:", result)
    }
}

// 清空数据库
sendAPIRequest(endpoint: "clear", params: [:]) { result in
    print("清空数据库:", result)
}

// 归档
sendAPIRequest(endpoint: "auto_eliminate", params: ["value": wrapAnyEncodable(true)]) { result in
    print("auto_eliminate set:", result)
}
for id in 1...9 {
    sendAPIRequest(endpoint: "archive", params: ["id": wrapAnyEncodable(id)]) { result in
        print("ARCHIVE id \(id):", result)
    }
}

// 示例：连接节点1和2,3，类型thought
connectAPI(nodeID: 1, connectIDs: [2,3], nodeType: "thought") { result in
    print("CONNECT:", result)
}


// 保证 Playground/命令行程序不立即退出
RunLoop.main.run()
