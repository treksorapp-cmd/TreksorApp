import SwiftUI
import WatchKit
import UserNotifications

@main struct TreksorWatchApp: App {
    @StateObject private var link = WatchLink()
    @StateObject private var feed = ThoughtFeed()
    @Environment(\.scenePhase) private var phase
    var body: some Scene {
        WindowGroup {
            NavigationStack { TodayView(feed:feed,link:link) }
                .tint(TreksorBrand.gold).task(id:phase) { if phase == .active { await feed.load() } else if phase == .background { link.close() } }
        }
        WKNotificationScene(controller: ThoughtNotification.self, category: "TREKSOR_POWER_THOUGHT")
    }
}
struct TodayView: View {
    @ObservedObject var feed: ThoughtFeed
    @ObservedObject var link: WatchLink
    var body: some View {
        ScrollView { VStack(alignment:.leading,spacing:12) {
            TreksorWatchBrandHeader()
            if let thought=feed.thought {
                ThoughtCard(text:thought.thought,date:thought.formattedDate)
                if feed.offline { Text("Saved on this watch").font(.caption2).foregroundStyle(TreksorBrand.secondary) }
            } else {Text(feed.message).font(.body).foregroundStyle(TreksorBrand.secondary)}
            NavigationLink { ProgressView(link:link) } label: {
                HStack(spacing:8) { Image(systemName:"chart.bar").foregroundStyle(TreksorBrand.gold);Text("My progress").font(.headline);Spacer() }
            }.accessibilityLabel("My progress, last seven days")
            if feed.offline { Button("Retry"){Task {await feed.load()}} }
        }.padding(.horizontal,3) }.background(TreksorBrand.background)
    }
}
struct ThoughtCard: View {
    let text: String
    let date: String
    var body: some View {
        VStack(alignment:.leading,spacing:10) {
            Text("POWER THOUGHT").font(.caption2.weight(.semibold)).tracking(1.1).foregroundStyle(TreksorBrand.gold)
            Text(text).font(.system(.headline).weight(.medium)).lineSpacing(3).foregroundStyle(TreksorBrand.text).fixedSize(horizontal:false,vertical:true)
            if !date.isEmpty { Text(date).font(.caption2).foregroundStyle(TreksorBrand.secondary) }
        }.padding(12).frame(maxWidth:.infinity,alignment:.leading)
         .background(LinearGradient(colors:[TreksorBrand.surfaceRaised,TreksorBrand.surface],startPoint:.topLeading,endPoint:.bottomTrailing),in:RoundedRectangle(cornerRadius:15,style:.continuous))
         .overlay(RoundedRectangle(cornerRadius:15,style:.continuous).strokeBorder(TreksorBrand.gold.opacity(0.29),lineWidth:1))
    }
}
struct ProgressView: View {
    @ObservedObject var link: WatchLink
    @Environment(\.scenePhase) private var phase
    var body: some View {
        ScrollView { VStack(alignment:.leading,spacing:10) {
            Text("Last seven days").font(.headline)
            if let p=link.totals {
                row("Gym sessions",p.sessions);row("Saved sets",p.sets);row("Practice minutes",p.minutes)
                Text("Practice minutes come from completed timers.").font(.caption2).foregroundStyle(TreksorBrand.secondary)
            } else {Text(link.loading ? "Connecting to iPhone…" : link.message).font(.body).foregroundStyle(TreksorBrand.secondary)}
            Button(link.loading ? "Syncing…" : "Refresh"){link.refresh()}.disabled(link.loading)
        }.padding(.horizontal,3) }.background(TreksorBrand.background).navigationTitle("Progress")
        .onAppear {link.open()}.onDisappear {link.close()}.onChange(of:phase){p in if p == .active {link.open()} else if p == .background {link.close()} }
    }
    private func row(_ name:String,_ count:Int)->some View { VStack(alignment:.leading,spacing:2) {Text("\(count)").font(.title2.weight(.semibold)).monospacedDigit().foregroundStyle(TreksorBrand.gold);Text(name).font(.caption).foregroundStyle(TreksorBrand.text)}.padding(.vertical,3).accessibilityElement(children:.combine) }
}
struct AlertCard: View {
    let thought:String
    var body: some View { VStack(alignment:.leading,spacing:8){TreksorWatchBrandHeader();ThoughtCard(text:thought,date:"")} }
}
final class ThoughtNotification: WKUserNotificationHostingController<AlertCard> {
    private var text = "Open Treksor for your Power Thought."
    override var body: AlertCard { AlertCard(thought:text) }
    override func didReceive(_ notification:UNNotification) { text=notification.request.content.body }
}
