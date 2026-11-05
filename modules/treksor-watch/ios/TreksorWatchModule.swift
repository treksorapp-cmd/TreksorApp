import ExpoModulesCore
import WatchConnectivity

// All reply handlers are owned by the main queue and completed at most once.
private final class PhoneSession: NSObject, WCSessionDelegate {
  var onRequest: ((String, String) -> Void)?
  private var waiting: [String: ([String: Any]) -> Void] = [:]

  func start() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }
  func invalidateView() {
    guard WCSession.isSupported(), WCSession.default.activationState == .activated,
          WCSession.default.isPaired, WCSession.default.isWatchAppInstalled else { return }
    // Only an invalidation signal is cached by WatchConnectivity. Personal data is sent by live request.
    try? WCSession.default.updateApplicationContext(["change": UUID().uuidString])
  }
  func reply(_ id: String, _ json: String) { waiting.removeValue(forKey: id)?(["json": json]) }
  func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
    DispatchQueue.main.async {
      guard let json = message["json"] as? String, json.utf8.count < 4096, let notify = self.onRequest else {
        replyHandler(["json": "{\"error\":\"Open Treksor on your iPhone and try again.\"}"]); return
      }
      let id = UUID().uuidString
      self.waiting[id] = replyHandler
      notify(id, json)
      DispatchQueue.main.asyncAfter(deadline: .now() + 8) { self.reply(id, "{\"error\":\"Open Treksor on your iPhone, then refresh.\"}") }
    }
  }
  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) { if state == .activated { invalidateView() } }
  func sessionDidBecomeInactive(_ session: WCSession) {}
  func sessionDidDeactivate(_ session: WCSession) { session.activate() }
}
public final class TreksorWatchModule: Module {
  private let bridge = PhoneSession()
  public func definition() -> ModuleDefinition {
    Name("TreksorWatch")
    Events("onWatchRequest")
    OnStartObserving {
      DispatchQueue.main.async {
        self.bridge.onRequest = { [weak self] id, json in self?.sendEvent("onWatchRequest", ["id": id, "json": json]) }
        self.bridge.start()
      }
    }
    OnStopObserving { DispatchQueue.main.async { self.bridge.onRequest = nil } }
    Function("reply") { (id: String, json: String) in DispatchQueue.main.async { self.bridge.reply(id, json) } }
    Function("changed") { DispatchQueue.main.async { self.bridge.invalidateView() } }
  }
}
