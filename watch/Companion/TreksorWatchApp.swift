import SwiftUI

@main struct TreksorWatchApp: App {
    @StateObject private var link = WatchLink()
    @Environment(\.scenePhase) private var phase
    var body: some Scene {
        WindowGroup {
            Home().environmentObject(link).tint(TreksorBrand.gold)
                .onChange(of: phase) { value in
                    if value == .active { link.activate() } else if value == .background { link.deactivate() }
                }
        }
    }
}
private struct Home: View {
    @EnvironmentObject var link: WatchLink
    var body: some View {
        NavigationStack {
            ScrollView { VStack(alignment: .leading, spacing: 10) {
                TreksorWatchBrandHeader()
                if let state = link.state {
                    Route(label: "Body", icon: "dumbbell", detail: state.active?.name ?? "Gym routines") { BodyScreen() }
                    Route(label: "Mind", icon: "heart", detail: "Daily check-in") { MindScreen() }
                    Route(label: "Balance", icon: "leaf", detail: "Practice, sleep & wake") { BalanceScreen() }
                    Route(label: "Purpose", icon: "scope", detail: "Today’s personal steps") { PurposeScreen() }
                    Route(label: "Progress", icon: "chart.bar", detail: "Your last seven days") { ProgressScreen() }
                } else { Text("Connect your watch").font(.headline); Text(link.status).font(.body).foregroundStyle(TreksorBrand.secondary) }
                Button(link.busy ? "Syncing…" : "Refresh") { link.refresh() }.disabled(link.busy)
            }.padding(.horizontal, 3) }.background(TreksorBrand.background)
        }.id(link.state?.grant ?? "locked")
        .alert("Treksor", isPresented: Binding(get: {link.notice != nil}, set: {if !$0 {link.notice = nil}})) { Button("Done") {link.notice = nil} } message: { Text(link.notice ?? "") }
    }
}
struct Route<Destination: View>: View {
    let label, icon, detail: String
    @ViewBuilder let destination: () -> Destination
    var body: some View {
        NavigationLink(destination: destination()) {
            HStack(spacing: 8) { Image(systemName: icon).foregroundStyle(TreksorBrand.gold).frame(width: 22)
                VStack(alignment:.leading,spacing:3) { Text(label).font(.headline); Text(detail).font(.caption).foregroundStyle(TreksorBrand.secondary) }
            }.frame(maxWidth:.infinity, alignment:.leading).padding(.vertical, 3)
        }.tint(TreksorBrand.surfaceRaised)
    }
}
struct Page<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content
    var body: some View { ScrollView { VStack(alignment:.leading,spacing:12) { content() }.frame(maxWidth:.infinity,alignment:.leading).padding(.horizontal,3) }.navigationTitle(title).background(TreksorBrand.background) }
}
struct ClockStrip: View {
    let training: Training
    @Environment(\.isLuminanceReduced) var dimmed
    var body: some View {
        TimelineView(.periodic(from:.now,by:1)) { context in
            let now = context.date.timeIntervalSince1970, remaining = max(0, Int(ceil(training.restUntil-now)))
            HStack { VStack(alignment:.leading) { Text("Workout").font(.caption2); Text(time(Int(now-training.started))).monospacedDigit() }
                Spacer(); VStack(alignment:.trailing) { Text(remaining>0 ? "Rest" : "Rest off").font(.caption2); Text(time(remaining)).monospacedDigit() }.foregroundStyle(remaining>0 && !dimmed ? TreksorBrand.gold : TreksorBrand.muted)
            }.padding(7).background(TreksorBrand.surface,in:RoundedRectangle(cornerRadius:10))
        }
    }
    private func time(_ value:Int)->String { let n=max(0,value);return String(format:"%02d:%02d",n/60,n%60) }
}
struct BodyScreen: View {
    @EnvironmentObject var link: WatchLink
    @State var confirmFinish = false
    var body: some View {
        if let t = link.state?.active {
            VStack(spacing:4) { ClockStrip(training:t); ScrollView { VStack(alignment:.leading,spacing:9) {
                Text(t.name).font(.headline); Text("\(t.done) / \(t.total) sets saved").font(.caption)
                if let e=t.next { SetEditor(move:e,session:t.id).id("\(t.id):\(e.id):\(e.number)") }
                else {Text("All available sets recorded.")}
                if t.restUntil>Date().timeIntervalSince1970 { Button("Add 15 sec") { link.send("extend",["session":t.id,"deadline":t.restUntil]) }; Button("End rest") { link.send("skip",["session":t.id,"deadline":t.restUntil]) } }
                Button("Finish workout") {confirmFinish=true}.disabled(t.done==0)
            }.disabled(link.busy) } }.navigationTitle("Body")
                .confirmationDialog("Save this workout?",isPresented:$confirmFinish){Button("Finish & save") {link.send("finish",["session":t.id]) {link.notice="Workout saved to Gym progress."}}}
        } else { Page(title:"Body") { if let days=link.state?.days, !days.isEmpty { ForEach(days) { day in
            Button {link.send("start",["day":day.day])} label: { VStack(alignment:.leading) { Text(day.name).font(.headline);Text("Start · \(day.count) exercises").font(.caption) } }.disabled(link.busy || day.count==0)
        } } else { Text("Build your routine in Body on iPhone. Your gym days will appear here.") } } }
    }
}
struct SetEditor: View {
    @EnvironmentObject var link: WatchLink
    let move: Movement, session: String
    @State var kg: Double; @State var reps: Int
    init(move:Movement,session:String) {self.move=move;self.session=session;_kg=State(initialValue:move.bodyweight ? 0:move.kg);_reps=State(initialValue:max(1,min(300,move.reps)))}
    var body: some View { VStack(alignment:.leading,spacing:8) {
        Text(move.name).font(.headline);Text("Set \(move.number)").font(.caption).foregroundStyle(TreksorBrand.secondary)
        if move.bodyweight { Text("Bodyweight") } else { NavigationLink { CrownValue(title:"Weight · kg", value:$kg, limits:0...2000, step:0.5) } label: { Text("\(kg, specifier:"%g") kg") } }
        NavigationLink { CrownValue(title:move.metric.capitalized,value:Binding(get:{Double(reps)},set:{reps=Int($0.rounded())}),limits:1...300,step:1) } label: { Text("\(reps) \(move.metric)") }
        Button("Save set") {link.send("set",["session":session,"exercise":move.id,"number":move.number,"kg":kg,"reps":reps])}.disabled(!move.bodyweight && kg==0).tint(TreksorBrand.gold)
    } }
}
struct MindScreen: View {
    @EnvironmentObject var link: WatchLink
    @State var mood=0, focus=0, energy=0
    var body: some View { Page(title:"Mind") {
        Text("Daily check-in").font(.headline);Text("Choose your own ratings from 1 (low) to 5 (high). Saving updates today’s check-in on iPhone.").font(.caption)
        rating("Mood",$mood);rating("Focus",$focus);rating("Energy",$energy)
        Button("Save check-in") {link.send("checkin",["date":link.state?.today ?? "","mood":mood,"focus":focus,"energy":energy]) {link.notice="Today’s check-in is saved in Progress."}}.disabled(link.busy || min(mood,min(focus,energy))==0)
    } }
    private func rating(_ name:String,_ binding:Binding<Int>)->some View { Picker(name,selection:binding){Text("Choose").tag(0);ForEach(1...5,id:\.self){Text(String($0)).tag($0)}}.pickerStyle(.navigationLink) }
}
struct PurposeScreen: View {
    @EnvironmentObject var link: WatchLink
    var body: some View { Page(title:"Purpose") {
        Text("Today’s steps").font(.headline)
        if let items=link.state?.habits,!items.isEmpty { ForEach(items,id:\.selfKey) { h in
            Button {link.send("habit",["date":link.state?.today ?? "","category":h.category,"item":h.id,"done":!h.done])} label: { Label(h.name,systemImage:h.done ? "checkmark.circle.fill":"circle") }.disabled(link.busy)
        } } else { Text("Create a personal tracker in Progress on iPhone and schedule a step for today.") }
    } }
}
extension Habit {var selfKey:String { category+":"+id }}
struct ProgressScreen: View {
    @EnvironmentObject var link: WatchLink
    var body: some View { Page(title:"Progress") { if let p=link.state?.progress {
        Text("Last seven days").font(.headline);stat("Gym sessions",p.sessions);stat("Recorded sets",p.sets);stat("Timed practice minutes",p.minutes)
        Text(p.sets>0 ? "You made room for movement. Your saved sets count here." : p.minutes>0 ? "You made room for a quiet moment." : "Record a set or a practice to see it here.").font(.caption).foregroundStyle(TreksorBrand.secondary)
    } } }
    private func stat(_ label:String,_ value:Int)->some View { VStack(alignment:.leading){Text("\(value)").font(.title2).foregroundStyle(TreksorBrand.gold);Text(label).font(.caption)} }
}

struct CrownValue: View {
    let title: String
    @Binding var value: Double
    let limits: ClosedRange<Double>, step: Double
    @Environment(\.dismiss) var dismiss
    var body: some View {
        VStack(spacing:8) {
            Text(value,format:.number.precision(.fractionLength(0...1))).font(.largeTitle).monospacedDigit().foregroundStyle(TreksorBrand.gold)
                .focusable().digitalCrownRotation($value,from:limits.lowerBound,through:limits.upperBound,by:step,sensitivity:.medium,isContinuous:false,isHapticFeedbackEnabled:true)
            HStack {
                Button {value=max(limits.lowerBound,value-step)} label:{Image(systemName:"minus")}.accessibilityLabel("Decrease")
                Button {value=min(limits.upperBound,value+step)} label:{Image(systemName:"plus")}.accessibilityLabel("Increase")
            }
            Button("Done"){dismiss()}
        }.navigationTitle(title)
    }
}
