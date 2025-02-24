import React from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigation } from "@react-navigation/bottom-tabs";

const HomeScreen = ({ navigation }) => {
  const onProfile = () => navigation.navigate("Profile");
  const onReports = () => navigation.navigate("Reports");
  const onBudget = () => navigation.navigate("Budget");
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
            <TouchableOpacity>
              <View style={styles.actionCard}>
                <Ionicons name="add-circle-outline" size={24} color="#2563EB" />
                <Text style={styles.actionText}>Add</Text>
              </View>
            </TouchableOpacity>

            {/* Transfer */}
            <TouchableOpacity>
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
                <Text style={styles.incomeInfo}>+ 32000.00</Text>
              </View>
            </View>
          </View>

          {/*Budget Overview */}
          <View style={styles.budgetOverview}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetOverviewText}>Budget Overview</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    fontWeight: 500,
    fontSize: 14,
    color: "#000",
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
    fontWeight: 500,
    fontSize: 14,
    color: "#fff",
  },
  balanceAmount: {
    fontWeight: 700,
    fontSize: 30,
    color: "#fff",
  },
  balanceGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceReport: {
    fontSize: 14,
    fontWeight: 500,
    color: "#fff",
    zIndex: 1,
  },
  reportbkg: {
    backgroundColor: "#FFFFFF33",
    borderRadius: 100,
    padding: 4,
  },
  balanceReportText: {
    color: "#fff",
    fontWeight: 500,
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
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  actionText: {
    color: "#4B5563",
    fontWeight: 500,
    fontSize: 12,
  },
  recentTransactions: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 24,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  recentAll: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: 500,
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
    backgroundColor: "#F3F4F6",
    borderRadius: 100,
    padding: 10,
    marginRight: 12,
  },
  expenseText: {
    fontWeight: 500,
    fontSize: 16,
    color: "#000",
  },
  expenseDate: {
    fontWeight: 500,
    fontSize: 14,
    color: "#6B7280",
  },
  expenseInfo: {
    fontWeight: 600,
    fontSize: 16,
    color: "#000",
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
    fontWeight: 500,
    fontSize: 16,
    color: "#000",
  },
  incomeDate: {
    fontWeight: 500,
    fontSize: 14,
    color: "#6B7280",
  },
  incomeInfo: {
    fontWeight: 600,
    fontSize: 16,
    color: "#16A34A",
  },
  budgetOverview: {
    backgroundColor: "#fff",
    padding: 20,
  },
  budgetOverviewText: {
    fontWeight: 600,
    fontSize: 16,
    color: "#000",
  },
});

export default HomeScreen;
