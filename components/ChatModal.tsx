"use client"

import { useAuthStore } from "@/store/auth-store"
import { useChatStore } from "@/store/chat-store"
import { Message } from "@/types/message"
import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef, useState } from "react"
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Animated as RNAnimated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width, height } = Dimensions.get("window")

interface ChatModalProps {
  visible: boolean
  onClose: () => void
}

const quickActions = [
  // { id: "1", text: "💡 What is WappGPT?", icon: "💡" },
  // { id: "2", text: "🔒 Pricing", icon: "🔒" },
  // { id: "3", text: "🤔 FAQs", icon: "🤔" },
]

export default function ChatModal({ visible, onClose }: ChatModalProps) {
  const insets = useSafeAreaInsets()
  const {messages, sendMessage, loading, error} = useChatStore();
  const [inputText, setInputText] = useState("")
  const [slideAnim] = useState(new RNAnimated.Value(height))
  const [fadeAnim] = useState(new RNAnimated.Value(0))
  const flatListRef = useRef<FlatList>(null)
  const {user} = useAuthStore();

  useEffect(() => {
    if (visible) {
      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  useEffect(()=>{
    flatListRef.current?.scrollToEnd({ animated: true })
  },[messages])

  const handleSendMessage = () => {
    if (inputText.trim() && !loading) {
      sendMessage(inputText.trim())
      setInputText("")
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const handleQuickAction = (action: string) => {
    sendMessage(action)
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.role === 'user' ? styles.userMessageContainer : styles.aiMessageContainer]}>
      {!(item.role === 'user') && (
        <View style={styles.aiAvatar}>
          <Image
            source={require("@/assets/images/chatbot.png")}
            style={{ width: 30, height: 30 }}
            />
        </View>
      )}

      <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, item.role === 'user' ? styles.userMessageText : styles.aiMessageText]}>
          {item.content}
        </Text>
      </View>

      {item.role === 'user' && (
        <View style={styles.userAvatar}>
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: 30, height: 30, borderRadius: 15 }}
              />
            ) : (
              <Text style={styles.userAvatarText}>👤</Text>
            )}
        </View>
      )}
    </View>
  )

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <RNAnimated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={styles.blurView}>
          <RNAnimated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }],
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <View style={styles.aiHeaderAvatar}>
                      <Image
                        source={require("@/assets/images/chatbot.png")}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                      />
                    </View>
                    <View>
                      <Text style={styles.headerTitle}>Ai</Text>
                      <View style={styles.onlineStatus}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Online</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.minimizeButton} onPress={onClose}>
                    <Ionicons name="remove" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

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
                  <View style={[styles.typingContainer, { alignSelf: messages[messages.length - 1].role === 'user' ? 'flex-start' : 'flex-end' }]}>
                  <View style={styles.aiAvatar}>
                    <Image
                    source={require("@/assets/images/chatbot.png")}
                    style={{ width: 30, height: 30 }}
                    />
                  </View>
                  <View style={styles.typingBubble}>
                    <Text style={styles.typingText}>Typing...</Text>
                  </View>
                  </View>
                )}

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  {quickActions.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.quickActionButton}
                      onPress={() => handleQuickAction(action.text)}
                    >
                      <Text style={styles.quickActionText}>{action.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Input */}
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Type your message here..."
                      placeholderTextColor="#666"
                      value={inputText}
                      onChangeText={setInputText}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                      onPress={handleSendMessage}
                      disabled={!inputText.trim()}
                    >
                      <Ionicons name="send" size={20} color={inputText.trim() ? "#D7B877" : "#666"} />
                    </TouchableOpacity>
                  </View>
                </KeyboardAvoidingView>
              </View>
            </LinearGradient>
          </RNAnimated.View>
        </BlurView>
      </RNAnimated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  blurView: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    marginTop: 60,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
  },
  gradientBorder: {
    flex: 1,
    borderRadius: 24,
    padding: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 23,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D7B877",
    alignItems: "center",
    justifyContent: "center",
  },
  aiHeaderAvatarText: {
    fontSize: 20,
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
  minimizeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
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
  aiAvatarText: {
    fontSize: 16,
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
    backgroundColor: "#2a2a2a",
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
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  userTimestamp: {
    alignSelf: "flex-end",
  },
  aiTimestamp: {
    alignSelf: "flex-start",
  },
  timestampText: {
    fontSize: 10,
    color: "#666",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf:"flex-start",
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
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    flexWrap: "wrap",
  },
  quickActionButton: {
    backgroundColor: "rgba(239, 179, 63, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 179, 63, 0.3)",
  },
  quickActionText: {
    color: "#D7B877",
    fontSize: 12,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
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
  bottomMinimizeButton: {
    position: "absolute",
    bottom: 10,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
})
