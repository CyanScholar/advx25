import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

public let serverBaseURL = "http://localhost:9999"

// MARK: - AnyEncodable/AnyDecodable for dynamic JSON
public struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void
    public init<T: Encodable>(_ value: T) {
        _encode = value.encode
    }
    public func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
    // 新增静态方法，专门处理 [AnyEncodable] 和 [String: AnyEncodable]
    public init(_ value: [AnyEncodable]) {
        _encode = { encoder in
            var container = encoder.unkeyedContainer()
            for v in value {
                try container.encode(v)
            }
        }
    }
    public init(_ value: [String: AnyEncodable]) {
        _encode = { encoder in
            var container = encoder.container(keyedBy: AnyCodingKey.self)
            for (k, v) in value {
                try container.encode(v, forKey: AnyCodingKey(stringValue: k)!)
            }
        }
    }
}

public struct AnyDecodable: Decodable {
    public let value: Any
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let intVal = try? container.decode(Int.self) {
            value = intVal
        } else if let strVal = try? container.decode(String.self) {
            value = strVal
        } else if let boolVal = try? container.decode(Bool.self) {
            value = boolVal
        } else if let doubleVal = try? container.decode(Double.self) {
            value = doubleVal
        } else if let dictVal = try? container.decode([String: AnyDecodable].self) {
            value = dictVal.mapValues { $0.value }
        } else if let arrVal = try? container.decode([AnyDecodable].self) {
            value = arrVal.map { $0.value }
        } else {
            value = ()
        }
    }
}

// MARK: - 通用 APIRequest/APIResponse
public struct APIRequest: Encodable {
    public let params: [String: AnyEncodable]
    public init(_ params: [String: AnyEncodable]) {
        self.params = params
    }
    public func encode(to encoder: Encoder) throws {
        try params.encode(to: encoder)
    }
}

public struct APIResponse: Decodable {
    public let data: [String: Any]
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let dict = try container.decode([String: AnyDecodable].self)
        self.data = dict.mapValues { $0.value }
    }
}

// MARK: - 通用请求函数
public func sendAPIRequest(
    endpoint: String,
    params: [String: AnyEncodable],
    completion: @escaping (Result<APIResponse, Error>) -> Void
) {
    let req = APIRequest(params)
    guard let body = try? JSONEncoder().encode(req) else {
        completion(.failure(NSError(domain: "编码失败", code: -4)))
        return
    }
    sendRequest(url: "\(serverBaseURL)/\(endpoint)", body: body, completion: completion)
}

// MARK: - 通用网络请求工具
public func sendRequest<T: Decodable>(url: String, method: String = "POST", body: Data? = nil, contentType: String = "application/json", completion: @escaping (Result<T, Error>) -> Void) {
    guard let url = URL(string: url) else {
        completion(.failure(NSError(domain: "Invalid URL", code: -1)))
        return
    }
    var request = URLRequest(url: url)
    request.httpMethod = method
    request.setValue(contentType, forHTTPHeaderField: "Content-Type")
    request.httpBody = body
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }
        guard let data = data else {
            completion(.failure(NSError(domain: "No data", code: -2)))
            return
        }
        do {
            let decoded = try JSONDecoder().decode(T.self, from: data)
            completion(.success(decoded))
        } catch {
            completion(.failure(error))
        }
    }
    task.resume()
}

// MARK: - 图片上传专用（/ocr）
public struct OCRResponse: Decodable {
    public let text: String?
    public let id: Int?
    public let topic_name: String?
    public let error: String?
}

public func ocrAPI(imageData: Data, type: String, topicName: String?, completion: @escaping (Result<OCRResponse, Error>) -> Void) {
    guard type == "thought" || type == "solution" else {
        completion(.failure(NSError(domain: "type 必须为 thought 或 solution", code: -3)))
        return
    }
    let boundary = UUID().uuidString
    var body = Data()
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"file\"; filename=\"image.png\"\r\n".data(using: .utf8)!)
    body.append("Content-Type: application/octet-stream\r\n\r\n".data(using: .utf8)!)
    body.append(imageData)
    body.append("\r\n".data(using: .utf8)!)
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"type\"\r\n\r\n".data(using: .utf8)!)
    body.append(type.data(using: .utf8)!)
    body.append("\r\n".data(using: .utf8)!)
    if let topicName = topicName {
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"topic_name\"\r\n\r\n".data(using: .utf8)!)
        body.append(topicName.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
    }
    body.append("--\(boundary)--\r\n".data(using: .utf8)!)
    let url = "\(serverBaseURL)/ocr"
    var request = URLRequest(url: URL(string: url)!)
    request.httpMethod = "POST"
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
    request.httpBody = body
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }
        guard let data = data else {
            completion(.failure(NSError(domain: "No data", code: -2)))
            return
        }
        do {
            let decoded = try JSONDecoder().decode(OCRResponse.self, from: data)
            completion(.success(decoded))
        } catch {
            completion(.failure(error))
        }
    }
    task.resume()
}

public func wrapAnyEncodable(_ value: Any) -> AnyEncodable {
    switch value {
    case let v as Int: return AnyEncodable(v)
    case let v as String: return AnyEncodable(v)
    case let v as Double: return AnyEncodable(v)
    case let v as Bool: return AnyEncodable(v)
    case let v as [Any]: return AnyEncodable(v.map { wrapAnyEncodable($0) })
    case let v as [String: Any]: return AnyEncodable(v.mapValues { wrapAnyEncodable($0) })
    case let v as [AnyEncodable]: return AnyEncodable(v)
    case let v as [String: AnyEncodable]: return AnyEncodable(v)
    case is NSNull: return AnyEncodable(Optional<String>.none as String?)
    default: return AnyEncodable("\(value)")
    }
}

public func toEncodableDict(_ dict: [String: Any]) -> [String: AnyEncodable] {
    var result: [String: AnyEncodable] = [:]
    for (k, v) in dict {
        if v is NSNull {
            // 跳过 null
        } else {
            result[k] = wrapAnyEncodable(v)
        }
    }
    return result
}

// 兼容 AnyEncodable 只接受 Encodable 的问题
struct AnyEncodableBox: Encodable {
    let base: Encodable
    init(_ base: Encodable) { self.base = base }
    func encode(to encoder: Encoder) throws {
        try base.encode(to: encoder)
    }
}

// 辅助类型
struct AnyCodingKey: CodingKey {
    var stringValue: String
    var intValue: Int?
    init?(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) { self.intValue = intValue; self.stringValue = "\(intValue)" }
}

// 新增专用 connectAPI
public func connectAPI(nodeID: Int, connectIDs: [Int], nodeType: String, completion: @escaping (Result<APIResponse, Error>) -> Void) {
    let url = "\(serverBaseURL)/connect?node_id=\(nodeID)&node_type=\(nodeType)"
    let params = ["connect_ids": wrapAnyEncodable(connectIDs)]
    let req = APIRequest(params)
    guard let body = try? JSONEncoder().encode(req) else {
        completion(.failure(NSError(domain: "编码失败", code: -4)))
        return
    }
    sendRequest(url: url, body: body, completion: completion)
}
