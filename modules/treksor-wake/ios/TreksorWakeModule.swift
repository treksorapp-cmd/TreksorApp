import ExpoModulesCore
import SwiftUI
import ActivityKit
#if canImport(AlarmKit)
import AlarmKit
@available(iOS 26.0, *)
private struct WakeMetadata: AlarmMetadata {}
#endif

public class TreksorWakeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TreksorWake")
    Function("isAvailable") { () -> Bool in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) { return true }
      #endif
      return false
    }
    AsyncFunction("schedule") { (id: String, timestamp: Double, sound: String) async throws -> String in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        guard let uuid = UUID(uuidString: id), timestamp > Date().timeIntervalSince1970 * 1000,
              sound.range(of: "^wake_[0-9]{2}\\.wav$", options: .regularExpression) != nil,
              Bundle.main.url(forResource: sound.replacingOccurrences(of: ".wav", with: ""), withExtension: "wav") != nil else {
          throw NSError(domain: "TreksorWake", code: 2, userInfo: [NSLocalizedDescriptionKey:"Choose a future time and an installed wake sound."])
        }
        let manager = AlarmManager.shared
        let permission = try await manager.requestAuthorization()
        guard permission == .authorized else { throw NSError(domain:"TreksorWake",code:3,userInfo:[NSLocalizedDescriptionKey:"Allow alarms in Settings before scheduling."]) }
        let alert = AlarmPresentation.Alert(title: "Wake gently", stopButton: AlarmButton(text: "Stop", textColor: .white, systemImageName: "stop.circle"))
        let attributes = AlarmAttributes(presentation: AlarmPresentation(alert: alert), metadata: WakeMetadata(), tintColor: Color(red:0.84,green:0.72,blue:0.47))
        let config = AlarmManager.AlarmConfiguration<WakeMetadata>.alarm(schedule: .fixed(Date(timeIntervalSince1970:timestamp/1000)), attributes: attributes, stopIntent: nil, secondaryIntent: nil, sound: .named(sound))
        _ = try await manager.schedule(id: uuid, configuration: config)
        return id
      }
      #endif
      throw NSError(domain:"TreksorWake",code:1,userInfo:[NSLocalizedDescriptionKey:"System wake alarms require iOS 26 or later."])
    }
    AsyncFunction("cancel") { (id: String) throws in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *), let uuid = UUID(uuidString:id) { try AlarmManager.shared.cancel(id:uuid) }
      #endif
    }
    AsyncFunction("alertingIds") { () throws -> [String] in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) { return try AlarmManager.shared.alarms.filter { $0.state == .alerting }.map { $0.id.uuidString.lowercased() } }
      #endif
      return []
    }
    AsyncFunction("scheduledIds") { () throws -> [String] in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) { return try AlarmManager.shared.alarms.map { $0.id.uuidString.lowercased() } }
      #endif
      return []
    }
  }
}
