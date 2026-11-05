import ExpoModulesCore
import HealthKit

public class TreksorHealthModule: Module {
  private let health = HKHealthStore()

  public func definition() -> ModuleDefinition {
    Name("TreksorHealth")
    Function("isAvailable") { HKHealthStore.isHealthDataAvailable() }
    // A successful permission sheet does NOT establish read permission. Apple intentionally hides it.
    AsyncFunction("requestReadAccess") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.reject("HEALTH_UNAVAILABLE", "Apple Health is unavailable on this device."); return
      }
      self.health.requestAuthorization(toShare: [], read: [HKObjectType.workoutType()]) { success, error in
        if let error = error { promise.reject("HEALTH_PERMISSION", error.localizedDescription) }
        else if !success { promise.reject("HEALTH_PERMISSION", "The permission request was not completed.") }
        else { promise.resolve(true) }
      }
    }
    AsyncFunction("requestSleepAccess") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable(), let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
        promise.reject("HEALTH_UNAVAILABLE", "Sleep data is unavailable."); return
      }
      self.health.requestAuthorization(toShare: [], read: [sleep]) { success, error in
        if let error = error { promise.reject("HEALTH_PERMISSION", error.localizedDescription) }
        else if !success { promise.reject("HEALTH_PERMISSION", "The request was not completed.") }
        else { promise.resolve(true) }
      }
    }
    AsyncFunction("readSleep") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable(), let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
        promise.reject("HEALTH_UNAVAILABLE", "Sleep data is unavailable."); return
      }
      let end = Date()
      let start = Calendar.current.date(byAdding: .day, value: -31, to: end)!
      let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
      let query = HKSampleQuery(sampleType: sleep, predicate: predicate, limit: 30001,
                                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, error in
        if let error = error { promise.reject("HEALTH_READ", error.localizedDescription); return }
        guard let samples = samples as? [HKCategorySample] else { promise.resolve([]); return }
        if samples.count > 30000 { promise.reject("HEALTH_LIMIT", "Too many sleep samples. Your saved import has not changed."); return }
        let formatter = ISO8601DateFormatter()
        let rows: [[String: Any]] = samples.compactMap { sample in
          let source = sample.sourceRevision.source, bundle = sample.sourceRevision.source.bundleIdentifier.lowercased()
          guard bundle.hasPrefix("com.apple.") || bundle.hasPrefix("com.garmin.") else { return nil }
          return ["id": sample.uuid.uuidString.lowercased(), "sourceId": source.bundleIdentifier,
                  "sourceName": source.name, "device": sample.device?.model ?? "",
                  "start": formatter.string(from: sample.startDate), "end": formatter.string(from: sample.endDate),
                  "value": sample.value]
        }
        promise.resolve(rows)
      }
      self.health.execute(query)
    }
    AsyncFunction("readWorkouts") { (promise: Promise) in
      guard HKHealthStore.isHealthDataAvailable() else {
        promise.reject("HEALTH_UNAVAILABLE", "Apple Health is unavailable."); return
      }
      let end = Date()
      let start = Calendar.current.date(byAdding: .day, value: -29, to: Calendar.current.startOfDay(for: end))!
      let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
      let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate, limit: 2001,
                                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, error in
        if let error = error { promise.reject("HEALTH_READ", error.localizedDescription); return }
        guard let workouts = samples as? [HKWorkout] else { promise.resolve([]); return }
        if workouts.count > 2000 { promise.reject("HEALTH_LIMIT", "Too many workouts to import safely. Your saved history has not changed."); return }
        let formatter = ISO8601DateFormatter()
        let rows: [[String: Any]] = workouts.compactMap { workout in
          let source = workout.sourceRevision.source
          // No indirect import of Strava or unknown app data into Treksor analysis/Mentor.
          let bundle = source.bundleIdentifier.lowercased()
          guard bundle.hasPrefix("com.apple.") || bundle.hasPrefix("com.garmin.") else { return nil }
          var row: [String: Any] = [
            "id": workout.uuid.uuidString.lowercased(), "sourceId": source.bundleIdentifier,
            "sourceName": source.name, "device": workout.device?.model ?? "",
            "start": formatter.string(from: workout.startDate), "end": formatter.string(from: workout.endDate),
            "durationSeconds": workout.duration, "kind": Self.kind(workout.workoutActivityType)
          ]
          if let distance = workout.totalDistance { row["distanceMeters"] = distance.doubleValue(for: .meter()) }
          return row
        }
        promise.resolve(rows)
      }
      self.health.execute(query)
    }
  }
  private static func kind(_ type: HKWorkoutActivityType) -> String {
    switch type {
      case .running: return "Run"
      case .walking: return "Walk"
      case .hiking: return "Hike"
      case .cycling: return "Ride"
      case .swimming: return "Swim"
      case .traditionalStrengthTraining, .functionalStrengthTraining: return "Strength"
      case .yoga: return "Yoga"
      case .highIntensityIntervalTraining: return "Intervals"
      case .rowing: return "Row"
      default: return "Workout"
    }
  }
}
