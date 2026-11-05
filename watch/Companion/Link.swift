import SwiftUI
import WatchConnectivity

struct Routine: Decodable, Identifiable { let day: Int; let name: String; let count: Int; var id: Int { day } }
struct Movement: Decodable { let id, name, metric: String; let number, reps: Int; let kg: Double; let bodyweight: Bool }
struct Training: Decodable { let id, name: String; let started, restUntil: Double; let done, total: Int; let next: Movement? }
struct Habit: Decodable, Identifiable { let category, id, name: String; let done: Bool }
struct Practice: Decodable, Identifiable { let id, title, guide: String; let minutes: Int }
struct Totals: Decodable { let sets, sessions, minutes: Int }
struct Snapshot: Decodable { let grant, today: String; let days: [Routine]; let active: Training?; let habits: [Habit]; let practices: [Practice]; let progress: Totals }
struct SleepNight: Decodable { let date, sourceName: String; let minutes: Int }
struct Tone: Decodable, Identifiable { let id, name: String }
struct WakeInfo: Decodable { let tones: [Tone]; let hour, minute: Int; let sound, mode: String; let at: Double?; let scheduledID: String? }
struct PracticeRun: Codable { let id, grant, practice: String; let start: Double }

final class WatchLink: NSObject, ObservableObject, WCSessionDelegate {
    @Published private(set) var state: Snapshot?
    @Published private(set) var nights: [SleepNight]?
    @Published private(set) var wake: WakeInfo?
    @Published private(set) var busy = false
    @Published var notice: String?
    @Published var status = "Connecting to iPhone…"
    @Published var run: PracticeRun? {
        didSet { if let value = run { UserDefaults.standard.set(try? JSONEncoder().encode(value), forKey: "practiceTimer") } else { UserDefaults.standard.removeObject(forKey: "practiceTimer") } }
    }
    private var revision = 0, visible = true, refreshAfterReply = false
    override init() {
        super.init()
        if let data = UserDefaults.standard.data(forKey: "practiceTimer") { run = try? JSONDecoder().decode(PracticeRun.self, from: data) }
        if WCSession.isSupported() { WCSession.default.delegate = self; WCSession.default.activate() }
    }
    func deactivate() { visible = false; revision += 1; busy = false; clear(); refreshAfterReply = false }
    func activate() { visible = true; refresh() }
    private func clear() { state = nil; nights = nil; wake = nil }
    func refresh() {
        guard visible else { return }
        if busy { refreshAfterReply = true; return }
        send("refresh")
    }
    func send(_ kind: String, _ fields: [String: Any] = [:], success: (() -> Void)? = nil) {
        guard visible, !busy else { return }
        let session = WCSession.default
        guard session.activationState == .activated, session.isReachable else { clear(); status = "Open Treksor on your paired iPhone, then refresh."; return }
        var command = fields; command["kind"] = kind
        if kind != "refresh" { guard let grant = state?.grant else { return }; command["grant"] = grant }
        guard let data = try? JSONSerialization.data(withJSONObject: command), let json = String(data: data, encoding: .utf8) else { return }
        busy = true; revision += 1; let request = revision
        session.sendMessage(["json": json], replyHandler: { answer in
            DispatchQueue.main.async {
                guard request == self.revision else { return }
                self.busy = false
                do {
                    guard let raw = (answer["json"] as? String)?.data(using: .utf8), let response = try JSONSerialization.jsonObject(with: raw) as? [String: Any] else { throw CocoaError(.coderReadCorrupt) }
                    if response["locked"] as? Bool == true { self.clear(); self.run = nil; self.status = "Enable watch sharing in Progress → Your connected life on iPhone." }
                    else if let message = response["error"] as? String { self.status = message; self.notice = message }
                    else {
                        if kind == "sleep" { self.nights = try JSONDecoder().decode([String:[SleepNight]].self, from: raw)["sleep"] }
                        else if kind == "wakeInfo" || kind == "scheduleWake" { self.wake = try JSONDecoder().decode([String:WakeInfo].self, from: raw)["wake"] }
                        else {
                            let next = try JSONDecoder().decode(Snapshot.self, from: raw)
                            if self.state?.grant != next.grant { self.nights = nil; self.wake = nil }
                            if let run = self.run, run.grant != next.grant || Date().timeIntervalSince1970-run.start>86400 { self.run = nil }
                            self.state = next
                        }
                        self.status = "Synced with iPhone"; success?()
                    }
                } catch { self.clear(); self.status = "Update Treksor on both devices, then refresh." }
                if self.refreshAfterReply { self.refreshAfterReply = false; self.refresh() }
            }
        }, errorHandler: { _ in DispatchQueue.main.async {
            guard request == self.revision else { return }; self.busy = false; self.clear(); self.status = "Connection interrupted. Refresh to check what was saved."
        }})
    }
    func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) { DispatchQueue.main.async { self.refresh() } }
    func sessionReachabilityDidChange(_ session: WCSession) { DispatchQueue.main.async {
        if !session.isReachable { self.revision += 1; self.busy = false; self.clear(); self.status = "Reconnect to your paired iPhone to continue." } else { self.refresh() }
    } }
    func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) { DispatchQueue.main.async { self.refresh() } }
}
