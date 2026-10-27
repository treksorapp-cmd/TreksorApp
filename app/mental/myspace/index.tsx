import { recordedDay } from "@/lib/progress-metrics";
import BodyPageHeading from "@/components/BodyPageHeading";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useReflectionContext} from "@/hooks/useReflectionContext";
"use client"

import Button from "@/components/ui/Button"
import EntryOptionsModal from "@/components/EntryOptionsModal"
import { useMySpaceStore } from "@/store/myspace-store"
import type { MySpace } from "@/types/myspace"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import {
  Dimensions,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

const { width } = Dimensions.get("window")

export default function MySpaceScreen() {
  const insets=useSafeAreaInsets();
  const {origin,trail}=useReflectionContext();
  const { myspaces, deleteMySpace } = useMySpaceStore()
  const scores: Record<string,number> = {Happy:5,Grateful:5,Calm:4,Tired:3,Anxious:2,Stressed:2,Frustrated:2,Sad:1}
  const moodDays: Record<string,{sum:number,count:number}> = {}
  for(const entry of myspaces){const day=recordedDay(entry.date);const score=scores[entry.mood];if(!day||!score)continue;const prev=moodDays[day]||{sum:0,count:0};moodDays[day]={sum:prev.sum+score,count:prev.count+1}}
  const moodTrend=Object.keys(moodDays).sort().slice(-7).map(day=>({day,score:moodDays[day].sum/moodDays[day].count}))
  const animatedValues = myspaces.map(() => new RNAnimated.Value(1))
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)
  const [showOptionsModal, setShowOptionsModal] = useState(false)

  useEffect(() => {
    // Stagger the card animations
    const animations = animatedValues.map((animatedValue, index) =>
      RNAnimated.timing(animatedValue, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
    )

    RNAnimated.stagger(80, animations).start()
  }, [myspaces.length])

  const handleLongPress = (entryId: string) => {
    setSelectedEntry(entryId)
    setShowOptionsModal(true)
  }

  const handleView = () => {

    if (selectedEntry) {
      router.push(`/mental/myspace/view-entry/${selectedEntry}?pillar=${origin}`)
    }
  }

  const handleEdit = () => {
    if (selectedEntry) {
      router.push(`/mental/myspace/edit-entry/${selectedEntry}?pillar=${origin}`)
    }
  }

  const handleDelete = () => {
    if (selectedEntry) {
      deleteMySpace(selectedEntry)
    }
  }

  const renderMySpaces = (mySpace: MySpace, index: number) => {
    const animatedValue = animatedValues[index]

    if (!animatedValue) return null

    const translateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [30, 0],
    })

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    })

    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    })

    return (
      <RNAnimated.View
        key={mySpace.id}
        style={[
          styles.mySpaceCard,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        {/* Outer LinearGradient for the border */}
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.4)"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.borderGradient}
        >
          {/* Inner LinearGradient for the button background */}
          <LinearGradient
            colors={["#262626", "#0a0a0a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.innerGradient}
          >
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/mental/myspace/view-entry/${mySpace.id}?pillar=${origin}`)}
              onLongPress={() => handleLongPress(mySpace.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{mySpace.date}</Text>
                <View style={styles.cardActions}>
                  <View style={styles.mood}>
                    <Text style={styles.moodText}>{mySpace.mood}</Text>
                  </View>
                  <TouchableOpacity style={styles.moreButton} onPress={() => handleLongPress(mySpace.id)}>
                    <Ionicons name="ellipsis-vertical" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.text} numberOfLines={3}>
                {mySpace.text}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </LinearGradient>
      </RNAnimated.View>
    )
  }

  return (
    <View style={[styles.container,{paddingTop:insets.top+12}]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:insets.bottom+32}}>
      <BodyPageHeading trail={trail} title={origin === "purpose" ? "Goals & reflections" : "My space"} subtitle={origin === "purpose" ? "Put your intentions into words. Return to them as you grow." : "A place to pause, reflect and understand yourself."} />
      <StatusBar style="light" />

      <View style={{marginHorizontal:20,marginTop:16,padding:18,borderRadius:18,backgroundColor:"rgba(255,255,255,0.08)",borderWidth:1,borderColor:"rgba(255,255,255,0.22)"}}>
        <Text style={{color:"#FFFFFF",fontWeight:"700",fontSize:15}}>Mood over time</Text>
        <Text style={{color:"#CCC6BC",marginTop:6}}>{moodTrend.length<2?"Record moods on different days to see your trend":moodTrend[moodTrend.length-1].score>moodTrend[0].score?"Mood improving":moodTrend[moodTrend.length-1].score<moodTrend[0].score?"Mood declining":"Mood stable"}</Text>
        <Text style={{color:"#D7B877",marginTop:12,fontSize:12}}>1 Low · 2 Difficult · 3 Neutral · 4 Settled · 5 Positive</Text>
        <Text style={{color:"#AAA",fontSize:11,marginTop:7}}>Reflection mood index · based on your selected mood, not a clinical measure</Text>
        <View style={{height:130,flexDirection:"row",justifyContent:"space-around",alignItems:"flex-end"}}>
          {moodTrend.map(item=><View key={item.day} style={{alignItems:"center",flex:1}}><View style={{height:Math.max(6,item.score*18),width:7,borderRadius:5,backgroundColor:"#D7B877"}}/><Text style={{color:"#C8C2B6",fontSize:10,marginTop:7}}>{item.day.slice(5)}</Text></View>)}
          {moodTrend.length===0&&<Text style={{color:"#AAA"}}>Your mood history will appear here.</Text>}
        </View>
        <Text style={{color:"#D7B877",marginTop:10}}>{moodTrend.length?`Average: ${(moodTrend.reduce((sum,item)=>sum+item.score,0)/moodTrend.length).toFixed(1)} / 5 · ${moodTrend.length} recorded days`:"No moods recorded yet. Save a reflection with a mood to start your chart."}</Text>
      </View>
      <View style={{paddingHorizontal:20}}><Button iconName="create-outline" onPress={()=>router.push({pathname:"/mental/myspace/new-entry",params:{pillar:origin}})}>TODAY'S ENTRY</Button></View>
      {/* Thoughts List */}
      <View style={{paddingHorizontal:20,gap:16,paddingVertical:10}}>
        {myspaces.length === 0 && <View style={{padding:22,borderRadius:18,backgroundColor:"#111820",gap:8}}><Text style={{color:"#F5F4F1",fontSize:18,lineHeight:25,fontWeight:"600"}}>Start with one thought</Text><Text style={{color:"#C8C3BA",fontSize:15,lineHeight:23}}>Your saved reflections will appear here. There is no right way to begin.</Text></View>}
        {myspaces.map((mySpace, index) => renderMySpaces(mySpace, index))}
      </View>
      </ScrollView>

      {/* Options Modal */}
      <EntryOptionsModal
        visible={showOptionsModal}
        onClose={() => {
          setShowOptionsModal(false)
          setSelectedEntry(null)
        }}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        entryId={selectedEntry || ""}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02050C",
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  cardHeader: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D7B877",
  },
  text: {
    fontSize: 18,
    color: "#FFFFFF",
    lineHeight: 31,
    textAlign: "left",
    letterSpacing: 1,
  },
  borderGradient: {
    borderRadius: 12,
    padding: 1,
  },
  innerGradient: {
    borderRadius: 11,
    minHeight: 120,
  },
  mySpaceCard: {
    width: width - 40,
    borderRadius: 12,
    overflow: "hidden",
  },
  card: {
    width: "100%",
    padding: 20,
  },
  newEntry: {
    height: 60,
    width: width - 40,
    backgroundColor: "#D7B877",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 10,
  },
  newEntryText: {
    fontWeight: "600",
    fontSize: 18,
  },
  mood: {
    height: 20,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(215,184,119, 0.2)",
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  moodText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 16,
  },
  moreButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
})
