import { useWakeOverlay } from "@/store/wake-overlay-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  AppState,
  Keyboard,
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";
import { useWorkoutStore } from "@/store/workout-store";
import {
  discoveryKey,
  discoveryTips,
  DiscoveryState,
  nextDiscovery,
  parseDiscovery,
  Tip,
  visitedTip,
  cleanPath,
} from "@/lib/guided-discovery";
import { colors, surface, type } from "@/theme/architect";
import { useReducedMotion } from "@/hooks/useReducedMotion";
const Context = createContext<{
  open: () => void;
  count: number;
  ready: boolean;
}>({ open: () => {}, count: 0, ready: false });
export const useDiscovery = () => useContext(Context);
export default function DiscoveryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const waking = useWakeOverlay((s) => s.visible);
  const owner = useAuthStore((s) =>
      s.isAuthenticated && s.isVerified ? s.user?.id : "",
    ),
    loading = useAuthStore((s) => s.loading),
    packages = useUserStore((s) => s.showPackages),
    workout = useWorkoutStore((s) => s.activeGymWorkout),
    path = usePathname(),
    insets = useSafeAreaInsets(),
    reduced = useReducedMotion();
  const [record, setRecord] = useState<{
      owner: string;
      value: DiscoveryState;
    } | null>(null),
    [panel, setPanel] = useState<"guide" | Tip | null>(null),
    [error, setError] = useState(""),
    [keyboard, setKeyboard] = useState(false),
    [foreground, setForeground] = useState(AppState.currentState === "active"),
    [visit, setVisit] = useState(0),
    [retry, setRetry] = useState(0);
  const queue = useRef(Promise.resolve()),
    didShow = useRef(false),
    latest = useRef({
      owner,
      path,
      loading,
      packages,
      workout,
      keyboard,
      foreground,
    });
  latest.current = {
    owner,
    path,
    loading,
    packages,
    workout,
    keyboard,
    foreground,
  };
  const own = record?.owner === owner ? record.value : null;
  const canShow = () => {
    const s = latest.current;
    return (
      !!s.owner &&
      !useWakeOverlay.getState().visible &&
      !s.loading &&
      !s.packages &&
      !s.workout &&
      !s.keyboard &&
      s.foreground &&
      cleanPath(s.path) === "/home"
    );
  };
  useEffect(() => {
    let valid = true;
    setRecord(null);
    setPanel(null);
    setError("");
    didShow.current = false;
    if (owner)
      AsyncStorage.getItem(discoveryKey(owner))
        .then(parseDiscovery)
        .then((value) => {
          if (valid) setRecord({ owner, value });
        })
        .catch(() => {
          if (valid)
            setError(
              "Your guide could not be restored. Automatic tips are paused. Try again.",
            );
        });
    return () => {
      valid = false;
    };
  }, [owner, retry]);
  const update = useCallback(
    (change: (state: DiscoveryState) => DiscoveryState) => {
      const account = owner;
      const run = queue.current
        .catch(() => {})
        .then(async () => {
          if (!account || latest.current.owner !== account)
            throw Error("Account changed");
          const current = parseDiscovery(
              await AsyncStorage.getItem(discoveryKey(account)),
            ),
            value = change(current);
          if (latest.current.owner !== account) throw Error("Account changed");
          await AsyncStorage.setItem(
            discoveryKey(account),
            JSON.stringify(value),
          );
          if (latest.current.owner === account) {
            setRecord({ owner: account, value });
            setError("");
          }
          return value;
        });
      queue.current = run.then(
        () => {},
        () => {},
      );
      return run;
    },
    [owner],
  );
  useEffect(() => {
    let leftAt = 0;
    const app = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state !== "active") {
        leftAt = Date.now();
        setPanel(null);
      } else if (leftAt && Date.now() - leftAt >= 30 * 60000) {
        didShow.current = false;
        setVisit((v) => v + 1);
      }
    });
    const show = Keyboard.addListener("keyboardDidShow", () =>
        setKeyboard(true),
      ),
      hide = Keyboard.addListener("keyboardDidHide", () => setKeyboard(false));
    return () => {
      app.remove();
      show.remove();
      hide.remove();
    };
  }, []);
  useEffect(() => {
    setPanel(null);
    const tip = visitedTip(path);
    if (owner && own && tip && !own.visited[tip.id])
      void update((state) => ({
        ...state,
        visited: { ...state.visited, [tip.id]: Date.now() },
      })).catch(() =>
        setError("Could not save guide progress. Automatic tips are paused."),
      );
  }, [owner, path, !!own, update]);
  useEffect(() => {
    if (!own || error || panel || didShow.current || !canShow()) return;
    const tip = nextDiscovery(own);
    if (!tip) return;
    let valid = true;
    const timer = setTimeout(() => {
      if (!valid || !canShow() || didShow.current) return;
      didShow.current = true;
      void update((state) => {
        if (!valid || !canShow() || nextDiscovery(state)?.id !== tip.id)
          return state;
        const now = Date.now();
        return {
          ...state,
          shown: { ...state.shown, [tip.id]: now },
          lastAutomaticAt: now,
        };
      })
        .then((value) => {
          if (valid && canShow() && value.shown[tip.id]) setPanel(tip);
        })
        .catch(() => {
          if (valid)
            setError(
              "Could not save guide preferences. Automatic tips are paused.",
            );
        });
    }, 1800);
    return () => {
      valid = false;
      clearTimeout(timer);
    };
  }, [
    owner,
    own,
    path,
    loading,
    packages,
    workout,
    keyboard,
    foreground,
    visit,
    panel,
    error,
    update,
  ]);
  useEffect(() => {
    if (loading || packages || workout || keyboard || waking) setPanel(null);
  }, [loading, packages, workout, keyboard, waking]);
  const close = () => setPanel(null),
    go = (tip: Tip) => {
      close();
      router.push(tip.route as any);
    };
  return (
    <Context.Provider
      value={{
        open: () => setPanel("guide"),
        count: own ? Object.keys(own.visited).length : 0,
        ready: !!own,
      }}
    >
      {children}
      <Modal
        visible={!!panel && !!owner}
        transparent
        animationType={reduced ? "none" : "fade"}
        onRequestClose={close}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#000B",
            paddingTop: insets.top + 25,
          }}
        >
          <ScrollView
            style={{
              maxHeight: "90%",
              backgroundColor: colors.surface,
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
            }}
            contentContainerStyle={{
              padding: 24,
              paddingBottom: insets.bottom + 24,
              gap: 18,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={type.eyebrow}>YOUR TREKSOR GUIDE</Text>
              <TouchableOpacity
                accessibilityLabel="Close guide"
                onPress={close}
                style={{ padding: 12 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {panel && panel !== "guide" ? (
              <>
                <Ionicons name={panel.icon} size={38} color={colors.gold} />
                <Text style={type.page}>{panel.title}</Text>
                <Text style={type.body}>{panel.body}</Text>
                <TouchableOpacity
                  onPress={() => go(panel)}
                  style={{
                    backgroundColor: colors.gold,
                    padding: 18,
                    borderRadius: 16,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.background, fontWeight: "700" }}>
                    Explore this space
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPanel("guide")}
                  style={{ padding: 12 }}
                >
                  <Text style={{ color: colors.gold, textAlign: "center" }}>
                    See my full guide
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={type.section}>Find your own rhythm.</Text>
                <Text style={type.body}>
                  Discover a little more each day. Every space is available from
                  the beginning.
                </Text>
                <Text style={type.caption}>
                  {own ? Object.keys(own.visited).length : 0} of 8 areas
                  explored · This tracks places visited, not personal
                  achievement.
                </Text>
                {discoveryTips.map((tip) => (
                  <TouchableOpacity
                    key={tip.id}
                    onPress={() => go(tip)}
                    style={{
                      ...surface.card,
                      flexDirection: "row",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name={tip.icon} color={colors.gold} size={24} />
                    <View style={{ flex: 1, gap: 5 }}>
                      <Text style={type.card}>{tip.title}</Text>
                      <Text style={type.caption}>{tip.body}</Text>
                      {own?.visited[tip.id] && (
                        <Text style={{ color: colors.success, fontSize: 12 }}>
                          Explored
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
              <View style={{ flex: 1 }}>
                <Text style={type.body}>Gentle tips in my first days</Text>
                <Text style={type.caption}>
                  At most once a day on Home. Your guide stays available in
                  Profile.
                </Text>
              </View>
              <Switch
                disabled={!own}
                accessibilityLabel="Automatic discovery tips"
                value={own?.automatic ?? false}
                onValueChange={(automatic) =>
                  void update((state) => ({ ...state, automatic })).catch(() =>
                    setError(
                      "Could not save your preference. Please try again.",
                    ),
                  )
                }
              />
            </View>
            {!!error && (
              <>
                <Text style={{ color: colors.danger }}>{error}</Text>
                <TouchableOpacity
                  onPress={() => setRetry((v) => v + 1)}
                  style={{ padding: 12 }}
                >
                  <Text style={{ color: colors.gold }}>Try again</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </Context.Provider>
  );
}
