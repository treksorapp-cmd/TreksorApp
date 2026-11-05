import Foundation
import SwiftUI

struct DailyThought: Codable {
    let thought, date: String
    enum CodingKeys:String,CodingKey { case thought, date }
    var formattedDate: String {
        let parser = DateFormatter(); parser.locale = Locale(identifier:"en_US_POSIX"); parser.timeZone = TimeZone(secondsFromGMT:0); parser.dateFormat = "yyyy-MM-dd"
        guard let day = parser.date(from:date) else {return date}; parser.dateFormat = "MMM d"; return parser.string(from:day)
    }
}
@MainActor final class ThoughtFeed: ObservableObject {
    @Published private(set) var thought: DailyThought?
    @Published private(set) var message = "Loading the latest Power Thought…"
    @Published private(set) var offline = false
    private let cacheKey = "treksor.published-thought.v1"
    private var request = 0
    init() { if let data = UserDefaults.standard.data(forKey:cacheKey) { thought = try? JSONDecoder().decode(DailyThought.self,from:data) } }
    func load() async {
        request += 1; let id = request
        guard let url = URL(string:"https://treksor-admin-production.up.railway.app/api/public/content?type=thoughts") else {return}
        do {
            let (data,response) = try await URLSession.shared.data(for:URLRequest(url:url,cachePolicy:.reloadIgnoringLocalCacheData,timeoutInterval:12))
            guard (response as? HTTPURLResponse)?.statusCode == 200 else {throw URLError(.badServerResponse)}
            struct Feed:Decodable { let data:[DailyThought]; let publicationDate:String }
            let feed = try JSONDecoder().decode(Feed.self,from:data)
            let latest = feed.data.first { !$0.thought.trimmingCharacters(in:.whitespacesAndNewlines).isEmpty && $0.date <= feed.publicationDate }
            guard id==request else {return}; thought=latest; offline=false
            if let latest { UserDefaults.standard.set(try JSONEncoder().encode(latest),forKey:cacheKey) } else {UserDefaults.standard.removeObject(forKey:cacheKey)}
            message="Your next Power Thought will appear here when published."
        } catch {
            guard id==request else{return}; offline=true; message="Connect to refresh your Power Thought."
        }
    }
}
