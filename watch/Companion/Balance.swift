import SwiftUI

struct BalanceScreen: View {
    @EnvironmentObject var link: WatchLink
    var body: some View { Page(title:"Balance") {
        Route(label:"Sleep",icon:"moon",detail:"Saved nights") { SleepScreen() }
        Route(label:"Wake gently",icon:"sunrise",detail:"Paired iPhone alarm") { WakeScreen() }
        Text("Practice").font(.headline)
        ForEach(link.state?.practices ?? []) { practice in
            Route(label:practice.title,icon:"leaf",detail:link.run?.practice == practice.id ? "Resume timer":"\(practice.minutes) min") { PracticeScreen(practice:practice) }
        }
    } }
}
struct PracticeScreen: View {
    let practice:Practice
    @EnvironmentObject var link:WatchLink
    var body: some View { Page(title:"Practice") {
        Text(practice.title).font(.headline); Text(practice.guide).foregroundStyle(TreksorBrand.secondary)
        if let run=link.run,run.practice==practice.id {
            TimelineView(.periodic(from:.now,by:1)) { context in
                let left = max(0, Int(ceil(run.start + Double(practice.minutes*60) - context.date.timeIntervalSince1970)))
                Text(String(format:"%02d:%02d",left/60,left%60)).font(.largeTitle).monospacedDigit().foregroundStyle(TreksorBrand.gold)
                if left==0 { Button("Save practice") { link.send("practice",["practice":practice.id,"run":run.id,"start":run.start]) {link.run=nil;link.notice="Your practice is saved in Balance."} }.disabled(link.busy) }
            }
            Button("Discard timer",role:.destructive) {link.run=nil}
        } else if link.run != nil { Text("Return to the practice with the active timer to finish or discard it.").font(.caption) }
        else { Button("Begin · \(practice.minutes) min") { if let grant=link.state?.grant {link.run=PracticeRun(id:UUID().uuidString,grant:grant,practice:practice.id,start:Date().timeIntervalSince1970)} } }
    } }
}
struct SleepScreen: View {
    @EnvironmentObject var link:WatchLink
    var body: some View { Page(title:"Sleep") {
        Text("Saved sleep").font(.headline)
        if let nights=link.nights {
            if nights.isEmpty {Text("Review sleep from Apple Health in Balance on iPhone and save your selected nights.")}
            ForEach(Array(nights.enumerated()),id:\.offset){_, night in VStack(alignment:.leading,spacing:4){Text(night.date).font(.caption); Text("\(night.minutes/60)h \(night.minutes%60)m").font(.title3).foregroundStyle(TreksorBrand.gold);Text(night.sourceName).font(.caption)} }
        } else {Text("View the durations and sources already saved to your account on iPhone.").font(.caption)}
        Button(link.busy ? "Loading…" : "Load saved nights"){link.send("sleep")}.disabled(link.busy)
    } }
}
struct WakeScreen: View {
    @EnvironmentObject var link:WatchLink
    @State var hour=7,minute=0,sound="wake_01",confirm=false
    var body: some View { Page(title:"Wake gently") {
        if let w=link.wake {
            if let at=w.at {Text("Scheduled on iPhone").font(.caption);Text(Date(timeIntervalSince1970:at),style:.time).font(.title3)}
            Text(w.mode=="alarmkit" ? "System alarm on your iPhone. Watch delivery follows Apple’s alarm settings." : "Notification reminder on iPhone. Delivery depends on notification settings.").font(.caption)
            Picker("Hour",selection:$hour){ ForEach(0..<24,id:\.self){Text(String(format:"%02d",$0)).tag($0)} }.pickerStyle(.navigationLink)
            Picker("Minute",selection:$minute){ ForEach(0..<60,id:\.self){Text(String(format:"%02d",$0)).tag($0)} }.pickerStyle(.navigationLink)
            Picker("iPhone sound",selection:$sound){ ForEach(w.tones){Text($0.name).tag($0.id)} }.pickerStyle(.navigationLink)
            Button(w.at==nil ? "Schedule wake-up" : "Replace wake-up"){confirm=true}.disabled(link.busy)
                .confirmationDialog("Schedule on iPhone at \(String(format:"%02d:%02d",hour,minute))?",isPresented:$confirm){Button("Confirm time"){link.send("scheduleWake",["hour":hour,"minute":minute,"sound":sound,"expected":w.scheduledID ?? ""]) {link.notice="Wake-up saved on iPhone."}}}
        } else {Text("Choose a time and tone for the paired iPhone. Manage light and motion in Balance on iPhone.").font(.caption)}
        Button("Load iPhone settings"){link.send("wakeInfo"){if let w=link.wake { hour=w.hour;minute=w.minute;sound=w.sound }} }.disabled(link.busy)
    } }
}
