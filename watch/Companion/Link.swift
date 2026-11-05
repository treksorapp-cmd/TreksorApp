import SwiftUI
import WatchConnectivity

struct ProgressTotals: Decodable { let sessions, sets, minutes: Int }
private struct ProgressReply: Decodable { let progress: ProgressTotals?; let locked: Bool?; let error: String? }

final class WatchLink: NSObject, ObservableObject, WCSessionDelegate {
    @Published private(set) var totals: ProgressTotals?
    @Published private(set) var message = "Open Treksor on your paired iPhone to see progress."
    @Published private(set) var loading = false
    private var active = false
    private var revision = 0
    override init() {
        super.init()
        if WCSession.isSupported() { WCSession.default.delegate = self; WCSession.default.activate() }
    }
    func open() { active = true; refresh() }
    func close() { active = false; clear() }
    private func clear() { revision += 1; totals = nil; loading = false }
    func refresh() {
        guard active else { return }
        let session = WCSession.default
        guard session.activationState == .activated && session.isReachable else {
            clear(); message = "Open Treksor on your paired iPhone, then refresh."; return
        }
        revision += 1; let request = revision; loading = true
        session.sendMessage(["json":"{\"kind\":\"progress\"}"], replyHandler: { answer in DispatchQueue.main.async {
            guard self.active, self.revision == request else {return}
            self.loading = false
            guard let data = (answer["json"] as? String)?.data(using:.utf8), let reply = try? JSONDecoder().decode(ProgressReply.self,from:data) else {
                self.totals = nil; self.message = "Update Treksor on your iPhone and watch."; return
            }
            self.totals = reply.progress
            self.message = reply.locked == true ? "On iPhone, open Progress, then Your connected life, and enable watch progress." : reply.error ?? "From your saved Treksor activity."
        } }, errorHandler: { _ in DispatchQueue.main.async {
            guard self.revision == request else {return}; self.clear(); self.message = "Reconnect to your iPhone to see progress."
        } })
    }
    func session(_ session:WCSession, activationDidCompleteWith state:WCSessionActivationState, error:Error?) { DispatchQueue.main.async {self.refresh()} }
    func sessionReachabilityDidChange(_ session:WCSession) {DispatchQueue.main.async {self.refresh()} }
    func session(_ session:WCSession, didReceiveApplicationContext context:[String:Any]) {DispatchQueue.main.async {self.refresh()} }
}
