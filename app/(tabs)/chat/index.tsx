"use client"

import { useAuthStore } from "@/store/auth-store"
import { useChatStore } from "@/store/chat-store"
import { Message } from "@/types/message"
import { Ionicons } from "@expo/vector-icons"
import { Image, ImageBackground } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import {
  Dimensions,
  Keyboard,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")
const CAMPFIRE_URL = "https://niakfwerfqmrmhuypkpd.supabase.co/storage/v1/object/public/treksor-atmosphere/chat/campfire.png"

export default function ChatScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore(state => state.user)
  const chats = useChatStore(state => state.chats)
  const currentUserId = useChatStore(state => state.currentUserId)
  const loading = useChatStore(state => state.loading)
  const error = useChatStore(state => state.error)
  const sendMessage = useChatStore(state => state.sendMessage)
  const setUserId = useChatStore(state => state.setUserId)
  const loadHistory = useChatStore(state => state.loadHistory)
  const messages = currentUserId ? chats[currentUserId] || [] : [];
  const [inputText, setInputText] = useState("")
  const [campfireAvailable, setCampfireAvailable] = useState(true)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", e => setKeyboardHeight(e.endCoordinates.height))
    const hide = Keyboard.addListener("keyboardWillHide", () => setKeyboardHeight(0))
    return () => { show.remove(); hide.remove() }
  }, [])
  const flatListRef = useRef<FlatList>(null)

  useEffect(()=>{
    if (user?.id) setUserId(user.id)
  },[setUserId,user?.id])

  useEffect(() => {
    if (user?.id && currentUserId === user.id) void loadHistory()
  }, [currentUserId, user?.id, loadHistory])

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const handleSendMessage = async () => {
    if (inputText.trim() && !loading) {
      const text=inputText.trim()
      const sent=await sendMessage(text)
      if(sent)setInputText("")
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
          <Image source={require("@/assets/images/bot.png")} style={{ width: 30, height: 30 }} />
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
            <Text style={styles.userAvatarText}>👤</Text>
          )}
        </View>
      )}
    </View>
  )

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <ImageBackground source={campfireAvailable ? { uri: CAMPFIRE_URL } : require("@/assets/images/mental-home-bg.jpeg")} onError={() => setCampfireAvailable(false)} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["rgba(4,5,5,0.93)","rgba(4,5,5,0.82)","rgba(4,5,5,0.95)"]} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(7,11,12,0.14)" }]} />
      </View>

      {messages.length === 0 && (
        <View style={styles.welcomeAI}>
          <Text style={styles.welcomeEyebrow}>YOUR SPACE</Text>
          <Text style={styles.welcomeTitle}>What's on your mind?</Text>
          <Text style={styles.welcomeAIText}>Talk about what matters to you. Find clarity, build healthy habits and move forward at your own pace.</Text>
          <Text style={styles.welcomeNote}>AI support, not professional mental health care.</Text>
        </View>
      )}
      {/* Single Chat title is provided by the tab navigation. */}
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {loading && messages.length > 0 && (
        <View style={styles.typingContainer}>
          <View style={styles.aiAvatar}>
            <Image source={require("@/assets/images/bot.png")} style={{ width: 30, height: 30 }} />
          </View>
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>Typing...</Text>
          </View>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: keyboardHeight > 0 ? 12 : insets.bottom + 82, marginBottom: keyboardHeight > 0 ? 12 : 0 }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Message..."
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
            multiline
            scrollEnabled
            maxLength={500}
          />
          <TouchableOpacity
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
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  premiumHeader: { height: 62, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#292720" },
  headerBack: { width: 28, alignItems: "flex-start" },
  premiumHeaderCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  premiumHeaderTitle: { fontSize: 28, fontWeight: "700", color: "#F5F1E8", letterSpacing: 0.2 },
  beta: { color: "#161008", fontSize: 10, fontWeight: "800", backgroundColor: "#F5BC4F", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  welcomeAI: { backgroundColor: "rgba(19,21,21,0.72)", marginHorizontal: 20, marginTop: 24, padding: 22, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,238,197,0.24)" },
  welcomeEyebrow: { color: "#D7B877", fontSize: 10, fontWeight: "700", letterSpacing: 2.4, marginBottom: 12 },
  welcomeTitle: { color: "#F5F1E8", fontSize: 24, fontWeight: "700", marginBottom: 12 },
  welcomeNote: { color: "#A9A397", fontSize: 11, lineHeight: 16, marginTop: 18 },
  welcomeAIText: { color: "#F0F0F0", fontSize: 14, lineHeight: 22 },

  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
    fontWeight: "bold",
    color: "#FFFFFF",
  },
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
  },
  messagesContent: {
    padding: 20,
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
    backgroundColor: "#D7B877",
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
    backgroundColor: "rgba(26,28,28,0.88)",
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
    backgroundColor: "#2a2a2a",
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
    paddingVertical: 15,
    gap: 12,
    backgroundColor: "#050505",
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(32,34,34,0.86)",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239, 179, 63, 0.2)",
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
