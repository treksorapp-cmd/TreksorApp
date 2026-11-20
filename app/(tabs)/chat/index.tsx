import {useFocusEffect,useLocalSearchParams} from "expo-router";
import MentorCompanion from "@/components/mentor/MentorCompanion";
import {guideKeyboardInset} from "@/lib/guide-keyboard";
import type {MentorMode} from "@/supabase/functions/_shared/mentor";
import { colors, navyOverlay, type } from "@/theme/architect";
"use client"

import { useAuthStore } from "@/store/auth-store"
import { useChatStore } from "@/store/chat-store"
import { Message } from "@/types/message"
import Ionicons, { GUIDE_ICON } from '@/components/ui/BrandIcon';
import { Image, ImageBackground } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { StatusBar } from "expo-status-bar"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Alert,
  Dimensions,
  Keyboard,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

const { width } = Dimensions.get("window")
const CAMPFIRE_URL = "https://niakfwerfqmrmhuypkpd.supabase.co/storage/v1/object/public/treksor-atmosphere/chat/campfire.png"

export default function ChatScreen() {
  const params=useLocalSearchParams<{intent?:string;draft?:string}>()
  const user = useAuthStore(state => state.user)
  const chats = useChatStore(state => state.chats)
  const currentUserId = useChatStore(state => state.currentUserId)
  const loading = useChatStore(state => state.loading)
  const error = useChatStore(state => state.error)
  const sendMessage = useChatStore(state => state.sendMessage)
  const setUserId = useChatStore(state => state.setUserId)
  const loadHistory = useChatStore(state => state.loadHistory)
  const messages = currentUserId === user?.id ? chats[currentUserId] || [] : [];
  const [inputText, setInputText] = useState("")
  const [mode,setMode] = useState<MentorMode>("conversation")
  const clearConversation=useChatStore(s=>s.clearConversation)
  const inputRef=useRef<TextInput>(null)
  const appliedDraft=useRef<string|null>(null)
  useEffect(()=>{setInputText("");setMode("conversation");appliedDraft.current=null},[user?.id])
  useEffect(()=>{
    const draft=params.draft;
    if(typeof draft!=="string"||!draft.trim()||appliedDraft.current===draft)return;
    appliedDraft.current=draft;
    // Messages prepared by Today or the connected journey are never sent automatically.
    setInputText(current=>current.trim()?current:draft.slice(0,500));
  },[params.draft])
  const [campfireAvailable, setCampfireAvailable] = useState(true)
  const rootRef = useRef<View>(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null)
  const [viewportBottom, setViewportBottom] = useState(Dimensions.get("screen").height)
  const measureViewport = useCallback(() => {
    rootRef.current?.measureInWindow((_x, y, _width, height) => {
      if (height <= 0) return
      const bottom = y + height
      setViewportBottom(previous => Math.abs(previous - bottom) < 1 ? previous : bottom)
    })
  }, [])
  useEffect(() => {
    const show = (event: {endCoordinates: {height: number; screenY: number}}) => {
      setKeyboardHeight(event.endCoordinates.height)
      setKeyboardTop(event.endCoordinates.screenY)
      requestAnimationFrame(measureViewport)
    }
    const hide = () => {
      setKeyboardHeight(0)
      setKeyboardTop(null)
      requestAnimationFrame(measureViewport)
    }
    const listeners = Platform.OS === "ios"
      ? [
          Keyboard.addListener("keyboardWillShow", show),
          Keyboard.addListener("keyboardWillChangeFrame", show),
          Keyboard.addListener("keyboardDidShow", show),
          Keyboard.addListener("keyboardWillHide", hide),
          Keyboard.addListener("keyboardDidHide", hide),
        ]
      : [Keyboard.addListener("keyboardDidShow", show), Keyboard.addListener("keyboardDidHide", hide)]
    requestAnimationFrame(measureViewport)
    return () => listeners.forEach(listener => listener.remove())
  }, [measureViewport])
  // The tab bar may hide or the navigator may already resize when the keyboard
  // opens. Only compensate for the portion overlapping the actual chat viewport.
  const keyboardInset = guideKeyboardInset(viewportBottom, keyboardTop)
  const flatListRef = useRef<FlatList>(null)

  useEffect(()=>{
    if (user?.id) setUserId(user.id)
  },[setUserId,user?.id])

  useFocusEffect(useCallback(() => {
    if (user?.id && currentUserId === user.id) void loadHistory()
  }, [currentUserId, user?.id, loadHistory]))
  useEffect(()=>{if(params.intent==="meal"){setInputText("Help me improve a meal with one simple change. Ask about the ingredients, portions, preferences and allergies first.");setMode("meal_ideas")}},[params.intent])

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const handleSendMessage = async () => {
    if (inputText.trim() && !loading) {
      const text=inputText.trim()
      const sent=await sendMessage(text,{mode})
      if(sent){setInputText(previous=>previous.trim()===text?"":previous);setMode("conversation")}
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === "user" ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
    >
      {!(item.role === "user") && (
        <View style={styles.aiAvatar}>
          <Ionicons name={GUIDE_ICON} size={22} color={colors.gold} accessibilityLabel="Guide" />
        </View>
      )}

      <View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, item.role === "user" ? styles.userMessageText : styles.aiMessageText]}>
          {item.content}
        </Text>
      </View>

      {item.role === "user" && (
        <View style={styles.userAvatar}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar.startsWith("http") ? user.avatar : `https://app.treksor.com/${user.avatar.replace(/^\//, "")}` }} style={{ width: 30, height: 30, borderRadius: 15 }} />
          ) : (
            <Ionicons name="person-outline" size={20} color="#D7B877" />
          )}
        </View>
      )}
    </View>
  )

  return (
    <View ref={rootRef} onLayout={measureViewport} style={[styles.container, {paddingBottom:keyboardInset}]}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <ImageBackground source={campfireAvailable ? { uri: CAMPFIRE_URL } : require("@/assets/images/mental-home-bg.jpeg")} onError={() => setCampfireAvailable(false)} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[navyOverlay(0.93),navyOverlay(0.82),navyOverlay(0.95)]} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: navyOverlay(0.14) }]} />
      </View>


      <View style={styles.guideHeading}><Text accessibilityRole="header" style={styles.guideHeadingTitle}>Guide</Text></View>
      {(messages.length>0||keyboardHeight>0)&&<MentorCompanion compact busy={loading} onShare={sendMessage} onPrompt={(text,nextMode)=>{setInputText(text);setMode(nextMode);inputRef.current?.focus()}}/>}
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        ListHeaderComponent={messages.length===0&&keyboardHeight===0?<MentorCompanion busy={loading} onShare={sendMessage} onPrompt={(text,nextMode)=>{setInputText(text);setMode(nextMode);inputRef.current?.focus()}}/>:null}
        ListEmptyComponent={<View style={styles.welcomeAI}>
          <Text style={styles.welcomeEyebrow}>YOUR SPACE</Text>
          <Text style={styles.welcomeTitle}>Start wherever you are.</Text>
          <Text style={styles.welcomeAIText}>Talk about what matters to you. Find clarity, build healthy habits and move forward at your own pace.</Text>
          <Text style={styles.welcomeNote}>AI support, not professional mental health care.</Text>
        </View>}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {loading && messages.length > 0 && (
        <View style={styles.typingContainer}>
          <View style={styles.aiAvatar}>
            <Ionicons name={GUIDE_ICON} size={22} color={colors.gold} accessibilityLabel="Guide" />
          </View>
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>Reflecting…</Text>
          </View>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {messages.length>0&&<TouchableOpacity disabled={loading} accessibilityRole="button" onPress={()=>Alert.alert("Delete this conversation?","This removes the conversation and any shared summaries from your Treksor account. Your context notes are managed separately.",[{text:"Cancel",style:"cancel"},{text:"Delete",style:"destructive",onPress:()=>void clearConversation()}])} style={{paddingHorizontal:24,paddingVertical:10}}><Text style={{color:colors.muted,fontSize:12}}>Delete conversation</Text></TouchableOpacity>}
      {/* Input */}
      {typeof params.draft==="string"&&params.draft.length>0&&<Text style={{color:colors.secondary,fontSize:11,paddingHorizontal:22,marginBottom:4}}>Review before sending. Nothing is shared automatically.</Text>}
      <View style={[styles.inputContainer, { paddingBottom: keyboardHeight > 0 ? 8 : 16 }]}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            accessibilityLabel="Message Treksor"
            placeholder="Ask Guide…"
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
            multiline
            selectionColor={colors.gold}
            scrollEnabled
            maxLength={2000}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Send message"
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <View style={styles.loadingDot} />
            ) : (
              <Ionicons name="send" size={20} color={inputText.trim() ? "#D7B877" : "#666"} />
            )}
          </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  premiumHeader: { height: 62, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#292720" },
  headerBack: { width: 28, alignItems: "flex-start" },
  premiumHeaderCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  premiumHeaderTitle: { ...type.page },
  beta: { color: "#161008", fontSize: 10, fontWeight: "800", backgroundColor: "#D7B877", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  welcomeAI: { backgroundColor: navyOverlay(0.72), marginHorizontal: 20, marginTop: 8, padding: 22, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  welcomeEyebrow: { color: "#D7B877", fontSize: 10, fontWeight: "700", letterSpacing: 2.4, marginBottom: 12 },
  welcomeTitle: { ...type.section, marginBottom: 12 },
  welcomeNote: { color: "#A9A397", fontSize: 11, lineHeight: 16, marginTop: 18 },
  welcomeAIText: { color: "#F0F0F0", fontSize: 14, lineHeight: 22 },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  guideHeading: { paddingHorizontal:20, paddingTop:0, paddingBottom:2 },
  guideHeadingTitle: { ...type.page, color:colors.gold, includeFontPadding:false, marginBottom:0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginLeft: 16,
  },
  aiHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D7B877",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F4F1", lineHeight: 23, letterSpacing: -0.2, includeFontPadding: false, },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  onlineText: {
    fontSize: 12,
    color: "#4CAF50",
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    flex: 1,
    minHeight: 0,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 0,
    gap: 16,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  aiMessageContainer: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D7B877",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    padding: 12,
    borderRadius: 16,
  },
  aiBubble: {
    backgroundColor: navyOverlay(0.88),
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#D7B877",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiMessageText: {
    color: "#FFFFFF",
  },
  userMessageText: {
    color: "#000000",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  typingBubble: {
    backgroundColor: colors.surfaceRaised,
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
  },
  errorContainer: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: navyOverlay(0.86),
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(215,184,119, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D7B877",
  },
})
