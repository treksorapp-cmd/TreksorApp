import { getOfferings } from "@/app/services/revenuecat";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, ImageBackground, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Purchases from "react-native-purchases";

type PlanType = "monthly" | "yearly";


export default function SubscriptionScreen({onClose}: {onClose: () => void}) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [planType, setPlanType] = useState<PlanType>("monthly");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeSubscriptionType, setActiveSubscriptionType] = useState<PlanType | null>(null);
  const { user, getCurrentUser, logout } = useAuthStore(); 
  const {purchasePlan, cancelSubscription} = useUserStore();
  const appState = useRef(AppState.currentState);
  const [pendingCancel, setPendingCancel] = useState(false);
  
  console.log("activeSubscriptionType", activeSubscriptionType);
  console.log("isSubscribed", isSubscribed);
  
  console.log("packages", packages);
  
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      if (await Purchases.isConfigured()) {
        const customerInfo = await Purchases.getCustomerInfo();
        const activeEntitlements = customerInfo.entitlements.active;
        
        // Check if user has an active subscription
        const hasActiveSubscription = Object.keys(activeEntitlements).length > 0;
        console.log("hasActiveSubscription", hasActiveSubscription);
        
        // Determine subscription type from user.plan or RevenueCat
        let currentPlan: PlanType | null = null;
        console.log("user?.plan", user?.plan);
        if (user?.plan === "monthly" || user?.plan === "yearly") {
          currentPlan = user.plan as PlanType;
          console.log("currentPlan", currentPlan);
        } else if (hasActiveSubscription) {
          // Try to determine from RevenueCat entitlements
          const entitlementKeys = Object.keys(activeEntitlements);
          if (entitlementKeys.length > 0) {
            // Check package identifier from the first active entitlement
            const entitlement = activeEntitlements[entitlementKeys[0]];
            console.log("entitlement", entitlement);
            if (entitlement.productIdentifier?.includes("monthly") || entitlement.productIdentifier === "$rc_monthly") {
              currentPlan = "monthly";
            } else if (entitlement.productIdentifier?.includes("annual") || entitlement.productIdentifier === "$rc_annual") {
              currentPlan = "yearly";
            }
          }
        }

        setActiveSubscriptionType(currentPlan);
        setIsSubscribed(currentPlan === planType && hasActiveSubscription);
      } else {
        // Fallback to checking user.plan from backend
        const currentPlan = user?.plan === "monthly" || user?.plan === "yearly" ? user.plan as PlanType : null;
        setActiveSubscriptionType(currentPlan);
        setIsSubscribed(currentPlan === planType && Number(user?.daysLeft) > 0);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
      // Fallback to checking user.plan from backend
      const currentPlan = user?.plan === "monthly" || user?.plan === "yearly" ? user.plan as PlanType : null;
      setActiveSubscriptionType(currentPlan);
      setIsSubscribed(currentPlan === planType && Number(user?.daysLeft) > 0);
    }
  }, [user?.plan, user?.daysLeft, planType]);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    if(await Purchases.isConfigured()) {
      const pack = await getOfferings();
      setPackages(pack as any);
      setLoading(false);
      // Check subscription status after packages are loaded
      await checkSubscriptionStatus();
    } else {
      setLoading(false);
      await checkSubscriptionStatus();
    }
  }, [checkSubscriptionStatus]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    if (!loading) {
      checkSubscriptionStatus();
    }
  }, [planType, user?.plan, checkSubscriptionStatus, loading]);

  // Listen for app state changes to detect when user returns from store
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        pendingCancel
      ) {
        // User returned from store, call the API
        try {
          setCancelling(true);
          await cancelSubscription();
          setPendingCancel(false);
          
          Alert.alert(
            "Subscription Cancelled",
            "Your subscription has been cancelled. You will retain access until the end of your current billing period.",
            [
              {
                text: "OK",
                onPress: async () => {
                  setCancelling(false);
                  await getCurrentUser();
                  await checkSubscriptionStatus();
                },
              },
            ]
          );
        } catch (error: any) {
          console.error("Cancel subscription error:", error);
          setCancelling(false);
          setPendingCancel(false);
          Alert.alert(
            "Error",
            error.message || "Failed to cancel subscription. Please try again.",
            [{ text: "OK" }]
          );
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [pendingCancel, cancelSubscription, getCurrentUser, checkSubscriptionStatus]);

  const monthlyPackage = packages?.length > 0 && packages?.find((p: any) => p?.identifier === "$rc_monthly");
  const yearlyPackage = packages?.length > 0 && packages?.find((p: any) => p?.identifier === "$rc_annual");
  
  const currentPackage: any = planType === "monthly" ? monthlyPackage : yearlyPackage;
  
  const monthlyFeatures = [
    "Unlock the Body, Mind & Spiritual pillars",
    "Daily Power Thoughts to keep you aligned",
    "Unique Articles every two days",
    "AI Companion to guide your journey",
    "Activity Tracker for your habits and goals",
  ];
  
  const yearlyFeatures = [
    "Everything in the Monthly Plan",
    "Plus, unlock the exclusive Purpose Pillar (coming soon in 2026)",
    "One-time annual payment at a lower rate",
    "Full access to the complete TREKSOR framework",
  ];
  
  const currentFeatures = planType === "monthly" ? monthlyFeatures : yearlyFeatures;

  const handlePurchase = async () => {
    if (!currentPackage) {
      Alert.alert("Error", "No package selected");
      return;
    }

    // Check if user is trying to switch plans with an active subscription
    if (activeSubscriptionType && activeSubscriptionType !== planType) {
      Alert.alert(
        "Cancel Current Subscription First",
        "You have an active subscription. Please cancel your current subscription first before switching to a different plan. You can cancel it from the App Store or Play Store settings.",
        [
          {
            text: "OK",
            style: "default",
          },
        ]
      );
      return;
    }

    try {
      setPurchasing(true);
      
      // Purchase the package
      const { customerInfo, productIdentifier, transaction } = await Purchases.purchasePackage(currentPackage);
      
      console.log("Purchase successful:", { customerInfo, productIdentifier, transaction });
      
      // Call API to update subscription on backend
      try {
        await purchasePlan({planType: planType})
        
        Alert.alert(
          "Success",
          "Subscription activated successfully!",
          [
            {
              text: "OK",
              onPress: async() => {
                setPurchasing(false);
                await getCurrentUser();
                await checkSubscriptionStatus();
                onClose(); // Close the modal after successful purchase
              },
            },
          ]
        );
      } catch (apiError: any) {
        console.error("API error:", apiError);
        // Even if API fails, purchase was successful
        Alert.alert(
          "Purchase Successful",
          "Your subscription has been activated. Please refresh the app.",
          [
            {
              text: "OK",
              onPress: async () => {
                setPurchasing(false);
                await checkSubscriptionStatus();
                onClose();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      setPurchasing(false);
      
      // Handle user cancellation
      if (error.userCancelled) {
        return; // User cancelled, don't show error
      }
      
      // Handle other errors
      Alert.alert(
        "Purchase Failed",
        error.message || "An error occurred during purchase. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      "Cancel Subscription",
      "To cancel your subscription, you'll be redirected to the App Store where you can manage your subscriptions. After you cancel, return to the app to complete the process.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Open Store",
          style: "default",
          onPress: async () => {
            try {
              setPendingCancel(true);
              
              // Open subscription management page
              const subscriptionUrl = Platform.select({
                ios: "https://apps.apple.com/account/subscriptions",
                android: "https://play.google.com/store/account/subscriptions",
              });

              if (subscriptionUrl) {
                const canOpen = await Linking.canOpenURL(subscriptionUrl);
                if (canOpen) {
                  await Linking.openURL(subscriptionUrl);
                  
                  Alert.alert(
                    "Cancel in Store",
                    "Please cancel your subscription in the store, then return to this app to complete the process.",
                    [{ text: "OK" }]
                  );
                } else {
                  setPendingCancel(false);
                  Alert.alert(
                    "Error",
                    "Unable to open the subscription management page. Please cancel your subscription manually in the App Store or Play Store settings.",
                    [{ text: "OK" }]
                  );
                }
              } else {
                setPendingCancel(false);
                Alert.alert(
                  "Error",
                  "Unable to determine your platform. Please cancel your subscription manually in the App Store or Play Store settings.",
                  [{ text: "OK" }]
                );
              }
            } catch (error: any) {
              console.error("Error opening store:", error);
              setPendingCancel(false);
              Alert.alert(
                "Error",
                "Failed to open the store. Please cancel your subscription manually in the App Store or Play Store settings.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.modalOverlay}>
          <ImageBackground
            source={planType === "monthly" ? require("@/assets/images/monthly.jpeg") : require("@/assets/images/yearly.jpeg")}
            resizeMode="cover"
            style={styles.backgroundImage}
            imageStyle={styles.imageStyle}
          >
            {(Number(user?.daysLeft) > 0 || user?.plan) ? (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons
                  name="close"
                  size={24}
                  color="#ffffff"
                />
              </TouchableOpacity>
            ): (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => {
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
                        onPress: () => {
                          logout();
                          onClose();
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="log-out-outline"
                  size={24}
                  color="#ffffff"
                />
              </TouchableOpacity>
            )}

            <View style={styles.overlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Choose Your Plan</Text>
                
                {/* Tab Selector */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tab, planType === "monthly" && styles.activeTab]}
                    onPress={() => setPlanType("monthly")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabText, planType === "monthly" && styles.activeTabText]}>
                      Monthly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, planType === "yearly" && styles.activeTab]}
                    onPress={() => setPlanType("yearly")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabText, planType === "yearly" && styles.activeTabText]}>
                      Yearly
                    </Text>
                  </TouchableOpacity>
                </View>

                {loading ? (
                  <ActivityIndicator color="#D7B877" size="large" />
                ) : currentPackage ? (
                  <>
                    {isSubscribed ? (
                      <View style={styles.subscribedContainer}>
                        <Ionicons name="checkmark-circle" size={32} color="#D7B877" />
                        <Text style={styles.subscribedText}>Already Subscribed</Text>
                        <Text style={styles.subscribedSubtext}>
                          You are currently subscribed to the {planType === "monthly" ? "Monthly" : "Yearly"} plan.
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.planPrice}>
                          {planType === "monthly" 
                            ? `Monthly Access — ${currentPackage?.product?.priceString || currentPackage?.product?.price} ${currentPackage?.product?.currencyCode || ""}`
                            : `Annual Access – ${currentPackage?.product?.priceString || currentPackage?.product?.price} ${currentPackage?.product?.currencyCode || ""}`}
                        </Text>
                        <Text style={styles.planSubheading}>
                          {planType === "monthly" 
                            ? "Includes the 7-day free trial, then automatically renews monthly."
                            : "Includes a 14-day free trial, then renews yearly (save 40%)."}
                        </Text>
                      </>
                    )}

                    {activeSubscriptionType && activeSubscriptionType !== planType && !isSubscribed && (
                      <View style={styles.switchWarning}>
                        <Ionicons name="alert-circle" size={20} color="#D7B877" />
                        <Text style={styles.switchWarningText}>
                          You currently have an active {activeSubscriptionType} subscription. Please cancel your current subscription first from the App Store settings before switching to the {planType} plan.
                        </Text>
                      </View>
                    )}

                    <View style={styles.featuresList}>
                      {currentFeatures.map((f, i) => (
                        <Text key={i} style={styles.featureItem}>
                          • {f}
                        </Text>
                      ))}
                    </View>

                    {isSubscribed ? (
                      <TouchableOpacity
                        style={[styles.cancelButton, cancelling && styles.subscribeButtonDisabled]}
                        onPress={handleCancel}
                        disabled={cancelling}
                      >
                        {cancelling ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.subscribeButton, 
                          (purchasing || (activeSubscriptionType !== null && activeSubscriptionType !== planType)) && styles.subscribeButtonDisabled
                        ]}
                        onPress={handlePurchase}
                        disabled={purchasing || (activeSubscriptionType !== null && activeSubscriptionType !== planType)}
                      >
                        {purchasing ? (
                          <ActivityIndicator color="#000" size="small" />
                        ) : (
                          <Text style={styles.subscribeText}>
                            {activeSubscriptionType !== null && activeSubscriptionType !== planType ? "Cancel Current Plan First" : "Continue"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={{ color: "#fff" }}>No subscriptions found.</Text>
                )}
                
                {/* Quote Text */}
                <Text style={styles.quoteText}>
                  Growth begins when discipline becomes identity. Every day, your body, mind and spirit align towards mastery
                </Text>
              </View>
            </View>
          </ImageBackground>
        </View>
  );
}


const styles = StyleSheet.create({
    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 99999999,
      justifyContent: "center",
      alignItems: "center",
    },
    backgroundImage: {
      flex: 1,
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
    imageStyle: { opacity: 1 },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    closeButton: {
      position: "absolute",
      top: "10%",
      right: "10%",
      zIndex: 999
    },
    modalContainer: {
      width: "90%",
      backgroundColor: "rgba(0,0,0,0.65)",
      borderRadius: 20,
      padding: 25,
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "600",
      color: "#F5F4F1",
      marginBottom: 20,
      textAlign: "center", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
    tabContainer: {
      flexDirection: "row",
      gap: 12,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      height: 48,
      borderRadius: 12,
      marginBottom: 20,
      padding: 4,
      width: "100%",
    },
    tab: {
      flex: 1,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: "#D7B877",
    },
    tabText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    activeTabText: {
      color: "#000000",
    },
    planPrice: {
      fontSize: 18,
      color: "#D7B877",
      marginBottom: 10,
      fontWeight: "600",
    },
    planSubheading: {
      fontSize: 10,
      color: "#edc473",
      marginBottom: 20,
      fontWeight: "600",
      textAlign:"center"
    },
    featuresList: {
      width: "100%",
      marginBottom: 25,
    },
    featureItem: {
      fontSize: 15,
      color: "#fff",
      marginBottom: 10,
      textAlign: "left",
    },
    subscribeButton: {
      backgroundColor: "#D7B877",
      paddingVertical: 14,
      paddingHorizontal: 50,
      borderRadius: 25,
      minWidth: 120,
      justifyContent: "center",
      alignItems: "center",
    },
    subscribeButtonDisabled: {
      opacity: 0.7,
    },
    subscribeText: {
      color: "#000",
      fontWeight: "700",
      fontSize: 16,
      textAlign: "center",
    },
    quoteText: {
      fontSize: 13,
      color: "rgba(255, 255, 255, 0.7)",
      textAlign: "center",
      fontStyle: "italic",
      marginTop: 20,
      paddingHorizontal: 10,
      lineHeight: 18,
    },
    subscribedContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    subscribedText: {
      fontSize: 20,
      fontWeight: "700",
      color: "#D7B877",
      marginTop: 10,
      marginBottom: 5,
    },
    subscribedSubtext: {
      fontSize: 14,
      color: "#edc473",
      textAlign: "center",
      marginTop: 5,
    },
    cancelButton: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: "#D7B877",
      paddingVertical: 14,
      paddingHorizontal: 50,
      borderRadius: 25,
      minWidth: 120,
      justifyContent: "center",
      alignItems: "center",
    },
    cancelButtonText: {
      color: "#D7B877",
      fontWeight: "700",
      fontSize: 16,
      textAlign: "center",
    },
    switchWarning: {
      flexDirection: "row",
      backgroundColor: "rgba(215,184,119, 0.15)",
      padding: 12,
      borderRadius: 8,
      marginBottom: 15,
      alignItems: "flex-start",
    },
    switchWarningText: {
      fontSize: 12,
      color: "#D7B877",
      marginLeft: 8,
      flex: 1,
      lineHeight: 16,
    },
    logoutButton: {
      position: "absolute",
      top: "10%",
      right: "10%",
      zIndex: 999,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      justifyContent: "center",
      alignItems: "center",
    },
  });
