// src/screens/ReportsScreen.js

import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get("window").width;

const IconCmp = (iconName) =>
  iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

const ReportsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Financial data states
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [incomeChange, setIncomeChange] = useState(0);
  const [expenseChange, setExpenseChange] = useState(0);
  const [budgetStatus, setBudgetStatus] = useState(0);

  // Chart data
  const [chartData, setChartData] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 3,
      }
    ],
  });

  // Spending categories data
  const [spendingCategories, setSpendingCategories] = useState([]);

  const handleExportReport = () => {
    navigation.navigate("Export Report");
  };

  // Fetch last 6 months data for chart
  const fetchChartData = async () => {
    try {
      const now = new Date();
      const monthlyData = [];
      const labels = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const monthName = date.toLocaleString('en', { month: 'short' });
        
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        try {
          const response = await apiFetch(`/api/v1/transactions/?start_date=${startDate}&end_date=${endDate}&limit=1000`);
          
          if (response.ok) {
            const data = await response.json();
            const transactions = data.transactions || [];

            let monthIncome = 0;
            let monthExpenses = 0;

            transactions.forEach(tx => {
              if (tx.transaction_type === "income") {
                monthIncome += tx.amount;
              } else if (tx.transaction_type === "expense") {
                monthExpenses += Math.abs(tx.amount);
              }
            });

            monthlyData.push({ income: monthIncome, expenses: monthExpenses });
            labels.push(monthName);
          } else {
            monthlyData.push({ income: 0, expenses: 0 });
            labels.push(monthName);
          }
        } catch (error) {
          console.error(`Error fetching data for ${monthName}:`, error);
          monthlyData.push({ income: 0, expenses: 0 });
          labels.push(monthName);
        }
      }

      // Update chart data
      setChartData({
        labels,
        datasets: [
          {
            data: monthlyData.map(d => d.income),
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            strokeWidth: 3,
          },
          {
            data: monthlyData.map(d => d.expenses),
            color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
            strokeWidth: 3,
          }
        ],
      });

      // Calculate changes (current month vs previous month)
      if (monthlyData.length >= 2) {
        const currentMonth = monthlyData[monthlyData.length - 1];
        const previousMonth = monthlyData[monthlyData.length - 2];

        if (previousMonth.income > 0) {
          const incomeChangeCalc = ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100;
          setIncomeChange(parseFloat(incomeChangeCalc.toFixed(1)));
        }

        if (previousMonth.expenses > 0) {
          const expenseChangeCalc = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;
          setExpenseChange(parseFloat(expenseChangeCalc.toFixed(1)));
        }
      }

    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  const fetchReportsData = useCallback(async () => {
    try {
      // Fetch current month transactions
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const response = await apiFetch(`/api/v1/transactions/?start_date=${startDate}&end_date=${endDate}&limit=1000`);

      if (!response.ok) {
        console.error("Failed to fetch transactions");
        return;
      }

      const data = await response.json();
      const transactions = data.transactions || [];

      // Calculate current month income and expenses
      let totalIncome = 0;
      let totalExpenses = 0;
      const categorySpending = {};

      transactions.forEach(tx => {
        if (tx.transaction_type === "income") {
          totalIncome += tx.amount;
        } else if (tx.transaction_type === "expense") {
          totalExpenses += Math.abs(tx.amount);

          // Group by category
          const categoryName = tx.category_name || "Other";
          if (!categorySpending[categoryName]) {
            categorySpending[categoryName] = {
              amount: 0,
              icon: tx.category_icon || "ellipsis-horizontal-outline",
              color: tx.category_color || "#6B7280"
            };
          }
          categorySpending[categoryName].amount += Math.abs(tx.amount);
        }
      });

      setIncome(totalIncome);
      setExpenses(totalExpenses);

      // Convert category spending to array and sort by amount
      const categoriesArray = Object.entries(categorySpending)
        .map(([name, data]) => ({
          name,
          amount: data.amount,
          color: data.color,
          icon: data.icon
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6); // Top 6 categories

      setSpendingCategories(categoriesArray);

      // Fetch budget data for budget status
      try {
        const budgetResponse = await apiFetch("/api/v1/budgets/current-month");
        if (budgetResponse.ok) {
          const budgetData = await budgetResponse.json();
          const percentage = budgetData.usage_percentage || 0;
          setBudgetStatus(Math.round(percentage));
        }
      } catch (budgetError) {
        console.log("Budget data not available");
        setBudgetStatus(0);
      }

      // Fetch chart data for last 6 months
      await fetchChartData();

    } catch (error) {
      console.error("Error fetching reports data:", error);
      Alert.alert("Error", "Failed to load reports data. Please try again.");
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReportsData();
    setRefreshing(false);
  }, [fetchReportsData]);

  useFocusEffect(
    useCallback(() => {
      fetchReportsData();
    }, [fetchReportsData])
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchReportsData();
      setLoading(false);
    };

    loadData();
  }, [fetchReportsData]);

  const chartConfig = {
    backgroundColor: isDark ? "#1F2937" : "#ffffff",
    backgroundGradientFrom: isDark ? "#1F2937" : "#ffffff",
    backgroundGradientTo: isDark ? "#1F2937" : "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: isDark ? "#374151" : "#E5E7EB",
      strokeWidth: 1,
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#FFFFFF" : "#000000"}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Financial Reports</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Monthly</Text>
            <Ionicons name="chevron-down" size={16} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Income and Expenses Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Income</Text>
              <View style={[styles.changeIndicator, { backgroundColor: incomeChange >= 0 ? "#DCFCE7" : "#FEE2E2" }]}>
                <Ionicons
                  name={incomeChange >= 0 ? "trending-up" : "trending-down"}
                  size={12}
                  color={incomeChange >= 0 ? "#16A34A" : "#DC2626"}
                />
                <Text style={[styles.changeText, { color: incomeChange >= 0 ? "#16A34A" : "#DC2626" }]}>
                  {incomeChange >= 0 ? "+" : ""}{incomeChange}%
                </Text>
              </View>
            </View>
            <Text style={styles.statAmount}>${income.toLocaleString()}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Expenses</Text>
              <View style={[styles.changeIndicator, { backgroundColor: expenseChange <= 0 ? "#DCFCE7" : "#FEE2E2" }]}>
                <Ionicons
                  name={expenseChange <= 0 ? "trending-down" : "trending-up"}
                  size={12}
                  color={expenseChange <= 0 ? "#16A34A" : "#DC2626"}
                />
                <Text style={[styles.changeText, { color: expenseChange <= 0 ? "#16A34A" : "#DC2626" }]}>
                  {expenseChange >= 0 ? "+" : ""}{expenseChange}%
                </Text>
              </View>
            </View>
            <Text style={styles.statAmount}>${expenses.toLocaleString()}</Text>
          </View>
        </View>

        {/* Budget Status */}
        <View style={styles.budgetCard}>
          <LinearGradient
            colors={["#2563EB", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.budgetGradient}
          >
            <View style={styles.budgetContent}>
              <Text style={styles.budgetLabel}>Budget Status</Text>
              <Text style={styles.budgetPercentage}>{budgetStatus}%</Text>
              <View style={styles.budgetProgressContainer}>
                <View style={styles.budgetProgressBg}>
                  <View
                    style={[
                      styles.budgetProgressFill,
                      { width: `${Math.min(budgetStatus, 100)}%` }
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.budgetSubtext}>
                {budgetStatus < 80 ? "You're on track!" : budgetStatus < 95 ? "Almost at limit" : "Over budget!"}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Income vs Expenses Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Income vs Expenses</Text>
          <View style={styles.chartContainer}>
            {chartData.datasets[0].data.every(val => val === 0) ? (
              <View style={styles.noDataContainer}>
                <Ionicons name="bar-chart-outline" size={48} color={isDark ? "#6B7280" : "#9CA3AF"} />
                <Text style={styles.noDataText}>No data available</Text>
                <Text style={styles.noDataSubtext}>Add some transactions to see your financial trends</Text>
              </View>
            ) : (
              <>
                <LineChart
                  data={chartData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  withInnerLines={false}
                  withOuterLines={false}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  withDots={true}
                  withShadow={false}
                  fromZero={false}
                />
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} />
                    <Text style={styles.legendText}>Income</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                    <Text style={styles.legendText}>Expenses</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Spending Categories */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spending Categories</Text>
          </View>

          <View style={styles.categoriesList}>
            {spendingCategories.length === 0 ? (
              <View style={styles.noCategoriesContainer}>
                <Ionicons name="pie-chart-outline" size={48} color={isDark ? "#6B7280" : "#9CA3AF"} />
                <Text style={styles.noCategoriesText}>No expense categories</Text>
                <Text style={styles.noCategoriesSubtext}>Start adding expenses to see category breakdown</Text>
              </View>
            ) : (
              spendingCategories.map((category, index) => {
                const Icon = IconCmp(category.icon);
                const percentage = expenses > 0 ? Math.round((category.amount / expenses) * 100) : 0;

                return (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryIcon, { backgroundColor: category.color + "20" }]}>
                        <Icon name={category.icon} size={20} color={category.color} />
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>${category.amount.toFixed(2)}</Text>
                      <Text style={styles.categoryPercentage}>{percentage}%</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightsList}>
            <View style={styles.insightItem}>
              <View style={[styles.insightDot, { backgroundColor: incomeChange >= 0 ? "#10B981" : "#F59E0B" }]} />
              <Text style={styles.insightText}>
                {incomeChange >= 0 
                  ? `Your income has increased by ${Math.abs(incomeChange)}% compared to last month.`
                  : incomeChange < 0 
                    ? `Your income has decreased by ${Math.abs(incomeChange)}% compared to last month.`
                    : "No income data available for comparison."
                }
              </Text>
            </View>

            <View style={styles.insightItem}>
              <View style={[styles.insightDot, { backgroundColor: expenseChange <= 0 ? "#10B981" : "#EF4444" }]} />
              <Text style={styles.insightText}>
                {expenseChange > 0 
                  ? `Your expenses have increased by ${Math.abs(expenseChange)}% compared to last month.`
                  : expenseChange < 0 
                    ? `Great! Your expenses have decreased by ${Math.abs(expenseChange)}% compared to last month.`
                    : "No expense data available for comparison."
                }
              </Text>
            </View>

            <View style={styles.insightItem}>
              <View style={[styles.insightDot, { backgroundColor: budgetStatus > 90 ? "#EF4444" : budgetStatus > 70 ? "#F59E0B" : "#10B981" }]} />
              <Text style={styles.insightText}>
                {budgetStatus > 90 
                  ? `You've used ${budgetStatus}% of your budget. Consider reducing expenses.`
                  : budgetStatus > 70 
                    ? `You're at ${budgetStatus}% of your budget. Monitor your spending closely.`
                    : budgetStatus > 0 
                      ? `You're doing well! Only ${budgetStatus}% of your budget used.`
                      : "Set up budgets to get personalized insights."
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Export Report Button */}
        <View style={styles.exportSection}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleExportReport}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#2563EB", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.exportGradient}
            >
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              <Text style={styles.exportButtonText}>Export Report</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDark ? "#F9FAFB" : "#111827",
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    headerButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    headerButtonText: {
      fontSize: 14,
      color: "#2563EB",
      fontWeight: "500",
    },
    statsContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    statHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    statLabel: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      fontWeight: "500",
    },
    changeIndicator: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 12,
      gap: 2,
    },
    changeText: {
      fontSize: 12,
      fontWeight: "600",
    },
    statAmount: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    budgetCard: {
      marginBottom: 24,
      borderRadius: 16,
      overflow: "hidden",
    },
    budgetGradient: {
      padding: 20,
    },
    budgetContent: {
      alignItems: "center",
    },
    budgetLabel: {
      fontSize: 16,
      color: "#FFFFFF",
      fontWeight: "500",
      marginBottom: 8,
    },
    budgetPercentage: {
      fontSize: 36,
      fontWeight: "700",
      color: "#FFFFFF",
      marginBottom: 16,
    },
    budgetProgressContainer: {
      width: "100%",
      marginBottom: 12,
    },
    budgetProgressBg: {
      height: 8,
      backgroundColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: 4,
      overflow: "hidden",
    },
    budgetProgressFill: {
      height: "100%",
      backgroundColor: "#FFFFFF",
      borderRadius: 4,
    },
    budgetSubtext: {
      fontSize: 14,
      color: "#FFFFFF",
      opacity: 0.9,
    },
    chartSection: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    chartContainer: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      minHeight: 280,
    },
    noDataContainer: {
      alignItems: "center",
      paddingVertical: 40,
    },
    noDataText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginTop: 16,
      marginBottom: 8,
    },
    noDataSubtext: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      textAlign: "center",
    },
    chart: {
      borderRadius: 16,
      marginLeft: -15,
    },
    chartLegend: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 24,
      marginTop: 16,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: 14,
      color: isDark ? "#D1D5DB" : "#4B5563",
      fontWeight: "500",
    },
    categoriesSection: {
      marginBottom: 32,
    },
    categoriesList: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      minHeight: 200,
    },
    noCategoriesContainer: {
      alignItems: "center",
      paddingVertical: 40,
    },
    noCategoriesText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginTop: 16,
      marginBottom: 8,
    },
    noCategoriesSubtext: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      textAlign: "center",
    },
    categoryItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#F3F4F6",
    },
    categoryLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    categoryRight: {
      alignItems: "flex-end",
    },
    categoryAmount: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    categoryPercentage: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 2,
    },
    insightsSection: {
      marginBottom: 32,
    },
    insightsList: {
      gap: 16,
    },
    insightItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    insightDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
      marginRight: 12,
      flexShrink: 0,
    },
    insightText: {
      fontSize: 14,
      color: isDark ? "#D1D5DB" : "#4B5563",
      flex: 1,
      lineHeight: 20,
    },
    exportSection: {
      marginBottom: 32,
      paddingBottom: 20,
    },
    exportButton: {
      borderRadius: 12,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    exportGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 24,
      gap: 8,
    },
    exportButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },
  });

export default ReportsScreen;