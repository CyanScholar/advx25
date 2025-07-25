import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif


// /upload
public struct UploadResponse: Codable {
    public let msg: String
    public let filename: String
}

// /ocr
public struct OCRResponse: Codable {
    public let text: String?
    public let id: Int?
    public let topic_name: String?
    public let error: String?
}

// /post
public struct PostRequest: Codable {
    public let type: String?         // "thought" 或 "solution"
    public let content: String
    public let parent: String?       // 可为 name 或 id
    public let topic_name: String?
    public let connect: [String]?    // 可为 name 或 id
    public let create_time: String?  // ISO8601
}
public struct PostResponse: Codable {
    public let id: Int
    public let content: String
    public let type: String
    public let parent: Int?
    public let topic_name: String?
    public let connect: String?      // JSON字符串
    public let create_time: String
}

// /connect & /disconnect
public struct ConnectRequest: Codable {
    public let node_id: Int
    public let connect_ids: [Int]
    public let node_type: String     // "thought" 或 "solution"
}
public struct ConnectResponse: Codable {
    public let msg: String
    public let node: Int
}

// /auto_eliminate
public struct AutoEliminateRequest: Codable {
    public let value: Bool
}
public struct AutoEliminateResponse: Codable {
    public let code: Int
    public let msg: String
    public let data: AutoEliminateData
}
public struct AutoEliminateData: Codable {
    public let auto_eliminate: Bool
}

// /clear
public struct ClearResponse: Codable {
    public let msg: String
}

// /delete
public struct DeleteRequest: Codable {
    public let id: Int?
    public let content: String?
}
public struct DeleteResponse: Codable {
    public let code: Int
    public let msg: String
    public let data: DeleteData
}
public struct DeleteData: Codable {
    public let deleted: [DeletedNode]?
}
public struct DeletedNode: Codable {
    public let id: Int
    public let content: String
}

// /archive
public struct ArchiveRequest: Codable {
    public let id: Int?
    public let content: String?
}
public struct ArchiveResponse: Codable {
    public let code: Int
    public let msg: String
    public let data: ArchiveData
}
public struct ArchiveData: Codable {
    public let id: Int?
    public let deleted: [DeletedNode]?
}

// /agent/guide & /agent/solve
public struct AgentRequest: Codable {
    public let topic_name: String
    public let user_id: String
    public let user_history: [String]
}
public struct AgentResponse: Codable {
    public let reply: String
}
