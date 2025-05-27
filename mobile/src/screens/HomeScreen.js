// src/screens/HomeScreen.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
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
  Animated,
  StatusBar,
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

// Функция для получения тематических стилей (вынесена наружу)
const getThemedStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
    },
    scrollContainer: {
      paddingBottom: 32,
    },
    containerInner: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 32,
      paddingHorizontal: 4,
    },
    headerGroup: {
      flexDirection: "row",
      alignItems: "center",
    },
    profileImageContainer: {
      position: "relative",
      marginRight: 16,
    },
    headerImg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 3,
      borderColor: isDark ? "#374151" : "#FFFFFF",
    },
    onlineIndicator: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#22C55E",
      borderWidth: 2,
      borderColor: isDark ? "#0F172A" : "#F8FAFC",
    },
    greetingText: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginBottom: 2,
    },
    headerText: {
      fontWeight: "600",
      fontSize: 20,
      color: isDark ? "#F9FAFB" : "#111827",
    },
    notificationButton: {
      position: "relative",
    },
    notificationGradient: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    notificationBadge: {
      position: "absolute",
      top: -2,
      right: -2,
      backgroundColor: "#EF4444",
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    notificationBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
    },
    totalBalance: {
      marginBottom: 32,
    },
    balanceCardGradient: {
      borderRadius: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
    balanceCard: {
      padding: 28,
      position: "relative",
      overflow: "hidden",
    },
    balanceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    balanceTitle: {
      fontWeight: "500",
      fontSize: 16,
      color: "#FFFFFF",
      opacity: 0.9,
    },
    balanceIconContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 12,
      padding: 8,
    },
    balanceLoadingContainer: {
      paddingVertical: 20,
      alignItems: "center",
    },
    balanceAmountContainer: {
      marginBottom: 20,
    },
    balanceAmount: {
      fontWeight: "700",
      fontSize: 36,
      color: "#FFFFFF",
      marginBottom: 8,
    },
    balanceChangeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    reportbkg: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    balanceReport: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    balanceReportText: {
      color: "#FFFFFF",
      fontWeight: "500",
      fontSize: 14,
      opacity: 0.8,
      marginLeft: 8,
    },
    decorativeCircle1: {
      position: "absolute",
      top: -50,
      right: -50,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    decorativeCircle2: {
      position: "absolute",
      bottom: -30,
      left: -30,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
    },
    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 32,
      paddingHorizontal: 8,
    },
    actionCard: {
      width: (screenWidth - 64) / 4,
      height: 80,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    actionIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    actionText: {
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
    },
    recentTransactions: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    recentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    recentTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#111827",
    },
    seeAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 4,
    },
    recentAll: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "500",
    },
    recentGroup: {
      // Added this missing style
    },
    skeletonTransaction: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    expenseCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      paddingVertical: 4,
    },
    recentCardGroup: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    expenseIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    expenseTitle: {
      flex: 1,
    },
    expenseText: {
      fontWeight: "500",
      fontSize: 16,
      color: isDark ? "#F3F4F6" : "#111827",
      marginBottom: 2,
    },
    expenseDate: {
      fontWeight: "400",
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    expenseInfo: {
      fontWeight: "600",
      fontSize: 16,
      color: isDark ? "#FFFFFF" : "#111827",
    },
    incomeCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      paddingVertical: 4,
    },
    incomeIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    incomeText: {
      fontWeight: "500",
      fontSize: 16,
      color: isDark ? "#F3F4F6" : "#111827",
      marginBottom: 2,
    },
    incomeInfo: {
      fontWeight: "600",
      fontSize: 16,
      color: "#16A34A",
    },
    budgetOverview: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    budgetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    budgetOverviewText: {
      fontWeight: "600",
      fontSize: 18,
      color: isDark ? "#F3F4F6" : "#111827",
    },
    budgetList: {
      gap: 20,
    },
    skeletonBudget: {
      paddingVertical: 8,
    },
    noBudgetsContainer: {
      alignItems: "center",
      paddingVertical: 32,
    },
    noBudgetsText: {
      fontSize: 16,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 12,
    },
    budgetItem: {
      paddingVertical: 8,
    },
    budgetItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    budgetCategory: {
      fontWeight: "500",
      fontSize: 16,
      color: isDark ? "#D1D5DB" : "#111827",
    },
    budgetAmount: {
      fontWeight: "500",
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    budgetWarning: {
      fontSize: 12,
      color: "#EF4444",
      marginTop: 4,
      fontWeight: "500",
    },
    monthlyExpenses: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 20,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    expensesHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    monthlyExpensesText: {
      fontWeight: "600",
      fontSize: 18,
      color: isDark ? "#F3F4F6" : "#111827",
    },
    chartLegend: {
      flexDirection: "row",
      alignItems: "center",
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#2563EB",
      marginRight: 6,
    },
    legendText: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    chartLoadingContainer: {
      alignItems: "center",
      paddingVertical: 40,
    },
    chartLoadingText: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 12,
    },
    noDataContainer: {
      alignItems: "center",
      paddingVertical: 40,
    },
    noDataText: {
      fontSize: 16,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 12,
    },
    chartContainer: {
      alignItems: "center",
    },
  });

