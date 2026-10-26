"use client"

import type React from "react"

import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { WebView } from "react-native-webview"

interface PDFViewerProps {
  title: string
  pdfUrl: string
  onClose: () => void
}

const PDFViewer: React.FC<PDFViewerProps> = ({ title, pdfUrl, onClose }) => {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleOpenExternal = () => {
    Alert.alert("Open in Browser", "Would you like to open this document in your browser for better viewing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Open",
        onPress: () => Linking.openURL(pdfUrl),
      },
    ])
  }

  const handleError = () => {
    setError(true)
    setLoading(false)
  }

  const handleLoad = () => {
    setLoading(false)
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={64} color="#666666" />
          <Text style={styles.errorTitle}>Unable to load document</Text>
          <Text style={styles.errorText}>
            The document couldn't be displayed in the app. You can open it in your browser instead.
          </Text>
          <TouchableOpacity style={styles.openButton} onPress={handleOpenExternal}>
            <Text style={styles.openButtonText}>Open in Browser</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity style={styles.externalButton} onPress={handleOpenExternal}>
          <Ionicons name="open-outline" size={20} color="#D7B877" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D7B877" />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      )}

      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: pdfUrl }}
          style={styles.webView}
          onLoad={handleLoad}
          onError={handleError}
          startInLoadingState={true}
          renderLoading={() => <View />}
          bounces={false}
          scrollEnabled={true}
          scalesPageToFit={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "#121212",
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F4F1",
    flex: 1,
    textAlign: "center", lineHeight: 23, letterSpacing: -0.2, includeFontPadding: false, },
  externalButton: {
    padding: 5,
  },
  headerSpacer: {
    width: 34,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 0,
    marginVertical: 0,
  },
  webView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
    // backgroundColor: "rgba(18, 18, 18, 0.8)",
    paddingVertical: 20,
  },
  loadingText: {
    color: "#D7B877",
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#F5F4F1",
    marginTop: 20,
    marginBottom: 10, lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  errorText: {
    fontSize: 16,
    color: "#AAAAAA",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  openButton: {
    backgroundColor: "#F39C12",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default PDFViewer
