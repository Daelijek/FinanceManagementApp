import React, { useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../context/ThemeContext";
import Svg, { G, Circle } from "react-native-svg";

const data = [
  { label: "Shopping", value: 237.49, color: "#4F46E5" }, // синий
  { label: "Food & Drinks", value: 50.55, color: "#EC4899" }, // розовый
  { label: "Entertainment", value: 15.99, color: "#8B5CF6" }, // фиолетовый
  { label: "Transport", value: 52.3, color: "#10B981" }, // зеленый
];

const transactions = [
  { id: 1, name: 'Grocery Store', date: 'Today, 2:30 PM', amount: -82.50, iconName: 'cart' },
  { id: 2, name: 'Netflix', date: 'Yesterday', amount: -15.99, iconName: 'game-controller' },
  { id: 3, name: 'Starbucks', date: 'Yesterday', amount: -4.75, iconName: 'cafe' },
  { id: 4, name: 'Salary Deposit', date: 'Jan 25, 2024', amount: 3200.00, iconName: 'wallet' },
  { id: 5, name: 'Amazon', date: 'Jan 24, 2024', amount: -129.99, iconName: 'bag' },
  { id: 6, name: 'Restaurant', date: 'Jan 24, 2024', amount: -45.80, iconName: 'restaurant' },
  { id: 7, name: 'Gas Station', date: 'Jan 23, 2024', amount: -52.30, iconName: 'car' },
  { id: 8, name: 'Gift Shop', date: 'Jan 23, 2024', amount: -25.00, iconName: 'gift' },
];

const radius = 50;
const strokeWidth = 25;
const circumference = 2 * Math.PI * radius;

const TransactionScreen = () => {
  const tabs = ["All", "Income", "Expenses", "Transfers"];
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState(tabs[0]);

  // Вычисляем суммарное значение
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Для каждого сегмента считаем параметры рисования
  let cumulativePercent = 0;
  const arcs = data.map((item) => {
    const percent = item.value / total;
    const strokeDasharray = circumference * percent + " " + circumference;
    const strokeDashoffset = circumference * (1 - cumulativePercent - percent);
    cumulativePercent += percent;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.containerInner}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerText, isDark && styles.headerTextDark]}>Transactions</Text>
            <View style={styles.headerIcons}>
              <Ionicons name="search" size={24} color={isDark ? "#D1D5DB" : "#4B5563"} />
              <Ionicons name="filter" size={24} color={isDark ? "#D1D5DB" : "#4B5563"} />
            </View>
          </View>

          {/* Total Balance Card */}
          <View style={styles.totalBalance}>
            <LinearGradient
              colors={["#2563EB", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCardGradient}
            >
              <View style={styles.balanceCard}>
                <Text style={styles.balanceTitle}>Total Balance</Text>
                <Text style={styles.balanceAmount}>$4,285.32</Text>
                <View style={styles.balanceGroup}>
                  <Text style={styles.balanceReportText}>This month</Text>
                </View>

                {/* Серые "штуки" - график */}
                <View style={styles.graphContainer}>
                  {[20, 40, 25, 45, 30, 40, 55].map((height, index) => (
                    <View key={index} style={[styles.graphBar, { height }]} />
                  ))}
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Tabs */}
          <View style={styles.categories}>
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
          </View>

          {/* Круговая диаграмма с легендой */}
          <View style={styles.pieChartContainer}>
            <View style={styles.pieChartHead}>
              <Text style={[styles.pieChartTitle, isDark && styles.pieChartTitleDark]}>
                Spending by Category
              </Text>
            </View>
            <View style={styles.pieChartGroup}>
              <Svg
                width={radius * 2 + strokeWidth}
                height={radius * 2 + strokeWidth}
                style={{ transform: [{ rotate: "-90deg" }] }}
              >
                <G origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}>
                  <Circle
                    cx={radius + strokeWidth / 2}
                    cy={radius + strokeWidth / 2}
                    r={radius}
                    stroke={isDark ? "#374151" : "#E5E7EB"}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {arcs.map((arc, index) => (
                    <Circle
                      key={index}
                      cx={radius + strokeWidth / 2}
                      cy={radius + strokeWidth / 2}
                      r={radius}
                      stroke={arc.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={arc.strokeDasharray}
                      strokeDashoffset={arc.strokeDashoffset}
                      fill="transparent"
                    />
                  ))}
                </G>
              </Svg>
              <View style={styles.legend}>
                {data.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View
                      style={[styles.legendColorBox, { backgroundColor: item.color }]}
                    />
                    <View style={styles.legendTextWrapper}>
                      <Text style={[styles.legendLabel, isDark && styles.legendLabelDark]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.legendValue, isDark && styles.legendValueDark]}>
                        $ {item.value.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Список транзакций */}
          <View style={styles.transactionList}>
            <View style={styles.transactionHead}>
              <Text style={[styles.transactionTitle, isDark && styles.transactionTitleDark]}>
                Transactions
              </Text>
            </View>
            {transactions.map(({ id, name, date, amount, iconName }) => {
              const isPositive = amount > 0;
              return (
                <View style={styles.transactionItem} key={id}>
                  <View
                    style={[
                      styles.iconContainer,
                      isPositive && { backgroundColor: "#DCFCE7" },
                      isDark && !isPositive && { backgroundColor: "#1F2937" },
                    ]}
                  >
                    <Ionicons
                      name={iconName}
                      size={24}
                      color={isPositive ? "#16A34A" : isDark ? "#9CA3AF" : "gray"}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.name, isDark && styles.nameDark]}>{name}</Text>
                    <Text style={[styles.date, isDark && styles.dateDark]}>{date}</Text>
                  </View>
                  <Text
                    style={[
                      styles.amount,
                      { color: isPositive ? "#16A34A" : isDark ? "#E5E7EB" : "#000" },
                    ]}
                  >
                    {isPositive
                      ? `+ ${amount.toFixed(2)} $`
                      : `- ${Math.abs(amount).toFixed(2)} $`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  containerDark: {
    backgroundColor: "#111827", // Тёмный фон
  },
  containerInner: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  headerTextDark: {
    color: "#F9FAFB",
  },
  headerIcons: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 25,
  },
  balanceCardGradient: {
    borderRadius: 16,
  },
  balanceCard: {
    height: 190,
    width: "100%",
    padding: 24,
    justifyContent: "space-around",
  },
  balanceTitle: {
    fontWeight: "500",
    fontSize: 14,
    color: "#FFFFFF",
  },
  balanceAmount: {
    fontWeight: "700",
    fontSize: 30,
    color: "#FFFFFF",
  },
  balanceGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceReportText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },
  graphContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 12,
    height: 50,
  },
  graphBar: {
    width: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    marginHorizontal: 4,
  },
  blockOne: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingVertical: 16,
  },
  blockOneLight: {},
  blockOneDark: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
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
  pieChartContainer: {
    flexDirection: "column",
  },
  pieChartTitle: {
    fontWeight: "600",
    fontSize: 18,
    color: "#000000",
  },
  pieChartTitleDark: {
    color: "#F9FAFB",
  },
  pieChartGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  legend: {
    marginLeft: 24,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  legendColorBox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendTextWrapper: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
  },
  legendLabel: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
    flexShrink: 1,
  },
  legendLabelDark: {
    color: "#D1D5DB",
  },
  legendValue: {
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  legendValueDark: {
    color: "#D1D5DB",
  },
  transactionTitle: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 24,
  },
  transactionTitleDark: {
    color: "#F9FAFB",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
    color: "#000",
  },
  nameDark: {
    color: "#F9FAFB",
  },
  date: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  dateDark: {
    color: "#D1D5DB",
  },
  amount: {
    fontWeight: "500",
    fontSize: 16,
  },
});

export default TransactionScreen;