// Компонент скелетон лоадера
const SkeletonLoader = ({ width, height, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: "#E1E5E9",
          borderRadius: 8,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Анимированная карточка действия
const AnimatedActionCard = ({ onPress, icon, text, delay = 0, isDark, styles }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        delay,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, slideAnim, delay]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
      }}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={isDark ? ["#1F2937", "#374151"] : ["#FFFFFF", "#F8FAFC"]}
          style={[styles.actionCard, { 
            shadowColor: isDark ? "#000" : "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 8,
          }]}
        >
          <View style={[styles.actionIconContainer, {
            backgroundColor: isDark ? "#2563EB" : "#EFF6FF"
          }]}>
            <Ionicons name={icon} size={24} color={isDark ? "#FFFFFF" : "#2563EB"} />
          </View>
          <Text style={[styles.actionText, { color: isDark ? "#F9FAFB" : "#374151" }]}>
            {text}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Анимированная карточка транзакции
const AnimatedTransactionCard = ({ transaction, isDark, index, styles }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay: index * 150,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        delay: index * 150,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const isExpense = transaction.transaction_type === "expense";
  const sign = isExpense ? "-" : "+";
  const date = new Date(transaction.transaction_date).toLocaleDateString();
  const Icon = IconCmp(transaction.category_icon || "");

  return (
    <Animated.View
      style={[
        isExpense ? styles.expenseCard : styles.incomeCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.recentCardGroup}>
        <LinearGradient
          colors={isExpense 
            ? (isDark ? ["#374151", "#4B5563"] : ["#F3F4F6", "#E5E7EB"])
            : ["#DCFCE7", "#BBF7D0"]
          }
          style={isExpense ? styles.expenseIcon : styles.incomeIcon}
        >
          <Icon
            name={transaction.category_icon || "card-outline"}
            size={20}
            color={transaction.category_color || "#4B5563"}
          />
        </LinearGradient>
        <View style={styles.expenseTitle}>
          <Text style={isExpense ? styles.expenseText : styles.incomeText}>
            {transaction.description}
          </Text>
          <Text style={styles.expenseDate}>{date}</Text>
        </View>
      </View>
      <Text style={isExpense ? styles.expenseInfo : styles.incomeInfo}>
        {sign} {transaction.amount.toFixed(2)}
      </Text>
    </Animated.View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  // Анимации
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const balanceScaleAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(50)).current;
  const chartFadeAnim = useRef(new Animated.Value(0)).current;

  // Состояния
  const [userName, setUserName] = useState("");
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [previousMonthBalance, setPreviousMonthBalance] = useState(0);
  const [balanceChange, setBalanceChange] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [monthlyExpensesData, setMonthlyExpensesData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [budgets, setBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  // Запуск входных анимаций
  const startEntranceAnimations = useCallback(() => {
    Animated.stagger(200, [
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(balanceScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(chartFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerFadeAnim, balanceScaleAnim, contentSlideAnim, chartFadeAnim]);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
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
    } finally {
      setLoadingTransactions(false);
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
      startEntranceAnimations();
    }, [fetchTransactions, fetchBalancesForComparison, fetchTotalBalance, fetchExpensesForChart, fetchBudgets, startEntranceAnimations])
  );

  useEffect(() => {
    fetchTransactions();
    fetchBalancesForComparison();
    fetchTotalBalance();
    fetchExpensesForChart();
    fetchBudgets();
    startEntranceAnimations();
  }, [fetchTransactions, fetchBalancesForComparison, fetchTotalBalance, fetchExpensesForChart, fetchBudgets, startEntranceAnimations]);

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
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0F172A" : "#F8FAFC"}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.containerInner}>
          
          {/* Animated Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: headerFadeAnim,
              }
            ]}
          >
            <View style={styles.headerGroup}>
              <TouchableOpacity onPress={onProfile} activeOpacity={0.8}>
                <View style={styles.profileImageContainer}>
                  <Image
                    style={styles.headerImg}
                    source={require("../../assets/walter.png")}
                  />
                  <View style={styles.onlineIndicator} />
                </View>
              </TouchableOpacity>
              <View>
                <Text style={styles.greetingText}>
                  {t('home.welcome_back')} 👋
                </Text>
                <Text style={styles.headerText}>
                  {userName || "User"}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={onNotifications} 
              style={styles.notificationButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDark ? ["#374151", "#4B5563"] : ["#FFFFFF", "#F8FAFC"]}
                style={styles.notificationGradient}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={isDark ? "#F9FAFB" : "#4B5563"}
                />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>3</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Animated Balance Card */}
          <Animated.View 
            style={[
              styles.totalBalance,
              {
                transform: [{ scale: balanceScaleAnim }],
              }
            ]}
          >
            <LinearGradient
              colors={["#2563EB", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCardGradient}
            >
              <View style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceTitle}>{t('home.total_balance')}</Text>
                  <View style={styles.balanceIconContainer}>
                    <Ionicons name="wallet" size={20} color="#FFFFFF" />
                  </View>
                </View>
                
                {loadingBalance ? (
                  <View style={styles.balanceLoadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : (
                  <View style={styles.balanceAmountContainer}>
                    <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
                    <View style={styles.balanceChangeContainer}>
                      <View style={styles.reportbkg}>
                        {renderBalanceChange()}
                      </View>
                      <Text style={styles.balanceReportText}> {t('home.vs_last_month')}</Text>
                    </View>
                  </View>
                )}

                {/* Decorative elements */}
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Animated Actions */}
          <Animated.View 
            style={[
              styles.actions,
              {
                transform: [{ translateY: contentSlideAnim }],
              }
            ]}
          >
            <AnimatedActionCard
              onPress={onTransactionAdd}
              icon="add-circle-outline"
              text={t('home.actions.add')}
              delay={0}
              isDark={isDark}
              styles={styles}
            />
            <AnimatedActionCard
              onPress={onTransfer}
              icon="arrow-forward-outline"
              text={t('home.actions.transfer')}
              delay={100}
              isDark={isDark}
              styles={styles}
            />
            <AnimatedActionCard
              onPress={onBudget}
              icon="pie-chart-outline"
              text={t('home.actions.budget')}
              delay={200}
              isDark={isDark}
              styles={styles}
            />
            <AnimatedActionCard
              onPress={onReports}
              icon="stats-chart-outline"
              text={t('home.actions.reports')}
              delay={300}
              isDark={isDark}
              styles={styles}
            />
          </Animated.View>

          {/* Recent Transactions */}
          <Animated.View 
            style={[
              styles.recentTransactions,
              {
                transform: [{ translateY: contentSlideAnim }],
              }
            ]}
          >
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>{t('home.recent_transactions')}</Text>
              <TouchableOpacity onPress={onAllTransactions} activeOpacity={0.7}>
                <LinearGradient
                  colors={["#2563EB", "#3B82F6"]}
                  style={styles.seeAllButton}
                >
                  <Text style={styles.recentAll}>{t('home.see_all')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            <View style={styles.recentGroup}>
              {loadingTransactions ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <View key={index} style={styles.skeletonTransaction}>
                    <SkeletonLoader width={40} height={40} style={{ borderRadius: 20 }} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <SkeletonLoader width="60%" height={16} style={{ marginBottom: 4 }} />
                      <SkeletonLoader width="40%" height={12} />
                    </View>
                    <SkeletonLoader width={60} height={16} />
                  </View>
                ))
              ) : (
                recentTransactions.map((tx, index) => (
                  <AnimatedTransactionCard
                    key={tx.id}
                    transaction={tx}
                    isDark={isDark}
                    index={index}
                    styles={styles}
                  />
                ))
              )}
            </View>
          </Animated.View>

          {/* Budget Overview */}
          <Animated.View 
            style={[
              styles.budgetOverview,
              {
                transform: [{ translateY: contentSlideAnim }],
              }
            ]}
          >
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetOverviewText}>{t('home.budget_overview')}</Text>
              <TouchableOpacity onPress={onBudget}>
                <Ionicons name="settings-outline" size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.budgetList}>
              {loadingBudgets ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <View key={index} style={styles.skeletonBudget}>
                    <View style={styles.budgetItemHeader}>
                      <SkeletonLoader width="40%" height={16} />
                      <SkeletonLoader width="30%" height={14} />
                    </View>
                    <SkeletonLoader width="100%" height={8} style={{ marginTop: 8, borderRadius: 4 }} />
                  </View>
                ))
              ) : budgets.length === 0 ? (
                <View style={styles.noBudgetsContainer}>
                  <Ionicons name="pie-chart-outline" size={32} color={isDark ? "#6B7280" : "#9CA3AF"} />
                  <Text style={styles.noBudgetsText}>{t('home.no_budgets')}</Text>
                </View>
              ) : (
                budgets.map((item, index) => {
                  const progress = item.spent_amount / item.amount;
                  return (
                    <Animated.View 
                      key={item.id} 
                      style={[
                        styles.budgetItem,
                        {
                          opacity: chartFadeAnim,
                          transform: [{
                            translateY: chartFadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [30, 0],
                            })
                          }]
                        }
                      ]}
                    >
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
                        unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                        borderWidth={0}
                        style={{ marginTop: 8 }}
                      />
                      {progress > 0.8 && (
                        <Text style={styles.budgetWarning}>
                          {progress > 1 ? "⚠️ Over budget!" : "⚠️ Near limit"}
                        </Text>
                      )}
                    </Animated.View>
                  );
                })
              )}
            </View>
          </Animated.View>

          {/* Monthly Expenses Chart */}
          <Animated.View 
            style={[
              styles.monthlyExpenses,
              {
                opacity: chartFadeAnim,
              }
            ]}
          >
            <View style={styles.expensesHeader}>
              <Text style={styles.monthlyExpensesText}>{t('home.monthly_expenses')}</Text>
              <View style={styles.chartLegend}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
            </View>

            {loadingChart ? (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.chartLoadingText}>Loading chart data...</Text>
              </View>
            ) : monthlyExpensesData.labels.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Ionicons name="bar-chart-outline" size={48} color={isDark ? "#6B7280" : "#9CA3AF"} />
                <Text style={styles.noDataText}>{t('home.no_data')}</Text>
              </View>
            ) : (
              <View style={styles.chartContainer}>
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
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;