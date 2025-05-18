// NotificationsScreen.js

import React, { useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";

const tabs = ["All", "Transactions", "Bills", "Security"];

export default function NotificationsScreen() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState(tabs[0]);

  const notifications = [
    {
      id: "1",
      group: "Today",
      title: "Large Transaction Detected",
      description: "$500 spent at Amazon",
      time: "2 hours ago",
      icon: "cash-outline",
      iconBackground: "#EFF6FF",
      iconColor: "#2563EB",
    },
    {
      id: "2",
      group: "Today",
      title: "Upcoming Bill Payment",
      description: "Electric Bill due in 2 days",
      time: "5 hours ago",
      icon: "calendar-outline",
      iconBackground: "#FEF3C7",
      iconColor: "#D97706",
    },
    {
      id: "3",
      group: "Yesterday",
      title: "New Device Login",
      description: "New login from iPhone 14",
      time: "Yesterday, 15:30",
      icon: "shield-checkmark-outline",
      iconBackground: "#FEE2E2",
      iconColor: "#DC2626",
    },
    {
      id: "4",
      group: "Yesterday",
      title: "Budget Goal Achieved",
      description: "Savings goal reached",
      time: "Yesterday, 10:15",
      icon: "trending-up-outline",
      iconBackground: "#D1FAE5",
      iconColor: "#059669",
    },
    {
      id: "5",
      group: "Earlier This Week",
      title: "Weekly Spending Summary",
      description: "Your spending is on track",
      time: "Monday, 09:00",
      icon: "wallet-outline",
      iconBackground: "#F5F3FF",
      iconColor: "#7C3AED",
    },
  ];

  const grouped = notifications.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
      ]}
    >
      <View
        style={[
          styles.containerInner,
          isDark ? styles.containerInnerDark : styles.containerInnerLight,
        ]}
      >
        {/* Блок табов */}
        <View
          style={[
            styles.blockOne,
            isDark ? styles.blockOneDark : styles.blockOneLight,
          ]}
        >
          <View style={styles.list}>
            {tabs.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.itemBase,
                      isActive
                        ? isDark
                          ? styles.itemActiveDark
                          : styles.itemActiveLight
                        : isDark
                        ? styles.itemInactiveDark
                        : styles.itemInactiveLight,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Список уведомлений */}
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(grouped).map(([group, items], idx) => (
            <View key={group}>
              <Text
                style={[
                  styles.sectionHeader,
                  isDark
                    ? styles.sectionHeaderDark
                    : styles.sectionHeaderLight,
                  { marginTop: idx === 0 ? 16 : 24 },
                ]}
              >
                {group}
              </Text>

              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.card,
                    isDark ? styles.cardDark : styles.cardLight,
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.iconWrapper,
                      { backgroundColor: item.iconBackground },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.iconColor}
                    />
                  </View>

                  <View style={styles.cardText}>
                    <Text
                      style={[
                        styles.cardTitle,
                        isDark
                          ? styles.cardTitleDark
                          : styles.cardTitleLight,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        isDark
                          ? styles.cardSubtitleDark
                          : styles.cardSubtitleLight,
                      ]}
                    >
                      {item.description}
                    </Text>
                    <Text
                      style={[
                        styles.cardTime,
                        isDark ? styles.cardTimeDark : styles.cardTimeLight,
                      ]}
                    >
                      {item.time}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDark ? "#6B7280" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // контейнеры
  container: { flex: 1 },
  containerLight: { backgroundColor: "#F9FAFB" },
  containerDark: { backgroundColor: "#111827" },

  containerInner: { flex: 1 },
  containerInnerLight: { backgroundColor: "#F9FAFB" },
  containerInnerDark: { backgroundColor: "#111827" },

  // блок табов
  blockOne: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  blockOneLight: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F5F5F5",
  },
  blockOneDark: {
    backgroundColor: "#1F2937",
    borderBottomColor: "#374151",
  },
  list: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  itemBase: {
    fontSize: 16,
    fontWeight: "400",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 999,
  },
  itemActiveLight: {
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  itemInactiveLight: {
    color: "#71717A",
    backgroundColor: "transparent",
  },
  itemActiveDark: {
    color: "#2563EB",
    backgroundColor: "#374151",
  },
  itemInactiveDark: {
    color: "#9CA3AF",
    backgroundColor: "transparent",
  },

  // контент
  contentContainer: {
    paddingHorizontal: 25,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionHeaderLight: {
    color: "#6B7280",
  },
  sectionHeaderDark: {
    color: "#9CA3AF",
  },

  // карта уведомления
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardLight: {
    backgroundColor: "#FFFFFF",
  },
  cardDark: {
    backgroundColor: "#1F2937",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardTitleLight: {
    color: "#111827",
  },
  cardTitleDark: {
    color: "#F9FAFB",
  },
  cardSubtitle: { fontSize: 14 },
  cardSubtitleLight: {
    color: "#6B7280",
  },
  cardSubtitleDark: {
    color: "#9CA3AF",
  },
  cardTime: { fontSize: 12, marginTop: 4 },
  cardTimeLight: {
    color: "#9CA3AF",
  },
  cardTimeDark: {
    color: "#6B7280",
  },
});