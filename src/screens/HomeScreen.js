import React, { useContext, version } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Progress from "react-native-progress";
import { BarChart } from "react-native-chart-kit";
import { ThemeContext } from "../context/ThemeContext";

const screenWidth = Dimensions.get("window").width;

const HomeScreen = ({ navigation }) => {
  const onProfile = () => navigation.navigate("Profile");
  const onTransactionAdd = () => navigation.navigate("TransactionAdd");
  const onReports = () => navigation.navigate("Reports");
  const onBudget = () => navigation.navigate("Budget");
  const onTransfer = () => navigation.navigate("Transfer");

  // Sample Budget Data
  const budgetData = [
    { category: "Shopping", spent: 820, total: 1000, color: "#2563EB" },
    { category: "Food", spent: 450, total: 600, color: "#F59E0B" },
    { category: "Transport", spent: 200, total: 400, color: "#22C55E" },
    { category: "Body-Massage", spent: 9800, total: 15000, color: "#8B5CF6" },
  ];

  // Sample Expense Data
  const monthlyExpensesData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        data: [300, 420, 280, 520, 610, 450, 380], // Example amounts
      },
    ],
  };

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false} // Отключает эффект перетягивания вверх/вниз на iOS
        overScrollMode="never" // Отключает overscroll на Android
        showsVerticalScrollIndicator={false} // Скрывает полосу прокрутки
      >
        <View style={styles.containerInner}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerGroup}>
              <TouchableOpacity onPress={onProfile}>
                <Image
                  style={styles.headerImg}
                  source={require("../../assets/walter.png")}
                />
              </TouchableOpacity>
              <Text style={styles.headerText}>Welcome back, Walter</Text>
            </View>
            <TouchableOpacity>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#4B5563"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.totalBalance}>
            <LinearGradient
              colors={["#2563EB", "#3B82F6"]} // Gradient colors
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCardGradient} // New style for gradient
            >
              <View style={styles.balanceCard}>
                <Text style={styles.balanceTitle}>Total Balance</Text>
                <Text style={styles.balanceAmount}>$24,580.45</Text>
                <View style={styles.balanceGroup}>
                  <View style={styles.reportbkg}>
                    <Text style={styles.balanceReport}>+$1,245 (5.2%)</Text>
                  </View>
                  <Text style={styles.balanceReportText}> vs last month</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {/* Add */}
            <TouchableOpacity onPress={onTransactionAdd}>
              <View style={styles.actionCard}>
                <Ionicons name="add-circle-outline" size={24} color="#2563EB" />
                <Text style={styles.actionText}>Add</Text>
              </View>
            </TouchableOpacity>

            {/* Transfer */}
            <TouchableOpacity onPress={onTransfer}>
              <View style={styles.actionCard}>
                <Ionicons name="card-outline" size={24} color="#2563EB" />
                <Text style={styles.actionText}>Transfer</Text>
              </View>
            </TouchableOpacity>

            {/* Budget */}
            <TouchableOpacity onPress={onBudget}>
              <View style={styles.actionCard}>
                <Ionicons name="pie-chart-outline" size={24} color="#2563EB" />
                <Text style={styles.actionText}>Budget</Text>
              </View>
            </TouchableOpacity>

            {/* Reports */}
            <TouchableOpacity onPress={onReports}>
              <View style={styles.actionCard}>
                <Ionicons
                  name="stats-chart-outline"
                  size={24}
                  color="#2563EB"
                />
                <Text style={styles.actionText}>Reports</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent Transactions */}
          <View style={styles.recentTransactions}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent Transactions</Text>
              <TouchableOpacity>
                <Text style={styles.recentAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentGroup}>
              <View style={styles.expenseCard}>
                <View style={styles.recentCardGroup}>
                  <View style={styles.expenseIcon}>
                    <Ionicons name="cart" size={20} color="#4B5563" />
                  </View>
                  <View style={styles.expenseTitle}>
                    <Text style={styles.expenseText}>Grocery Shopping</Text>
                    <Text style={styles.expenseDate}>Today</Text>
                  </View>
                </View>
                <Text style={styles.expenseInfo}>-82.45</Text>
              </View>

              <View style={styles.expenseCard}>
                <View style={styles.recentCardGroup}>
                  <View style={styles.expenseIcon}>
                    <Ionicons name="car" size={20} color="#4B5563" />
                  </View>
                  <View style={styles.expenseTitle}>
                    <Text style={styles.expenseText}>Car Insurance</Text>
                    <Text style={styles.expenseDate}>Yesterday</Text>
                  </View>
                </View>
                <Text style={styles.expenseInfo}>-145.00</Text>
              </View>

              <View style={styles.expenseCard}>
                <View style={styles.recentCardGroup}>
                  <View style={styles.expenseIcon}>
                    <Ionicons name="restaurant" size={20} color="#4B5563" />
                    <Image />
                  </View>
                  <View style={styles.expenseTitle}>
                    <Text style={styles.expenseText}>Restaurant</Text>
                    <Text style={styles.expenseDate}>Yesterday</Text>
                  </View>
                </View>
                <Text style={styles.expenseInfo}>-35.50</Text>
              </View>

              <View style={styles.incomeCard}>
                <View style={styles.recentCardGroup}>
                  <View style={styles.incomeIcon}>
                    <Ionicons name="wallet-outline" size={20} color="#16A34A" />
                    <Image />
                  </View>
                  <View style={styles.incomeTitle}>
                    <Text style={styles.incomeText}>Salary Deposit</Text>
                    <Text style={styles.incomeDate}>Jan 25</Text>
                  </View>
                </View>
                <Text style={styles.incomeInfo}>+ 3200.00</Text>
              </View>
            </View>
          </View>

          {/* Budget Overview */}
          <View style={styles.budgetOverview}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetOverviewText}>Budget Overview</Text>
            </View>

            {/* Map over budgetData to show each category's progress */}
            <View style={styles.budgetList}>
              {budgetData.map((item, index) => {
                const progress = item.spent / item.total;
                return (
                  <View key={index} style={styles.budgetItem}>
                    {/* Category + Amount */}
                    <View style={styles.budgetItemHeader}>
                      <Text style={styles.budgetCategory}>{item.category}</Text>
                      <Text style={styles.budgetAmount}>
                        ${item.spent} / ${item.total}
                      </Text>
                    </View>
                    {/* Progress Bar */}
                    <Progress.Bar
                      progress={progress}
                      width={null}
                      height={8}
                      color={item.color}
                      unfilledColor="#F3F4F6"
                      borderWidth={0}
                      style={{ marginTop: 8 }}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* Monthly Expenses */}
          <View style={styles.monthlyExpenses}>
            <View style={styles.expensesHeader}>
              <Text style={styles.monthlyExpensesText}>Monthly Expenses</Text>
            </View>

            {/* Bar Chart */}
            <BarChart
              data={monthlyExpensesData}
              width={screenWidth - 40} // Adjust for screen padding
              height={200}
              yAxisLabel="$"
              fromZero
              showValuesOnTopOfBars
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Bars color
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Label color
                style: {
                  borderRadius: 16,
                },
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
    },
    header: {
      height: 64,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      position: "static",
      marginBottom: 24,
    },
    headerGroup: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerImg: {
      width: 32,
      height: 32,
      borderRadius: 100,
    },
    headerText: {
      fontWeight: "500",
      fontSize: 14,
      color: isDark ? "#F9FAFB" : "#000",
      marginLeft: 12,
    },
    totalBalance: {
      paddingHorizontal: 20,
    },
    balanceCardGradient: {
      borderRadius: 16,
    },
    balanceCard: {
      height: 144,
      width: "100%",
      margin: "auto",
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
    balanceReport: {
      fontSize: 14,
      fontWeight: "500",
      color: "#FFFFFF",
      zIndex: 1,
    },
    reportbkg: {
      backgroundColor: "#FFFFFF33",
      borderRadius: 100,
      padding: 4,
    },
    balanceReportText: {
      color: "#FFFFFF",
      fontWeight: "500",
      fontSize: 14,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 24,
      justifyContent: "space-around",
    },
    actionCard: {
      width: 75,
      height: 68,
      alignItems: "center",
      justifyContent: "space-around",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 12,
    },
    actionText: {
      color: isDark ? "#D1D5DB" : "#4B5563",
      fontWeight: "500",
      fontSize: 12,
    },
    recentTransactions: {
      padding: 20,
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      marginBottom: 24,
    },
    recentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 17,
    },
    recentTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000",
    },
    recentAll: {
      color: "#2563EB",
      fontSize: 14,
      fontWeight: "500",
    },
    expenseCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 17,
    },
    recentCardGroup: {
      flexDirection: "row",
      alignItems: "center",
    },
    expenseIcon: {
      width: 40,
      height: 40,
      backgroundColor: isDark ? "#374151" : "#F3F4F6",
      borderRadius: 100,
      padding: 10,
      marginRight: 12,
    },
    expenseText: {
      fontWeight: "500",
      fontSize: 16,
      color: isDark ? "#F3F4F6" : "#000",
    },
    expenseDate: {
      fontWeight: "500",
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    expenseInfo: {
      fontWeight: "600",
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#000",
    },
    incomeCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    incomeIcon: {
      width: 40,
      height: 40,
      backgroundColor: "#DCFCE7",
      borderRadius: 100,
      padding: 10,
      marginRight: 12,
    },
    incomeText: {
      fontWeight: "500",
      fontSize: 16,
      color: isDark ? "#F3F4F6" : "#000",
    },
    incomeDate: {
      fontWeight: "500",
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    incomeInfo: {
      fontWeight: "600",
      fontSize: 16,
      color: "#16A34A",
    },
    budgetOverview: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 20,
      height: 270,
      marginBottom: 24,
    },
    budgetOverviewText: {
      fontWeight: "600",
      fontSize: 16,
      color: isDark ? "#F3F4F6" : "#000",
    },
    budgetList: {
      flex: 1,
      justifyContent: "space-around",
      marginTop: 16,
    },
    budgetItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    budgetCategory: {
      fontWeight: "500",
      fontSize: 14,
      color: isDark ? "#D1D5DB" : "#000",
    },
    budgetAmount: {
      fontWeight: "500",
      fontSize: 14,
      color: isDark ? "#D1D5DB" : "#000",
    },
    monthlyExpenses: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 20,
      height: 280,
      marginBottom: 24,
    },
    monthlyExpensesText: {
      fontWeight: "600",
      fontSize: 16,
      marginBottom: 20,
      color: isDark ? "#F3F4F6" : "#111",
    },
    expensesHeader: {
      marginBottom: 12,
    },
  });

export default HomeScreen;
