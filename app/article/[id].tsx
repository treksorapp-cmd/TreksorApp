"use client";

import { useArticleStore } from "@/store/article-store";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, usePathname } from "expo-router";
import * as Speech from 'expo-speech';
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");

interface Article {
  _id: string;
  category: string;
  title: string;
  description: string;
  body: string;
  image: string;
}

interface ArticlesDetailsScreenProps {
  mode?: "tab" | "stack";
  category?: string
}

export default function ArticleDetailScreen({ mode = "stack" }: ArticlesDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const pillarTrail = pathname.startsWith("/body/") ? "BODY / READING / ARTICLES" : pathname.startsWith("/spiritual/") ? "BALANCE / READING / ARTICLES" : "MIND / READING / ARTICLES";
  const { id, category } = useLocalSearchParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [isRead, setIsRead] = useState(false)
  const { fetchArticleById, loading, markArticleAsRead } = useArticleStore();
  const [webViewHeight, setWebViewHeight] = useState(0);
 
  useEffect(() => {
    if (id) {
      fetchArticleById({ id: id as string, category: category as string }).then((res) => {
        if (res) {
          setArticle(res);
          setIsRead(res?.isRead || false)
        }
      });
    }
  }, [id]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handleMarkAsRead = () => {
    setIsRead(true)
    markArticleAsRead(category as string, id as string);
  }

const handleSpeak = async (title?: string, description?: string, body?: string) => {
  if (!title || !description || !body) return;

  const plainBody = body.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  const speechText = `${title}. ${description.replace(/<[^>]+>/g, '')}. ${plainBody}`;
  
  try {
    // const voices = await Speech.getAvailableVoicesAsync();

    // console.log("Available voices:", voices);
    // const preferred = voices.find(
    //   (v) => v.language === "ar-001"  && v.name.toLowerCase().includes("majed")
    // );

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });

    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) await Speech.stop();
    
    Speech.speak(speechText, {
      // voice: preferred?.identifier || voices[0]?.identifier,
      rate: 0.9,
      pitch: 1.0,
      onDone: () => {
        console.log("Speech finished.");
      },
      onError: (err) => {
        console.log("Speech error:", err);
        Alert.alert("Text-to-Speech Error", "Unable to speak the article. Make sure your phone isn't in silent mode and volume is up.");
      },
    });
  } catch (error) {
    console.log("Error speaking article:", error);
  }
};


  if (loading) {
    return (
      <View
        style={[
          styles.container,
        ]}
      >
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D7B877" />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </View>
    );
  }

  const imageUrl = `https://app.treksor.com/${article?.image}`;

  // Create HTML content for WebView to render the body with proper styling
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #000000;
          color: #FFFFFF;
          margin: 0;
        }
      </style>
    </head>
    <body>
      ${article?.body}
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (mode === "tab" ? 80 : 20) }]}>
      <StatusBar style="light" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: mode === 'tab' ? insets.bottom + 40 : 0}}
      >
        <View style={{paddingTop:insets.top+12,paddingBottom:17}}><Text style={{color:"#D7B877",fontSize:11,fontWeight:"700",letterSpacing:1.6}}>{pillarTrail}</Text><Text style={{color:"#FFFFFF",fontSize:34,fontWeight:"700",letterSpacing:1.5,marginTop:7}}>ARTICLE</Text></View>
        {/* Article Image */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.articleImage}
           contentFit="cover"
        />

        {/* Article Content */}
        <View style={styles.articleContent}>
          {/* <Text style={styles.category}>{article?.category}</Text> */}
          <View style={styles.titleRow}>          
            <Text style={styles.title}>{article?.title}</Text>
            {/* <Pressable onPress={() => handleSpeak(article?.title, article?.description, article?.body)}>
              <Ionicons name="volume-high-outline" size={24} color="gray" />
            </Pressable> */}
          </View>
          <Text style={styles.description}>{article?.description}</Text>

          {/* Article Body */}
          <View style={styles.bodyContainer}>
            <WebView
              source={{ html: htmlContent }}
              style={[styles.webView, { height: webViewHeight }]}
              scrollEnabled={false}
              injectedJavaScript="
                setTimeout(() => {
                  window.ReactNativeWebView.postMessage(document.body.scrollHeight);
                }, 500);
              "
              onMessage={event => {
                setWebViewHeight(Number(event.nativeEvent.data));
              }}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomSection, { bottom: mode === 'tab' ? insets.bottom + 20 : 0 }]}>
          <TouchableOpacity
            style={[styles.markAsReadButton, isRead && styles.markAsReadButtonRead]}
            onPress={handleMarkAsRead}
            disabled={isRead}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isRead ? ["rgba(183,221,240,0.07)", "rgba(183,221,240,0.04)"] : ["rgba(183,221,240,0.16)", "rgba(183,221,240,0.07)"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>{isRead ? "Read ✓" : "Mark as read"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02050C",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#AAAAAA",
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  articleImage: {
    width: "100%",
    height: 200,
    borderRadius: 18,
  },
  articleContent: {
    paddingVertical: 20,
  },
  category: {
    fontSize: 14,
    color: "#D7B877",
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 29,
    marginBottom: 16,
    maxWidth:"100%", letterSpacing: -0.2, includeFontPadding: false, },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 28,
    // marginBottom: 24,
  },
  bodyContainer: {
    minHeight: 200,
  },
  webView: {
    backgroundColor: "transparent",
    height: 400,
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10, 10, 10, 0.95)",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  markAsReadButton: {
    borderRadius: 16,
    borderWidth:1,
    borderColor:"rgba(205,235,248,0.20)",
    overflow: "hidden",
  },
  markAsReadButtonRead: {
    opacity: 0.8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },  
});
