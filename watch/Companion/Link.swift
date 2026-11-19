import SwiftUI
import WatchConnectivity

struct ProgressTotals: Decodable { let sessions, sets, minutes: Int }
private struct ProgressReply: Decodable { let progress: ProgressTotals?; let locked: Bool?; let error: String? }

final class WatchLink: NSObject, ObservableObject, WCSessionDelegate {
    @Published private(set) var totals: ProgressTotals?
    @Published private(set) var message = "Open Treksor on your paired iPhone to see progress."
    @Published private(set) var loading = false
    @Published private(set) var workout: WatchWorkout?
    @Published private(set) var workoutLoading = false
    @Published private(set) var workoutSaving = false
    @Published private(set) var workoutMessage = "Start a gym session on your iPhone."
    @Published private(set) var workoutRevision = 0
    private var workoutActive = false
    private var workoutRequest = 0
    private var videoRequest = 0
    private var active = false
    private var revision = 0
    override init() {
        super.init()
        if WCSession.isSupported() { WCSession.default.delegate = self; WCSession.default.activate() }
    }
    func open() { active = true; refresh() }
    func close() { active = false; clear(); closeWorkout() }
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
    func openWorkout() { workoutActive = true; refreshWorkout() }
    func closeWorkout() {
        workoutActive = false
        workoutRequest += 1; videoRequest += 1
        workout = nil; workoutLoading = false; workoutSaving = false
        workoutRevision += 1
    }
    func refreshWorkout() {
        guard workoutActive else { return }
        let session = WCSession.default
        guard session.activationState == .activated && session.isReachable else {
            workoutRequest += 1; videoRequest += 1; workout = nil
            workoutLoading = false; workoutSaving = false
            workoutMessage = "Open Treksor on your paired iPhone."; workoutRevision += 1
            return
        }
        workoutRequest += 1; let request = workoutRequest
        workoutLoading = true
        session.sendMessage(["json":"{\"kind\":\"workout\"}"], replyHandler: { response in DispatchQueue.main.async {
            guard self.workoutActive, self.workoutRequest == request else {return}
            self.workoutLoading = false
            guard let data = (response["json"] as? String)?.data(using:.utf8),
                  let reply = try? JSONDecoder().decode(WatchWorkoutReply.self,from:data) else {
                self.workout = nil; self.workoutMessage = "Update Treksor on your iPhone and watch."
                self.workoutRevision += 1; return
            }
            self.workout = reply.workout
            self.workoutMessage = reply.locked == true
                ? "Enable watch workouts in Progress / Your connected life on iPhone."
                : reply.error ?? "Start your workout on iPhone, then refresh."
            self.workoutRevision += 1
        }}, errorHandler: {_ in DispatchQueue.main.async {
            guard self.workoutActive, self.workoutRequest == request else {return}
            self.workout = nil; self.workoutLoading = false
            self.workoutMessage = "Reconnect your iPhone to view your workout."
            self.workoutRevision += 1
        }})
    }
    func requestVideo(sessionId: String, exerciseId: String, completion: @escaping (URL?,String?) -> Void) {
        guard workoutActive, WCSession.default.isReachable else {
            completion(nil,"Open Treksor on your paired iPhone."); return
        }
        videoRequest += 1; let request = videoRequest
        let payload = ["kind":"workout_video","sessionId":sessionId,"exerciseId":exerciseId]
        guard let data = try? JSONSerialization.data(withJSONObject:payload),
              let json = String(data:data,encoding:.utf8) else {
            completion(nil,"Could not request video."); return
        }
        WCSession.default.sendMessage(["json":json],replyHandler: { response in DispatchQueue.main.async {
            guard self.workoutActive, self.videoRequest == request,
                  self.workout?.id == sessionId else {return}
            guard let raw = (response["json"] as? String)?.data(using:.utf8),
                  let value = try? JSONDecoder().decode(WatchVideoReply.self,from:raw) else {
                completion(nil,"Video unavailable.");return
            }
            if let text = value.videoUrl,let url = URL(string:text),
               url.scheme == "https",url.host == "niakfwerfqmrmhuypkpd.supabase.co",
               url.path.hasPrefix("/storage/v1/object/sign/treksor-media/") {
                completion(url,nil)
            } else {
                completion(nil,value.error ?? "Video unavailable.")
            }
        }},errorHandler: {_ in DispatchQueue.main.async {
            guard self.workoutActive,self.videoRequest == request else {return}
            completion(nil,"Reconnect your iPhone and retry.")
        }})
    }
    func saveGymSet(sessionId:String, exerciseId:String, setNumber:Int, kg:Double, reps:Int,
                    completion:@escaping (Bool,String?)->Void) {
        guard workoutActive,!workoutSaving,WCSession.default.isReachable else {
            completion(false,"Open Treksor on your iPhone.");return
        }
        let payload:[String:Any] = ["kind":"workout_set","sessionId":sessionId,"exerciseId":exerciseId,
                                    "setNumber":setNumber,"kg":kg,"reps":reps]
        guard let data=try? JSONSerialization.data(withJSONObject:payload),
              let json=String(data:data,encoding:.utf8) else {
            completion(false,"Could not save set.");return
        }
        workoutSaving = true
        WCSession.default.sendMessage(["json":json],replyHandler: { response in DispatchQueue.main.async {
            guard self.workoutActive else {return}
            self.workoutSaving = false
            let raw=(response["json"] as? String)?.data(using:.utf8)
            let reply=raw.flatMap { try? JSONDecoder().decode(WatchSaveReply.self,from:$0) }
            if reply?.saved == true { completion(true,nil);self.refreshWorkout() }
            else {completion(false,reply?.error ?? "Set could not be saved. Refresh your session.")}
        }},errorHandler: {_ in DispatchQueue.main.async {
            guard self.workoutActive else {return}
            self.workoutSaving=false
            completion(false,"Confirm your saved sets on iPhone, then retry.")
        }})
    }
    func session(_ session:WCSession, activationDidCompleteWith state:WCSessionActivationState, error:Error?) { DispatchQueue.main.async {self.refresh(); self.refreshWorkout()} }
    func sessionReachabilityDidChange(_ session:WCSession) {DispatchQueue.main.async {self.refresh();self.refreshWorkout()} }
    func session(_ session:WCSession, didReceiveApplicationContext context:[String:Any]) {DispatchQueue.main.async {self.refresh();self.refreshWorkout()} }
}
