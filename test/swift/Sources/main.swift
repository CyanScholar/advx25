import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

// 获取命令行参数
let args = CommandLine.arguments

guard args.count >= 2 else {
    print("用法: main <接口类型> [端口] [其他参数]")
    print("接口类型: ocr | post | delete")
    exit(1)
}

let apiType = args[1]
let port = args.count > 2 ? args[2] : "9999"
let urlBase = "http://localhost:\(port)"

func postRequest(url: String, json: [String: Any]) {
    var request = URLRequest(url: URL(string: url)!)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    let data = try! JSONSerialization.data(withJSONObject: json)
    let task = URLSession.shared.uploadTask(with: request, from: data) { data, response, error in
        guard let data = data, error == nil else {
            print("Error: \(error!)")
            exit(1)
        }
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            print("返回：", json)
        } else {
            print("返回内容：", String(data: data, encoding: .utf8) ?? "无")
        }
        exit(0)
    }
    task.resume()
    RunLoop.main.run()
}

switch apiType {
case "ocr":
    // OCR 图片上传测试（保持原有逻辑）
    let imagePath = args.count > 3 ? args[3] : "../test-images/sample.png"
    let url = URL(string: "\(urlBase)/ocr")!
    let boundary = "Boundary-\(UUID().uuidString)"
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
    var body = Data()
    let filename = (imagePath as NSString).lastPathComponent
    let mimetype = "image/jpeg"
    let fileData = try! Data(contentsOf: URL(fileURLWithPath: imagePath))
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
    body.append("Content-Type: \(mimetype)\r\n\r\n".data(using: .utf8)!)
    body.append(fileData)
    body.append("\r\n".data(using: .utf8)!)
    body.append("--\(boundary)--\r\n".data(using: .utf8)!)
    let task = URLSession.shared.uploadTask(with: request, from: body) { data, response, error in
        guard let data = data, error == nil else {
            print("Error: \(error!)")
            exit(1)
        }
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            print("OCR结果：", json["text"] ?? "无")
        } else {
            print("返回内容：", String(data: data, encoding: .utf8) ?? "无")
        }
        exit(0)
    }
    task.resume()
    RunLoop.main.run()
case "post", "delete":
    // 从标准输入读取 JSON 数据
    let stdin = FileHandle.standardInput
    let inputData = stdin.availableData
    guard let inputString = String(data: inputData, encoding: .utf8),
          let jsonData = inputString.data(using: .utf8),
          let jsonObj = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
        print("输入数据不是有效的 JSON")
        exit(1)
    }
    let url = "\(urlBase)/\(apiType)"
    postRequest(url: url, json: jsonObj)
default:
    print("未知接口类型: \(apiType)")
    exit(1)
}