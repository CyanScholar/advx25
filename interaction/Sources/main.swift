// import Body
// import Interact
import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif



// MARK: - 工具函数
func wait(_ seconds: Double) {
    let sema = DispatchSemaphore(value: 0)
    DispatchQueue.global().asyncAfter(deadline: .now() + seconds) { sema.signal() }
    sema.wait()
}

// MARK: - 1. 清空数据库
func testClear() {
    let group = DispatchGroup()
    group.enter()
    APIServices.clear { result in
        print("[clear]", result)
        group.leave()
    }
    group.wait()
}

// MARK: - 2. OCR批量上传图片
func testOCR() {
    let imgDir = "../test/images"
    let fm = FileManager.default
    let files = (try? fm.contentsOfDirectory(atPath: imgDir)) ?? []
    for file in files where file.hasSuffix(".png") || file.hasSuffix(".jpg") || file.hasSuffix(".jpeg") {
        let filePath = imgDir + "/" + file
        let fileData = try! Data(contentsOf: URL(fileURLWithPath: filePath))
        APIServices.ocr(fileData: fileData, filename: file, type: "thought", topicName: "焦虑") { result in
            print(result)
        }
    }
}

// MARK: - 3. 批量POST测试数据
func testBatchPost() {
    let filePath = "../test/test_data.text"
    guard let lines = try? String(contentsOfFile: filePath).split(separator: "\n") else { return }
    for (idx, line) in lines.enumerated() {
        guard let data = line.data(using: .utf8),
              let req = try? JSONDecoder().decode(PostRequest.self, from: data) else { continue }
        let group = DispatchGroup()
        group.enter()
        APIServices.post(request: req) { result in
            print("[post]", idx+1, result)
            group.leave()
        }
        group.wait()
    }
}

// MARK: - 4. 批量归档 solution 节点
func testArchive() {
    let group = DispatchGroup()
    // 先设置自动消除开关
    group.enter()
    APIServices.autoEliminate(request: AutoEliminateRequest(value: true)) { result in
        print("[auto_eliminate]", result)
        group.leave()
    }
    group.wait()
    // 归档 id 1~9
    for id in 1...9 {
        group.enter()
        APIServices.archive(request: ArchiveRequest(id: id, content: nil)) { result in
            print("[archive]", id, result)
            group.leave()
        }
        group.wait()
    }
}

// MARK: - 5. 批量删除 thought 节点
func testDelete() {
    for id in 1...3 {
        let group = DispatchGroup()
        group.enter()
        APIServices.delete(request: DeleteRequest(id: id, content: nil)) { result in
            print("[delete]", id, result)
            group.leave()
        }
        group.wait()
    }
}

// MARK: - 6. connect 示例
func testConnect() {
    let group = DispatchGroup()
    group.enter()
    APIServices.connect(request: ConnectRequest(node_id: 1, connect_ids: [2,3], node_type: "thought")) { result in
        print("[connect]", result)
        group.leave()
    }
    group.wait()
}

// MARK: - 主流程
func main() {
    testClear()
    testOCR()
    testBatchPost()
    testArchive()
    testDelete()
    testConnect()
}

main()
