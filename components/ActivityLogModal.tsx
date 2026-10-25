"use client"

import { calcPercentage } from "@/lib/utils"
import { useTrackingStore } from "@/store/tracking-store"
import { TrackingItem } from "@/types/tracking"
import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useState } from "react"
import {
  Alert,
  Dimensions,
  Modal,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

const { width } = Dimensions.get("window")

interface ActivityLogModalProps {
  visible: boolean
  onClose: () => void
  selectedDate: string
}

export default function ActivityLogModal({ visible, onClose, selectedDate }: ActivityLogModalProps) {
  const { trackingData, updateTrackingCategory } = useTrackingStore()

  const [userTrackers, setUserTrackers] = useState(() => {
    return trackingData.filter(track => track.custom).map((track) => ({
      ...track,
      color: "#FF6B6B",
    }))
  })

  const [trackerStates, setTrackerStates] = useState<{ [key: string]: TrackingItem[] }>({})

  useEffect(() => {
    const initialStates: { [key: string]: TrackingItem[] } = {}
    const updatedUserTrackers = trackingData.filter(track => track.custom).map((track) => ({
      ...track,
      color: "#FF6B6B",
    }))
    updatedUserTrackers.forEach((tracker) => {
      initialStates[tracker.id] = [...tracker.items]
    })
    setUserTrackers(updatedUserTrackers)
    setTrackerStates(initialStates)
  }, [trackingData])

  const toggleItemCompletion = (trackerId: string, itemId: string) => {
    setTrackerStates((prev) => ({
      ...prev,
      [trackerId]: prev[trackerId].map((item) =>
        item.id === itemId
          ? {
              ...item,
              record: {
                ...item.record,
                [selectedDate]: !(item.record?.[selectedDate]),
              },
            }
          : item,
      ),
    }))
  }

  const handleSaveProgress = () => {
    let totalCompleted = 0
    let totalItems = 0

    // Calculate completion stats
    Object.values(trackerStates).forEach((items) => {
      totalItems += items.length
      totalCompleted += items.filter((item) => item.record?.[selectedDate]).length
    })

    if (totalCompleted === 0) {
      Alert.alert("No Progress", "Please mark at least one item as completed before saving.")
      return
    }

    // Save progress (in real app, you'd save to your tracking store)
    const completionPercentage = Math.round((totalCompleted / totalItems) * 100)

    Alert.alert(
      "Progress Saved!",
      `You completed ${totalCompleted} out of ${totalItems} items (${completionPercentage}%) for ${formatDate(selectedDate)}.`,
      [
        {
          text: "OK",
          onPress: () => {
            Object.keys(trackerStates).forEach(id => {
              const tracker = userTrackers.find(tracker => tracker.id === id);
              if(tracker)
              {
                const trackerItems = trackerStates[id];
                tracker.items = trackerItems;
                const done = tracker.items.reduce((count, item) => {
                  return count + Object.values(item?.record || {}).filter(t => t === true).length;
                }, 0);
                const total = tracker.items.reduce((count, item) => {
                  return count + Object.keys(item?.record || {}).length;
                }, 0);
                tracker.percentage = calcPercentage(done,total)
                updateTrackingCategory(tracker.id,tracker)
              }
            })
            onClose()
          },
        },
      ],
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getCompletionStats = (trackerId: string) => {
    const items = trackerStates[trackerId] || []
    const completed = items.filter((item) => item.record?.[selectedDate]).length
    const total = items.length
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <BlurView intensity={20} style={styles.overlay}>
        <RNAnimated.View style={[styles.modalContainer]}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Log Daily Activities</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Date */}
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar" size={20} color="#EFB33F" />
                  <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                </View>

                {/* User Trackers */}
                <View style={styles.trackersContainer}>
                  {userTrackers.map((tracker) => {
                    const stats = getCompletionStats(tracker.id)
                    return (
                      <View key={tracker.id} style={styles.trackerCard}>
                        <LinearGradient
                          colors={[`${tracker.color}20`, `${tracker.color}10`]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.trackerGradient}
                        >
                          {/* Tracker Header */}
                          <View style={styles.trackerHeader}>
                            <View style={styles.trackerTitleRow}>
                              <View style={[styles.trackerDot, { backgroundColor: tracker.color }]} />
                              <Text style={styles.trackerTitle}>{tracker.title}</Text>
                            </View>
                            <View style={styles.trackerStats}>
                              <Text style={styles.trackerStatsText}>
                                {stats.completed}/{stats.total}
                              </Text>
                              <Text style={styles.trackerPercentage}>{stats.percentage}%</Text>
                            </View>
                          </View>

                          {/* Tracker Items */}
                          <View style={styles.trackerItems}>
                            {trackerStates[tracker.id]?.map((item) => (
                              <TouchableOpacity
                                key={item.id}
                                style={[styles.trackerItem, item.record?.[selectedDate] && styles.trackerItemCompleted]}
                                onPress={() => toggleItemCompletion(tracker.id, item.id)}
                                activeOpacity={0.7}
                              >
                                <View style={styles.itemLeft}>
                                  <View
                                    style={[
                                      styles.checkbox,
                                      item.record?.[selectedDate] && [styles.checkboxCompleted, { backgroundColor: tracker.color }],
                                    ]}
                                  >
                                    {item.record?.[selectedDate] && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                                  </View>
                                  <Text style={[styles.itemLabel, item.record?.[selectedDate] && styles.itemLabelCompleted]}>
                                    {item.label}
                                  </Text>
                                </View>

                                <TouchableOpacity
                                  style={[
                                    styles.markDoneButton,
                                    item.record?.[selectedDate] && [
                                      styles.markDoneButtonCompleted,
                                      { backgroundColor: tracker.color },
                                    ],
                                  ]}
                                  onPress={() => toggleItemCompletion(tracker.id, item.id)}
                                >
                                  <Text style={[styles.markDoneText, item.record?.[selectedDate] && styles.markDoneTextCompleted]}>
                                    {item.record?.[selectedDate] ? "Done" : "Mark Done"}
                                  </Text>
                                </TouchableOpacity>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </LinearGradient>
                      </View>
                    )
                  })}
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProgress}>
                  <Text style={styles.saveButtonText}>Save Progress</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </RNAnimated.View>
      </BlurView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: width - 40,
    maxHeight: "85%",
    borderRadius: 20,
    overflow: "hidden",
  },
  gradientBorder: {
    borderRadius: 20,
    padding: 1,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 19,
    maxHeight: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#FFFFFF", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 20,
    padding: 12,
    backgroundColor: "rgba(239, 179, 63, 0.1)",
    borderRadius: 10,
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  trackersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  trackerCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  trackerGradient: {
    padding: 16,
  },
  trackerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  trackerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trackerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  trackerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600", lineHeight: 25, letterSpacing: -0.2, includeFontPadding: false, },
  trackerStats: {
    alignItems: "flex-end",
  },
  trackerStatsText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  trackerPercentage: {
    color: "#EFB33F",
    fontSize: 12,
    fontWeight: "500",
  },
  trackerItems: {
    gap: 8,
  },
  trackerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 8,
  },
  trackerItemCompleted: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#666",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    borderColor: "transparent",
  },
  itemLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  itemLabelCompleted: {
    textDecorationLine: "line-through",
    opacity: 0.7,
  },
  markDoneButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  markDoneButtonCompleted: {
    borderColor: "transparent",
  },
  markDoneText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  markDoneTextCompleted: {
    color: "#FFFFFF",
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#EFB33F",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
})
