import SwiftUI
import AVKit

struct WatchWorkoutReply: Decodable {
    let workout: WatchWorkout?
    let locked: Bool?
    let error: String?
}
struct WatchVideoReply: Decodable {
    let videoUrl: String?
    let error: String?
}
struct WatchSaveReply: Decodable {
    let saved: Bool?
    let already: Bool?
    let error: String?
}
struct WatchWorkout: Decodable {
    let id: String
    let dayName: String
    let startedAt: String
    let restEndsAt: String?
    let exercises: [WatchExercise]
}
struct WatchExercise: Decodable {
    let id: String
    let name: String
    let metric: String
    let equipment: String
    let targetSets: Int
    let targetReps: String
    let restSeconds: Int
    let previousKg: Double?
    let previousReps: Int?
    let completed: [WatchGymSet]
    let hasVideo: Bool
}
struct WatchGymSet: Decodable {
    let setNumber: Int
    let kg: Double
    let reps: Int
}

struct WatchWorkoutView: View {
    @ObservedObject var link: WatchLink
    @Environment(\.scenePhase) private var phase
    @State private var index = 0
    @State private var kilograms = 0.0
    @State private var repetitions = 8
    @State private var movie: AVPlayer?
    @State private var videoLoading = false
    @State private var notice = ""
    @State private var timerStarted: Date?
    @State private var timerElapsed: TimeInterval = 0

    private var exercise: WatchExercise? {
        guard let exercises = link.workout?.exercises, exercises.indices.contains(index) else { return nil }
        return exercises[index]
    }
    private var nextSet: Int? {
        guard let exercise else { return nil }
        let completed = Set(exercise.completed.map(\.setNumber))
        return (1...max(1,exercise.targetSets)).first(where:{ !completed.contains($0) })
    }
    private var isBodyweight: Bool { exercise?.equipment == "Bodyweight" }

