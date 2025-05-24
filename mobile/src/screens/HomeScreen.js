// src/screens/HomeScreen.js - ПОЛНАЯ ВЕРСИЯ С ПЕРЕВОДАМИ

import React, { useContext, useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Progress from "react-native-progress";
import { BarChart } from "react-native-chart-kit";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";

const screenWidth = Dimensions.get("window").width;

const IconCmp = (iconName) =>
  iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

const formatDate = (date) => date.toISOString().slice(0, 10);

const getMonthDateRange = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return { firstDay, lastDay };
};

const HomeScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  const [userName, setUserName] = useState("");
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [previousMonthBalance, setPreviousMonthBalance] = useState(0);
  const [balanceChange, setBalanceChange] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [monthlyExpensesData, setMonthlyExpensesData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });

  const [budgets, setBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const resTx = await apiFetch("/api/v1/transactions/?skip=0&limit=100");
      if (!resTx.ok) throw new Error(`Status ${resTx.status}`);
      const { transactions } = await resTx.json();
      const sorted = transactions
        .sort(
          (a, b) =>
            new Date(b.transaction_date) - new Date(a.transaction_date)
        )
        .slice(0, 4);
      setRecentTransactions(sorted);
    } catch (err) {
      console.error("Не удалось загрузить транзакции:", err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const resUser = await apiFetch("/api/v1/users/me");
        if (resUser.ok) {
          const userData = await resUser.json();
          setUserName(userData.full_name);
        }
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      }
    })();
  }, []);

  const fetchAllTransactionsAndCalculateBalance = useCallback(async () => {
    let allTransactions = [];
    let skip = 0;
    const limit = 500;
    let hasMore = true;

    while (hasMore) {
      const res = await apiFetch(`/api/v1/transactions/?skip=${skip}&limit=${limit}`);
      if (!res.ok) throw new Error(`Ошибка загрузки транзакций: ${res.status}`);
      const data = await res.json();

      allTransactions = [...allTransactions, ...data.transactions];

      if (data.transactions.length < limit) {
        hasMore = false;
      } else {
        skip += limit;
      }
    }

    let income = 0;
    let expense = 0;
    allTransactions.forEach((tx) => {
      if (tx.transaction_type === "income") income += tx.amount;
      else if (tx.transaction_type === "expense") expense += tx.amount;
    });

    return income - expense;
  }, []);

  const fetchExpensesForChart = useCallback(async () => {
    setLoadingChart(true);
    try {
      let allExpenses = [];
      let skip = 0;
      const limit = 500;
      let hasMore = true;

      while (hasMore) {
        const res = await apiFetch(`/api/v1/transactions/?transaction_type=expense&skip=${skip}&limit=${limit}`);
        if (!res.ok) throw new Error("Ошибка загрузки транзакций");
        const { transactions } = await res.json();
        allExpenses = [...allExpenses, ...transactions];
        if (transactions.length < limit) hasMore = false;
        else skip += limit;
      }

      const monthlyTotals = {};
      allExpenses.forEach(({ amount, transaction_date }) => {
        const date = new Date(transaction_date);
        const month = date.toLocaleString("en-US", { month: "short" });
        const year = date.getFullYear();
        const key = `${month} ${year}`;
        monthlyTotals[key] = (monthlyTotals[key] || 0) + amount;
      });

      const sortedKeys = Object.keys(monthlyTotals).sort((a, b) => {
        const [monthA, yearA] = a.split(" ");
        const [monthB, yearB] = b.split(" ");
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA - dateB;
      });

      const last7Months = sortedKeys.slice(-7);

      setMonthlyExpensesData({
        labels: last7Months,
        datasets: [{ data: last7Months.map((key) => monthlyTotals[key]) }],
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  const fetchMonthTransactions = useCallback(async (startDate, endDate) => {
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

    const url = `/api/v1/transactions/?start_date=${formatDate(startDate)}&end_date=${formatDate(adjustedEndDate)}&skip=0&limit=1000`;
    const res = await apiFetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.transactions;
  }, []);

  const fetchBalancesForComparison = useCallback(async () => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const { firstDay: currentMonthStart, lastDay: currentMonthEnd } =
        getMonthDateRange(currentYear, currentMonth);

      const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
      const prevYear = prevMonthDate.getFullYear();
      const prevMonth = prevMonthDate.getMonth();
      const { firstDay: prevMonthStart, lastDay: prevMonthEnd } =
        getMonthDateRange(prevYear, prevMonth);

      const currentMonthTx = await fetchMonthTransactions(
        currentMonthStart,
        currentMonthEnd
      );
      const prevMonthTx = await fetchMonthTransactions(prevMonthStart, prevMonthEnd);

      const calculateBalance = (transactions) => {
        let income = 0;
        let expense = 0;
        transactions.forEach((tx) => {
          if (tx.transaction_type === "income") income += tx.amount;
          else if (tx.transaction_type === "expense") expense += tx.amount;
        });
        return income - expense;
      };

      const currentBalance = calculateBalance(currentMonthTx);
      const previousBalance = calculateBalance(prevMonthTx);

      setPreviousMonthBalance(previousBalance);

      if (previousBalance !== 0) {
        const changePercent =
          ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100;
        setBalanceChange(changePercent);
      } else {
        setBalanceChange(null);
      }
    } catch (error) {
      console.error("Ошибка при загрузке баланса для сравнения:", error);
      setBalanceChange(null);
    }
  }, [fetchMonthTransactions]);

  const fetchTotalBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const total = await fetchAllTransactionsAndCalculateBalance();
      setTotalBalance(total);
    } catch (error) {
      console.error("Ошибка при загрузке общего баланса:", error);
    } finally {
      setLoadingBalance(false);
    }
  }, [fetchAllTransactionsAndCalculateBalance]);

  const fetchBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const response = await apiFetch("/api/v1/budgets/current-month");
      if (!response.ok) throw new Error("Failed to load budgets");
      const data = await response.json();
      setBudgets(data.budgets_by_category || []);
    } catch (error) {
      console.error("Ошибка загрузки бюджетов:", error);
    } finally {
      setLoadingBudgets(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
      fetchBalancesForComparison();
      fetchTotalBalance();
      fetchExpensesForChart();
      fetchBudgets();
    }, [fetchTransactions, fetchBalancesForComparison, fetchTotalBalance, fetchExpensesForChart, fetchBudgets])
  );

  useEffect(() => {
    fetchTransactions();
    fetchBalancesForComparison();
    fetchTotalBalance();
    fetchExpensesForChart();
    fetchBudgets();
  }, [fetchTransactions, fetchBalancesForComparison, fetchTotalBalance, fetchExpensesForChart, fetchBudgets]);

  const onProfile = () => navigation.navigate("Profile");
  const onTransactionAdd = () => navigation.navigate("Transaction Add");
  const onReports = () => navigation.navigate("Reports");
  const onBudget = () => navigation.navigate("Budget");
  const onTransfer = () => navigation.navigate("Transfer");
  const onNotifications = () => navigation.navigate("Notifications");
  const onAllTransactions = () => navigation.navigate("All Transactions");

  const renderBalanceChange = () => {
    if (balanceChange === null) {
      return <Text style={styles.balanceReport}>{t('home.no_comparison')}</Text>;
    }
    const isPositive = balanceChange >= 0;
    const formattedPercent = Math.abs(balanceChange).toFixed(1);
    const color = isPositive ? "#22C55E" : "#EF4444";
    const sign = isPositive ? "+" : "-";

    return (
      <Text style={[styles.balanceReport, { color }]}>
        {sign}${Math.abs(previousMonthBalance + (balanceChange / 100) * Math.abs(previousMonthBalance)).toFixed(2)} ({sign}{formattedPercent}%)
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.containerInner}>
          <View style={styles.header}>
            <View style={styles.headerGroup}>
              <TouchableOpacity onPress={onProfile}>
                <Image
                  style={styles.headerImg}
                  source={require("../../assets/walter.png")}
                />
              </TouchableOpacity>
              <Text style={styles.headerText}>
                {t('home.welcome_back')}, {userName || "User"}
              </Text>
            </View>
            <TouchableOpacity onPress={onNotifications}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#4B5563"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.totalBalance}>
            <LinearGradient
              colors={["#2563EB", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCardGradient}
            >
              <View style={styles.balanceCard}>
                <Text style={styles.balanceTitle}>{t('home.total_balance')}</Text>
                {loadingBalance ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
                )}
                <View style={styles.balanceGroup}>
                  <View style={styles.reportbkg}>
                    {loadingBalance ? null : renderBalanceChange()}
                  </View>
                  <Text style={styles.balanceReportText}> {t('home.vs_last_month')}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onTransactionAdd}>
              <View style={styles.actionCard}>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color="#2563EB"
                />
                <Text style={styles.actionText}>{t('home.actions.add')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onTransfer}>
              <View style={styles.actionCard}>
                <Ionicons name="card-outline" size={24} color="#2563EB" />
                <Text style={styles.actionText}>{t('home.actions.transfer')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onBudget}>
              <View style={styles.actionCard}>
                <Ionicons
                  name="pie-chart-outline"
                  size={24}
                  color="#2563EB"
                />
                <Text style={styles.actionText}>{t('home.actions.budget')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={onReports}>
              <View style={styles.actionCard}>
                <Ionicons
                  name="stats-chart-outline"
                  size={24}
                  color="#2563EB"
                />
                <Text style={styles.actionText}>{t('home.actions.reports')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.recentTransactions}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>{t('home.recent_transactions')}</Text>
              <TouchableOpacity onPress={onAllTransactions}>
                <Text style={styles.recentAll}>{t('home.see_all')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentGroup}>
              {recentTransactions.map((tx) => {
                const isExpense = tx.transaction_type === "expense";
                const sign = isExpense ? "-" : "+";
                const date = new Date(tx.transaction_date).toLocaleDateString();
                const Icon = IconCmp(tx.category_icon || "");
                return (
                  <View
                    key={tx.id}
                    style={isExpense ? styles.expenseCard : styles.incomeCard}
                  >
                    <View style={styles.recentCardGroup}>
                      <View
                        style={
                          isExpense ? styles.expenseIcon : styles.incomeIcon
                        }
                      >
                        <Icon
                          name={tx.category_icon || "card-outline"}
                          size={20}
                          color={tx.category_color || "#4B5563"}
                        />
                      </View>
                      <View style={styles.expenseTitle}>
                        <Text
                          style={
                            isExpense ? styles.expenseText : styles.incomeText
                          }
                        >
                          {tx.description}
                        </Text>
                        <Text style={styles.expenseDate}>{date}</Text>
                      </View>
                    </View>
                    <Text
                      style={isExpense ? styles.expenseInfo : styles.incomeInfo}
                    >
                      {sign} {tx.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.budgetOverview}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetOverviewText}>{t('home.budget_overview')}</Text>
            </View>
            <View style={styles.budgetList}>
              {loadingBudgets ? (
                <ActivityIndicator size="large" color="#2563EB" />
              ) : budgets.length === 0 ? (
                <Text style={{ color: isDark ? "#FFF" : "#000", textAlign: "center" }}>
                  {t('home.no_budgets')}
                </Text>
              ) : (
                budgets.map((item) => {
                  const progress = item.spent_amount / item.amount;
                  return (
                    <View key={item.id} style={styles.budgetItem}>
                      <View style={styles.budgetItemHeader}>
                        <Text style={styles.budgetCategory}>{item.category_name}</Text>
                        <Text style={styles.budgetAmount}>
                          ${item.spent_amount} / ${item.amount}
                        </Text>
                      </View>
                      <Progress.Bar
                        progress={progress > 1 ? 1 : progress}
                        width={null}
                        height={8}
                        color={item.category_color || "#2563EB"}
                        unfilledColor="#F3F4F6"
                        borderWidth={0}
                        style={{ marginTop: 8 }}
                      />
                    </View>
                  );
                })
              )}
            </View>
          </View>

          <View style={styles.monthlyExpenses}>
            <View style={styles.expensesHeader}>
              <Text style={styles.monthlyExpensesText}>{t('home.monthly_expenses')}</Text>
            </View>

            {loadingChart ? (
              <ActivityIndicator size="large" color="#2563EB" />
            ) : monthlyExpensesData.labels.length === 0 ? (
              <Text style={{ color: isDark ? "#FFF" : "#000", textAlign: "center" }}>
                {t('home.no_data')}
              </Text>
            ) : (
              <BarChart
                data={monthlyExpensesData}
                width={screenWidth - 40}
                height={200}
                yAxisLabel="$"
                fromZero
                showValuesOnTopOfBars
                chartConfig={{
                  backgroundColor: isDark ? "#1F2937" : "#fff",
                  backgroundGradientFrom: isDark ? "#1F2937" : "#fff",
                  backgroundGradientTo: isDark ? "#111827" : "#fff",
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    isDark
                      ? `rgba(255, 255, 255, ${opacity})`
                      : `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForBackgroundLines: {
                    strokeWidth: 0.5,
                    stroke: isDark ? "#374151" : "#E5E7EB",
                  },
                }}
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            )}
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
      marginBottom: 15,
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
      marginBottom: 24,
    },
    budgetOverviewText: {
      fontWeight: "600",
      fontSize: 16,
      color: isDark ? "#F3F4F6" : "#000",
    },
    budgetList: {
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