import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

let url = URL(string: "http://localhost:9999/ocr")!
let imagePath = "../test-images/sample.png"
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
        return
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