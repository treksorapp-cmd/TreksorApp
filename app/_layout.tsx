import { useProgressSync } from "@/hooks/useProgressSync";
import SubscriptionScreen from "@/components/SubscriptionScreen";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";
import * as Linking from "expo-linking";
import { router, SplashScreen, Stack, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import Purchases from "react-native-purchases";
import Toast from "react-native-toast-message";
import { initRC } from "./services/revenuecat";

export default function RootLayout() {
  useProgressSync();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isPillarDetail = /^\/(body|mental|spiritual|purpose)\//.test(pathname);
  const hasOwnPillarIcon = false;
  const pillar = pathname.startsWith("/body/") ? {route:"/body",icon:"barbell-outline"} : pathname.startsWith("/mental/") ? {route:"/mental",icon:"book-outline"} : pathname.startsWith("/spiritual/") ? {route:"/spiritual",icon:"shield-outline"} : pathname.startsWith("/purpose/") ? {route:"/purpose",icon:"compass-outline"} : null;
  const { error, clearError, isAuthenticated, getCurrentUser } = useAuthStore();
  const [initialURL, setInitialURL] = useState<string | null>(null);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const { user } = useAuthStore();
  const { showPackages, setShowPackages, savePushToken, purchasePlan } = useUserStore();
  const { pushToken } = useNotifications();
  const [hasSyncedSubscription, setHasSyncedSubscription] = useState(false);
  const subscriptionSyncInFlight = useRef(false);

  useEffect(() => {
    initRC();
  }, []);

  // ✅ Reset sync flag when authentication state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setHasSyncedSubscription(false);
    }
  }, [isAuthenticated]);

  // ✅ Sync subscription status on app start
  useEffect(() => {
    async function syncSubscriptionStatus() {
      if (!isAuthenticated || hasSyncedSubscription || subscriptionSyncInFlight.current) {
        return;
      }

      subscriptionSyncInFlight.current = true;
      try {
        // Wait for RevenueCat to be configured
        if (await Purchases.isConfigured()) {
          const customerInfo = await Purchases.getCustomerInfo();
          const activeEntitlements = customerInfo.entitlements.active;
          
          // Check if user has an active subscription (including trial)
          const hasActiveSubscription = Object.keys(activeEntitlements).length > 0;
          
          if (hasActiveSubscription) {
            // Determine subscription type from RevenueCat
            let planType: "monthly" | "yearly" | null = null;
            const entitlementKeys = Object.keys(activeEntitlements);
            
            if (entitlementKeys.length > 0) {
              const entitlement = activeEntitlements[entitlementKeys[0]];
              const productIdentifier = entitlement.productIdentifier || "";
              
              // Check if it's monthly or yearly based on product identifier
              if (productIdentifier.includes("monthly") || productIdentifier === "$rc_monthly") {
                planType = "monthly";
              } else if (productIdentifier.includes("annual") || productIdentifier === "$rc_annual" || productIdentifier.includes("yearly")) {
                planType = "yearly";
              }
            }

            // If we found a plan type, sync with backend
            if (planType) {
              try {
                await purchasePlan({ planType });
                console.log(`Synced subscription: ${planType}`);
              } catch (error) {
                console.error("Error syncing subscription:", error);
              }
            }
          }
          
          // Always fetch user data after checking subscription
          await getCurrentUser();
          setHasSyncedSubscription(true);
        } else {
          // RevenueCat not configured yet, just fetch user data
          await getCurrentUser();
          setHasSyncedSubscription(true);
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);
        // Still fetch user data even if subscription check fails
        try {
          await getCurrentUser();
        } catch (userError) {
          console.error("Error fetching user data:", userError);
        }
        setHasSyncedSubscription(true);
      } finally {
        subscriptionSyncInFlight.current = false;
      }
    }

    // Small delay to ensure RevenueCat is fully initialized
    const timer = setTimeout(() => {
      syncSubscriptionStatus();
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, hasSyncedSubscription, purchasePlan, getCurrentUser]);

  // ✅ Linking logic (unchanged)
  useEffect(() => {
    const timer = setTimeout(() => setIsNavigationReady(true), 300);
    const subscription = Linking.addEventListener("url", ({ url }) => handleDeepLink(url));

    Linking.getInitialURL().then((url) => url && setInitialURL(url));

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (isNavigationReady && initialURL) {
      handleDeepLink(initialURL);
      setInitialURL(null);
    }
  }, [isNavigationReady, initialURL]);

  const handleDeepLink = (url: string) => {
    try {
      const parsedUrl = Linking.parse(url);
      if (parsedUrl.path) {
        const path = parsedUrl.path.startsWith("/") ? parsedUrl.path : `/${parsedUrl.path}`;
        router.replace(path as any);
      }
    } catch (error) {
      console.error("Error handling deep link:", error);
    } finally {
      SplashScreen.hideAsync();
    }
  };

  // ✅ Toast for auth errors
  useEffect(() => {
    if (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error,
        onHide: clearError,
      });
    }
  }, [error, clearError]);

  // ✅ Force show subscription modal if expired
  useEffect(() => {
    if (isAuthenticated && user && Number(user.daysLeft) === 0 && !user.plan && !showPackages) {
      setShowPackages(true);
    }
  }, [isAuthenticated, user?.daysLeft, user?.plan, showPackages, setShowPackages]);

  // ✅ Save push token on app start when authenticated
  useEffect(() => {
    if (pushToken && pushToken?.data && isAuthenticated) {
      savePushToken({ pushToken: pushToken.data });
    }
  }, [pushToken, isAuthenticated, savePushToken]);

  // ✅ UI
  return (
    <>
      {showPackages && (
        <SubscriptionScreen onClose={()=> setShowPackages(false)}/>
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#02050C" },
          animation: "slide_from_right",
        }}
      />
      {isPillarDetail && isAuthenticated && <View pointerEvents="box-none" style={{position:"absolute",top:insets.top+8,right:hasOwnPillarIcon?72:18,flexDirection:"row",gap:9,zIndex:1000}}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go to Home" onPress={()=>router.dismissTo("/(tabs)/home" as any)} style={{width:44,height:44,borderRadius:12,backgroundColor:"rgba(183,221,240,0.075)",alignItems:"center",justifyContent:"center"}}><Ionicons name="home-outline" size={22} color="#FFFFFF" /></TouchableOpacity>
        {pillar && !hasOwnPillarIcon && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Return to pillar menu" onPress={()=>router.dismissTo(pillar.route as any)} style={{width:44,height:44,borderRadius:12,backgroundColor:"rgba(183,221,240,0.075)",alignItems:"center",justifyContent:"center"}}><Ionicons name={pillar.icon as any} size={23} color="#FFFFFF" /></TouchableOpacity>}
      </View>}
    </>
  );
}

