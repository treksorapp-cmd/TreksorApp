import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { interestShareText, validateInterest, type InterestSurvey,
  type MonthlyInterest, type PremiumReason, type PriceRange } from "@/lib/retention-experiments";
import { useAuthStore } from "@/store/auth-store";
import { colors, surface, type } from "@/theme/architect";

const INTEREST: { value: MonthlyInterest; label: string }[] = [
  { value: "yes", label: "Yes" }, { value: "maybe", label: "Maybe" }, { value: "not_yet", label: "Not yet" },
];
const PRICE: { value: PriceRange; label: string }[] = [
  { value: "under_5", label: "Under $5" }, { value: "5_to_10", label: "$5–10" },
  { value: "10_to_15", label: "$10–15" }, { value: "more_15", label: "$15+" },
  { value: "unsure", label: "Not sure" },
];
const REASONS: { value: PremiumReason; label: string }[] = [
  { value: "personal_plans", label: "Connected personal plans" },
  { value: "deeper_progress", label: "Deeper progress insights" },
  { value: "mentor", label: "Advanced Mentor tools" },
  { value: "watch", label: "Watch continuity" },
  { value: "none", label: "None of these" },
];
function storeKey(userId: string) {
  return "treksor.premium-research.v1." + userId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export default function PremiumInterestCard() {
  const userId = useAuthStore(state => state.user?.id);
  const [expanded, setExpanded] = useState(false);
  const [interest, setInterest] = useState<MonthlyInterest | null>(null);
  const [price, setPrice] = useState<PriceRange | null>(null);
  const [reason, setReason] = useState<PremiumReason | null>(null);
  const [saved, setSaved] = useState<InterestSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotice("");
    setSaved(null);
    setInterest(null);
    setPrice(null);
    setReason(null);
    if (!userId) { setLoading(false); return () => { alive = false; }; }
    void SecureStore.getItemAsync(storeKey(userId)).then((value) => {
      if (!alive || !value) return;
      const parsed = validateInterest(JSON.parse(value));
      if (!parsed) return;
      setSaved(parsed);
      setInterest(parsed.interest);
      setPrice(parsed.price);
      setReason(parsed.feature);
    }).catch(() => {
      if (alive) setNotice("Previously saved feedback could not be loaded.");
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [userId]);

  const save = async () => {
    if (!userId || !interest || !price || !reason || working) return;
    setWorking(true);
    setNotice("");
    const response: InterestSurvey = {
      interest, price, feature: reason, updatedAt: new Date().toISOString(),
    };
    try {
      await SecureStore.setItemAsync(storeKey(userId), JSON.stringify(response));
      setSaved(response);
      setNotice("Saved privately on this device. Share it only if you choose.");
    } catch {
      setNotice("Unable to save your answers. Please try again.");
    } finally { setWorking(false); }
  };

  const share = async () => {
    if (!saved || working) return;
    setWorking(true);
    try {
      await Share.share({ message: interestShareText(saved), title: "Treksor product feedback" });
    } catch {
      setNotice("Sharing was unavailable. You can try again later.");
    } finally { setWorking(false); }
  };

  function selectRow<T extends string>(items: {value: T; label: string}[], current: T | null, onChange: (v: T) => void) {
    return <View style={styles.choices}>
      {items.map(item => <TouchableOpacity key={item.value}
        accessibilityRole="radio"
        accessibilityState={{checked:current===item.value}}
        onPress={() => { onChange(item.value); setSaved(null); setNotice(""); }}
        style={[styles.choice,current===item.value&&styles.selected]}>
        <Text style={styles.choiceText}>{item.label}</Text>
      </TouchableOpacity>)}
    </View>;
  }

  return (
    <View style={styles.section}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Help shape a future Treksor subscription"
        onPress={() => setExpanded(!expanded)}
        style={styles.heading}
      >
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>HELP SHAPE WHAT'S NEXT</Text>
          <Text style={styles.title}>What would be worth paying for?</Text>
          <Text style={styles.caption}>Optional · 60-second product research · No purchase</Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={22} color={colors.gold}/>
      </TouchableOpacity>
      {expanded && <View style={styles.details}>
        <Text style={styles.disclaimer}>Treksor is exploring a possible Plus plan. These are potential future features, not promises or features you can purchase here. This does not start a trial or subscription.</Text>
        <Text style={styles.fieldLabel}>WOULD YOU CONSIDER A MONTHLY PLAN?</Text>
        {selectRow(INTEREST,interest,setInterest)}
        <Text style={styles.fieldLabel}>WHAT MONTHLY PRICE FEELS REASONABLE?</Text>
        <Text style={styles.caption}>Hypothetical USD range — not a published price.</Text>
        {selectRow(PRICE,price,setPrice)}
        <Text style={styles.fieldLabel}>WHICH POSSIBLE BENEFIT MATTERS MOST?</Text>
        {selectRow(REASONS,reason,setReason)}
        <TouchableOpacity
          accessibilityRole="button"
          disabled={loading||working||!interest||!price||!reason||!userId}
          onPress={() => void save()}
          style={[styles.save, (loading||working||!interest||!price||!reason||!userId)&&styles.disabled]}
        >
          <Text style={styles.saveText}>{working?"SAVING…":"SAVE MY ANSWERS"}</Text>
        </TouchableOpacity>
        {saved && <TouchableOpacity accessibilityRole="button"
          disabled={working} onPress={() => void share()}
          style={styles.share}>
          <Ionicons name="share-outline" color={colors.gold} size={18}/>
          <Text style={styles.shareText}>SHARE FEEDBACK VOLUNTARILY</Text>
        </TouchableOpacity>}
        {!!notice && <Text accessibilityLiveRegion="polite" style={styles.caption}>{notice}</Text>}
        <Text style={styles.privacy}>Answers remain on this device unless you use Share and select a recipient. No personal journal, health data, account identifier or payment information is included.</Text>
      </View>}
    </View>
  );
}

const styles=StyleSheet.create({
  section: {...surface.card,padding:15,marginTop:22,gap:12},
  heading:{flexDirection:"row",alignItems:"center",gap:9,minHeight:54},
  headingText:{flex:1,gap:5},
  eyebrow:type.eyebrow,
  title:{...type.card,fontSize:16},
  caption:{...type.caption,fontSize:11,lineHeight:17},
  details:{gap:13,borderTopWidth:1,borderTopColor:colors.border,paddingTop:15},
  disclaimer:{color:colors.secondary,fontSize:12,lineHeight:19},
  fieldLabel:{...type.eyebrow,fontSize:10,marginTop:4},
  choices:{flexDirection:"row",flexWrap:"wrap",gap:7},
  choice:{borderWidth:1,borderColor:colors.border,backgroundColor:colors.surfaceRaised,borderRadius:10,paddingVertical:10,paddingHorizontal:13},
  selected:{borderColor:colors.gold,backgroundColor:colors.goldSoft},
  choiceText:{color:colors.text,fontSize:12,fontWeight:"600"},
  save:{backgroundColor:colors.gold,borderRadius:10,paddingHorizontal:14,paddingVertical:13,alignItems:"center"},
  saveText:{color:colors.background,fontSize:11,fontWeight:"800",letterSpacing:0.7},
  disabled:{opacity:0.45},
  share:{padding:12,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9,borderWidth:1,borderColor:colors.border,borderRadius:10},
  shareText:{color:colors.gold,fontSize:11,fontWeight:"700",letterSpacing:0.5},
  privacy:{color:colors.muted,fontSize:11,lineHeight:17},
});
