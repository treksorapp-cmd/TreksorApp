"use client"

import Button from "@/components/ui/Button"
import { getEntries, moodAverage } from "@/lib/mood-journal"
import { useFocusEffect } from "expo-router"
import { useCallback } from "react"
import PDFViewer from "@/components/ui/PDFViewer"
import { useAuthStore } from "@/store/auth-store"
import { useUserStore } from "@/store/user-store"
import { AntDesign, Ionicons } from "@expo/vector-icons"
import * as Application from 'expo-application'
import { Image } from "expo-image"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [moodSummary,setMoodSummary]=useState<{average:number|null;days:number}>({average:null,days:0});
  const {isAuthenticated, logout, user, loading, requestResetPassword, getCurrentUser} = useAuthStore();
  const {deactivateAccount, cancelSubscription, setShowPackages} = useUserStore();
  const [showPDF, setShowPDF] = useState<{
      visible: boolean
      title: string
      url: string
    }>({
      visible: false,
      title: "",
      url: "",
    });
  
  const TERMS_URL = "https://app.treksor.com/public/terms-of-service.pdf"
  const PRIVACY_URL = "https://app.treksor.com/public/privacy-policy.pdf"
  const DISCLAIMER_URL = "https://app.treksor.com/public/disclaimer.pdf"

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated])

  const handleEditProfile = () => {
    router.push("/profile/edit")
  }

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => logout(),
        },
      ],
      { cancelable: true },
    )
  }

  const handleChangePassword = () => {
    requestResetPassword({ email: user.email, isChangePassword: true })
      .then(() => {
          router.push({ pathname: "/(auth)/verify-otp", params: { email:user.email, purpose: 'reset-password' } });
      })
  }

  const handleDeactivateAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete account? The action is irreversible",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deactivateAccount().then(() => logout());
          }
        },
      ],
      { cancelable: true },
    )
  }

  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.",
      [
        {
          text: "Keep Subscription",
          style: "cancel",
        },
        {
          text: "Cancel Subscription",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription();
              await getCurrentUser(); // Refresh user data
              Alert.alert(
                "Subscription Cancelled",
                "Your subscription has been cancelled. You will continue to have access until the end of your current billing period.",
                [{ text: "OK" }]
              );
            } catch {
              Alert.alert(
                "Error",
                "Failed to cancel subscription. Please try again later.",
                [{ text: "OK" }]
              );
            }
          }
        },
      ],
      { cancelable: true },
    )
  }

  const openPDF = (title: string, url: string) => {
    setShowPDF({ visible: true, title, url })
  }

  const closePDF = () => {
    setShowPDF({ visible: false, title: "", url: "" })
  }

  const openNotificationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:'); // Opens app settings (including notification toggle)
    } else {
      Linking.openSettings(); // Android: opens app settings
    }
  };  

  useFocusEffect(useCallback(()=>{let active=true; if(user?.id){getEntries(user.id).then(entries=>{if(active)setMoodSummary(moodAverage(entries,"month"))}).catch(()=>{if(active)setMoodSummary({average:null,days:0})})}return()=>{active=false}},[user?.id]));

  const imageUrl = `https://app.treksor.com/${user?.avatar}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarSection}>
            {user.avatar ? (
              <Image source={{ uri: imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <Button onPress={handleEditProfile}>
            EDIT PROFILE
          </Button>
        </View>

        <TouchableOpacity onPress={() => router.push("/mind/journal")} style={{marginHorizontal:20,marginVertical:16,padding:18,borderRadius:16,backgroundColor:"rgba(67,72,78,0.30)",borderWidth:1,borderColor:"rgba(242,215,164,0.42)"}}><Text style={{color:"#D7B877",fontSize:12,letterSpacing:2}}>MIND · PRIVATE</Text><Text style={{color:"#fff",fontSize:21,fontWeight:"700",marginTop:7}}>My Journal & Mood Tracking →</Text><Text style={{color:"#aaa",marginTop:7}}>{moodSummary.days > 0 ? `Last 30 days · ${moodSummary.average?.toFixed(1)} / 5 · ${moodSummary.days} check-ins` : "Record how you feel and review your progress."}</Text></TouchableOpacity>

        {/* Subscription Plan Section */}
        {user?.plan && (
          <TouchableOpacity onPress={()=> setShowPackages(true)} style={styles.subscriptionSection}>
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#D7B877" />
                <Text style={styles.subscriptionTitle}>Active Plan</Text>
              </View>
              <Text style={styles.planName}>
                {user.plan === "monthly" ? "Monthly Plan" : user.plan === "yearly" ? "Yearly Plan" : user.plan.charAt(0).toUpperCase() + user.plan.slice(1) + " Plan"}
              </Text>
              {/* <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancelSubscription}
              >
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              </TouchableOpacity> */}
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <Ionicons name="person-outline" size={22} color="#FFFFFF" style={styles.menuIcon} />
            <Text style={styles.menuText}>Personal Information</Text>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
            <Ionicons name="lock-closed-outline" size={22} color="#FFFFFF" style={styles.menuIcon} />
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, {backgroundColor: 'red',opacity:0.8}]} onPress={handleDeactivateAccount}>
            <AntDesign name="deleteuser" size={22} color="#FFFFFF" style={styles.menuIcon} />
            <Text style={styles.menuText}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={openNotificationSettings}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" style={styles.menuIcon} />
              <Text style={styles.menuText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile/preferences")}>
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" style={styles.menuIcon} />
            <Text style={styles.menuText}>Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/help")}>
            <Ionicons name="help-circle-outline" size={22} color="#FFFFFF" style={styles.menuIcon} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/about")}>
            <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" style={styles.menuIcon} />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>
        </View> */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => openPDF("Terms of Service", TERMS_URL)}>
            <Ionicons name="document-text-outline" size={22} color="#FFFFFF" style={styles.menuIcon} />
            <Text style={styles.menuText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => openPDF("Privacy Policy", PRIVACY_URL)}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#FFFFFF" style={styles.menuIcon} />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => openPDF("Disclaimer", DISCLAIMER_URL)}>
            <Ionicons name="warning-outline" size={22} color="#FFFFFF" style={styles.menuIcon} />
            <Text style={styles.menuText}>Disclaimer</Text>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
          <Button onPress={handleLogout} loading={loading}>
            LOGOUT
          </Button>

          <Text style={styles.versionText}>Treksor v{Application.nativeApplicationVersion}</Text>
        </View>
      </ScrollView>
      <Modal visible={showPDF.visible} animationType="slide" presentationStyle="fullScreen">
        <PDFViewer title={showPDF.title} pdfUrl={showPDF.url} onClose={closePDF} />
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  avatarSection: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#AAAAAA",
  },
  editButton: {
    width: 150,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F4F1",
    marginBottom: 15, lineHeight: 23, letterSpacing: -0.2, includeFontPadding: false, },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(67,72,72,0.30)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
  },
  logoutSection: {
    padding: 20,
    alignItems: "center",
  },
  logoutButton: {
    marginBottom: 20,
  },
  versionText: {
    color: "#666666",
    fontSize: 14,
  },
  subscriptionSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  subscriptionCard: {
    backgroundColor: "rgba(67,72,72,0.30)",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#D7B877",
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#D7B877",
    marginLeft: 10, lineHeight: 23, letterSpacing: -0.2, includeFontPadding: false, },
  planName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  daysLeft: {
    fontSize: 14,
    color: "#AAAAAA",
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF4444",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FF4444",
    fontSize: 14,
    fontWeight: "600",
  },
})
