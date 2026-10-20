"use client"

import { useAuthStore } from "@/store/auth-store"
import { useChatStore } from "@/store/chat-store"
import { Message } from "@/types/message"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { router } from "expo-router"
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

export default function ChatScreen() {
  const insets = useSafeAreaInsets()
  const {getMessages,sendMessage, loading, error, setUserId } = useChatStore()
  const messages = getMessages();
  const [inputText, setInputText] = useState("")
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", e => setKeyboardHeight(e.endCoordinates.height))
    const hide = Keyboard.addListener("keyboardWillHide", () => setKeyboardHeight(0))
    return () => { show.remove(); hide.remove() }
  }, [])
  const flatListRef = useRef<FlatList>(null)
  const { user } = useAuthStore()

  useEffect(()=>{
    if (useAuthStore.getState().user?.id) setUserId(useAuthStore.getState().user.id)
  },[setUserId])

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const handleSendMessage = () => {
    if (inputText.trim() && !loading) {
      sendMessage(inputText.trim())
      setInputText("")
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const handleBack = () => {
    router.back()
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
            <Image source={{ uri: `https://app.treksor.com/${user?.avatar}` }} style={{ width: 30, height: 30, borderRadius: 15 }} />
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

      <View style={styles.premiumHeader}><TouchableOpacity onPress={handleBack}><Ionicons name="arrow-back" size={23} color="#fff" /></TouchableOpacity><View style={styles.premiumHeaderCenter}><Text style={styles.premiumHeaderTitle}>Treksor AI</Text><Text style={styles.beta}>BETA</Text></View><Ionicons name="ellipsis-horizontal" color="#fff" size={23} /></View>
      {messages.length === 0 && <View style={styles.welcomeAI}><Text style={styles.welcomeAIText}>Hi {user?.name?.split(" ")[0] || "there"} 👋{"\n"}I'm your Treksor AI coach.{"\n"}I'm here to help you be more focused, consistent and intentional.</Text></View>}
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.aiHeaderAvatar}>
            <Image source={require("@/assets/images/bot.png")} style={{ width: 40, height: 40, borderRadius: 20 }} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View> */}

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
            placeholder="Type your message here..."
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
              <Ionicons name="send" size={20} color={inputText.trim() ? "#E8B44D" : "#666"} />
            )}
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  premiumHeader: { height: 56, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#242424" },
  premiumHeaderCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  premiumHeaderTitle: { fontSize: 19, fontWeight: "700", color: "#fff" },
  beta: { color: "#161008", fontSize: 10, fontWeight: "800", backgroundColor: "#F5BC4F", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  welcomeAI: { backgroundColor: "#202020", marginHorizontal: 20, marginTop: 18, padding: 16, borderRadius: 14 },
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
    backgroundColor: "#E8B44D",
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
    backgroundColor: "#E8B44D",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8B44D",
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
    backgroundColor: "#2a2a2a",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#E8B44D",
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
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
    backgroundColor: "#050505",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
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
    backgroundColor: "#E8B44D",
  },
})