    var body: some View {
        ScrollView {
            VStack(alignment:.leading,spacing:11) {
                if let workout = link.workout, !workout.exercises.isEmpty {
                    header(workout)
                    if let exercise {
                        HStack(spacing:6) {
                            Button { changeExercise(-1) } label: { Image(systemName:"chevron.left") }
                                .disabled(index == 0).accessibilityLabel("Previous exercise")
                            Spacer(minLength:2)
                            Text("\(index+1) / \(workout.exercises.count)")
                                .font(.caption2).monospacedDigit().foregroundStyle(TreksorBrand.muted)
                            Spacer(minLength:2)
                            Button { changeExercise(1) } label: { Image(systemName:"chevron.right") }
                                .disabled(index+1>=workout.exercises.count).accessibilityLabel("Next exercise")
                        }.buttonStyle(.plain)
                        Text(exercise.name).font(.headline).foregroundStyle(TreksorBrand.text)
                            .fixedSize(horizontal:false,vertical:true)
                        movieArea(workout:workout,exercise:exercise)
                        Text("TARGET  /  " + exercise.targetReps.uppercased() + " " + exercise.metric.uppercased())
                            .font(.system(size:10,weight:.medium)).tracking(0.9)
                            .foregroundStyle(TreksorBrand.muted)
                        HStack(alignment:.top,spacing:6) {
                            VStack(spacing:5) {
                                Text("SETS").font(.system(size:9,weight:.semibold))
                                    .tracking(0.6).foregroundStyle(TreksorBrand.gold)
                                Text(String(format:"%02d",exercise.targetSets))
                                    .font(.system(.title3,design:.rounded).weight(.semibold))
                                    .monospacedDigit().foregroundStyle(TreksorBrand.text)
                                Text("\(exercise.completed.count) DONE")
                                    .font(.system(size:9,weight:.medium))
                                    .foregroundStyle(TreksorBrand.secondary)
                            }
                            .frame(maxWidth:.infinity,minHeight:75,alignment:.center)
                            .background(TreksorBrand.surface,in:RoundedRectangle(cornerRadius:11))
                            numberEditor("KG",value:kilograms.formatted(.number.precision(.fractionLength(0...1))),
                                         canSubtract:kilograms>0,minus:{kilograms=max(0,kilograms-2.5)},plus:{kilograms=min(1500,kilograms+2.5)})
                            numberEditor(exercise.metric == "seconds" ? "SEC" : "REPS",value:"\(repetitions)",
                                         canSubtract:repetitions>1,minus:{repetitions=max(1,repetitions-1)},
                                         plus:{repetitions=min(300,repetitions+1)})
                        }
                        Button {
                            guard let set=nextSet else {return}
                            link.saveGymSet(sessionId:workout.id,exerciseId:exercise.id,setNumber:set,
                                            kg:kilograms,reps:repetitions) { saved,error in
                                notice = saved ? "Set saved on iPhone" : (error ?? "Could not save.")
                            }
                        } label: {
                            HStack(spacing:6) {
                                Image(systemName:"checkmark")
                                Text(link.workoutSaving ? "SAVING…" : "COMPLETE SET")
                            }.font(.caption.weight(.semibold)).frame(maxWidth:.infinity)
                        }
                        .buttonStyle(.borderedProminent).tint(TreksorBrand.gold)
                        .foregroundStyle(TreksorBrand.background)
                        .controlSize(.large)
                        .disabled(nextSet == nil || link.workoutSaving || (!isBodyweight && kilograms <= 0))
                        if !notice.isEmpty { Text(notice).font(.caption2).foregroundStyle(TreksorBrand.secondary) }
                        stopwatch
                    }
                } else {
                    TreksorWatchBrandHeader()
                    Text("GYM").font(.caption2.weight(.semibold)).tracking(1.2).foregroundStyle(TreksorBrand.gold)
                    Text(link.workoutLoading ? "Connecting to iPhone…" : link.workoutMessage)
                        .font(.caption).foregroundStyle(TreksorBrand.secondary)
                }
                Button(link.workoutLoading ? "Syncing…" : "Refresh") { link.refreshWorkout() }
                    .font(.caption2).disabled(link.workoutLoading || link.workoutSaving)
            }.padding(.horizontal,3).padding(.bottom,9)
        }
        .background(TreksorBrand.background)
        .navigationTitle("Gym")
        .onAppear {link.openWorkout()}
        .onDisappear {stopMovie();link.closeWorkout()}
        .onChange(of:index) {_ in stopMovie();seedInputs()}
        .onChange(of:link.workoutRevision) {_ in
            if let count=link.workout?.exercises.count, count>0 {
                index=min(index,count-1)
            } else {index=0;stopMovie()}
            seedInputs()
        }
        .onChange(of:phase) { newPhase in
            if newPhase == .active {link.openWorkout()}
            else if newPhase == .background {stopMovie();link.closeWorkout()}
        }
    }
    private func header(_ workout:WatchWorkout) -> some View {
        HStack {
            Text("TREKSOR / BODY").font(.caption2.weight(.semibold))
                .tracking(1.0).foregroundStyle(TreksorBrand.gold)
            Spacer(minLength:2)
            Image(systemName:"dumbbell").foregroundStyle(TreksorBrand.gold)
        }.accessibilityElement(children:.combine)
    }
    @ViewBuilder private func movieArea(workout:WatchWorkout,exercise:WatchExercise) -> some View {
        if let movie {
            VideoPlayer(player:movie)
                .frame(height:96).clipShape(RoundedRectangle(cornerRadius:12))
                .accessibilityLabel("Exercise video demonstration")
            Button("Close video") {stopMovie()}.font(.caption2)
        } else if exercise.hasVideo {
            Button {
                guard !videoLoading else {return}
                videoLoading=true;notice=""
                link.requestVideo(sessionId:workout.id,exerciseId:exercise.id) {url,error in
                    videoLoading=false
                    if let url {
                        let player = AVPlayer(url:url)
                        player.isMuted = true
                        movie=player
                        player.play()
                    } else {notice=error ?? "Video unavailable."}
                }
            } label: {
                VStack(spacing:5) {
                    if videoLoading {ProgressView().tint(TreksorBrand.gold)}
                    else {Image(systemName:"play.circle.fill").font(.system(size:34)).foregroundStyle(TreksorBrand.gold)}
                    Text(videoLoading ? "LOADING VIDEO" : "WATCH TECHNIQUE")
                        .font(.system(size:10,weight:.semibold)).tracking(0.7)
                        .foregroundStyle(TreksorBrand.secondary)
                }.frame(maxWidth:.infinity).frame(height:92)
            }
            .buttonStyle(.plain)
            .background(TreksorBrand.surface,in:RoundedRectangle(cornerRadius:12))
            .disabled(videoLoading)
        } else {
            Text("No video for this exercise").font(.caption2)
                .foregroundStyle(TreksorBrand.muted).frame(maxWidth:.infinity,minHeight:40)
        }
    }
    private func numberEditor(_ caption:String,value:String,canSubtract:Bool,
                              minus:@escaping ()->Void,plus:@escaping ()->Void) -> some View {
        VStack(spacing:5) {
            Text(caption).font(.system(size:9,weight:.semibold))
                .tracking(0.6).foregroundStyle(TreksorBrand.gold)
            Text(value).font(.system(.title3,design:.rounded).weight(.semibold))
                .monospacedDigit().foregroundStyle(TreksorBrand.text)
                .minimumScaleFactor(0.75).lineLimit(1)
            HStack(spacing:7) {
                Button(action:minus) {Image(systemName:"minus.circle.fill")}
                    .disabled(!canSubtract).accessibilityLabel("Decrease \(caption)")
                Button(action:plus) {Image(systemName:"plus.circle.fill")}
                    .accessibilityLabel("Increase \(caption)")
            }.buttonStyle(.plain).font(.system(size:17)).foregroundStyle(TreksorBrand.gold)
        }
        .frame(maxWidth:.infinity,minHeight:75).padding(.vertical,5)
        .background(TreksorBrand.surface,in:RoundedRectangle(cornerRadius:11))
    }
    private var stopwatch: some View {
        VStack(spacing:6) {
            HStack(spacing:5) {
                Image(systemName:"stopwatch").foregroundStyle(TreksorBrand.gold)
                TimelineView(.periodic(from:.now,by:1)) { timeline in
                    let elapsed=timerElapsed + (timerStarted.map { max(0,timeline.date.timeIntervalSince($0)) } ?? 0)
                    let seconds=Int(elapsed)
                    Text(String(format:"%02d:%02d",seconds/60,seconds%60))
                        .font(.system(.title3,design:.rounded).weight(.semibold)).monospacedDigit()
                        .foregroundStyle(TreksorBrand.text)
                }
            }.frame(maxWidth:.infinity).accessibilityLabel("Stopwatch")
            HStack(spacing:8) {
                Button(timerStarted == nil ? "Start" : "Pause") {
                    if let started=timerStarted {
                        timerElapsed+=max(0,Date().timeIntervalSince(started));timerStarted=nil
                    } else {timerStarted=Date()}
                }
                Button("Reset") {timerStarted=nil;timerElapsed=0}
            }.font(.caption2)
        }.padding(10)
        .frame(maxWidth:.infinity)
        .background(TreksorBrand.surface,in:RoundedRectangle(cornerRadius:12))
    }
    private func stopMovie() {
        movie?.pause()
        movie?.replaceCurrentItem(with:nil)
        movie=nil
        videoLoading=false
    }
    private func changeExercise(_ delta:Int) {
        guard let count=link.workout?.exercises.count else {return}
        index=min(max(0,index+delta),max(0,count-1))
        notice=""
    }
    private func seedInputs() {
        guard let exercise else {return}
        let completed=exercise.completed.sorted(by:{$0.setNumber<$1.setNumber}).last
        kilograms=completed?.kg ?? exercise.previousKg ?? 0
        let first=exercise.targetReps.split(whereSeparator:{ !$0.isNumber }).first
        repetitions=completed?.reps ?? exercise.previousReps ?? Int(first ?? "8") ?? 8
    }
}
