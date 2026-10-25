"use client"

import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { useState } from "react"
import { Dimensions, Modal, Animated as RNAnimated, StyleSheet, Text, TouchableOpacity, View } from "react-native"

const { width } = Dimensions.get("window")

interface CalendarModalProps {
  visible: boolean
  onClose: () => void
  onDateSelect: (date: string) => void
  selectedDate?: string
}

export default function CalendarModal({ visible, onClose, onDateSelect, selectedDate }: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    // Add empty cells for days after the last day of the month
    const totalCells = 42 // 6 weeks * 7 days
    const emptyCells = totalCells - days.length
    for (let i = 0; i < emptyCells; i++) {
      days.push(null)
    }

    return days
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate === formatDate(date)
  }

  const handleDatePress = (date: Date) => { 
    onDateSelect(formatDate(date))
    onClose()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth)
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const days = getDaysInMonth(currentMonth)

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
                <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth("prev")}>
                  <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.monthTitle}>
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>

                <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth("next")}>
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Day Names */}
              <View style={styles.dayNamesRow}>
                {dayNames.map((dayName) => (
                  <Text key={dayName} style={styles.dayName}>
                    {dayName}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendar}>
                {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
                  <View key={weekIndex} style={styles.week}>
                    {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => (
                      <TouchableOpacity
                        key={dayIndex}
                        style={[
                          styles.day,
                          !date && styles.emptyDay,
                          date && isToday(date) && styles.today,
                          date && isSelected(date) && styles.selectedDay,
                        ]}
                        onPress={() => date && handleDatePress(date)}
                        disabled={!date}
                      >
                        {date && (
                          <Text
                            style={[
                              styles.dayText,
                              isToday(date) && styles.todayText,
                              isSelected(date) && styles.selectedDayText,
                            ]}
                          >
                            {date.getDate()}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.todayButton} onPress={() => handleDatePress(new Date())}>
                  <Text style={styles.todayButtonText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>Close</Text>
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
    width: "90%",
    maxWidth: 520,
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
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#F5F4F1", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  dayName: {
    flex: 1,
    textAlign: "center",
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 8,
  },
  calendar: {
    marginBottom: 20,
  },
  week: {
    flexDirection: "row",
  },
  day: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 1,
    borderRadius: 8,
  },
  emptyDay: {
    backgroundColor: "transparent",
  },
  today: {
    backgroundColor: "rgba(215,184,119, 0.3)",
  },
  selectedDay: {
    backgroundColor: "#D7B877",
  },
  dayText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  todayText: {
    color: "#D7B877",
    fontWeight: "bold",
  },
  selectedDayText: {
    color: "#000000",
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  todayButton: {
    flex: 1,
    backgroundColor: "rgba(215,184,119, 0.2)",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D7B877",
  },
  todayButtonText: {
    color: "#D7B877",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
