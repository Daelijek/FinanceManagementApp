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
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart, PieChart } from "react-native-chart-kit";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Financial data states
  const [reportData, setReportData] = useState(null);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [pieChartData, setPieChartData] = useState([]);

  const periods = [
    { key: "weekly", label: t('reports.weekly_summary') || "Weekly Summary" },
    { key: "monthly", label: t('reports.monthly_summary') || "Monthly Summary" },
    { key: "quarterly", label: t('reports.quarterly') || "Quarterly" },
    { key: "yearly", label: t('reports.yearly') || "Yearly" }
  ];

  // Получение данных отчета с бэкенда
  const fetchReportData = useCallback(async () => {
    try {
      let endpoint = "/api/v1/reports/monthly-summary";
      let params = new URLSearchParams();
      
      // Определяем правильный эндпоинт в зависимости от выбранного периода
      switch (selectedPeriod) {
        case "weekly":
          endpoint = "/api/v1/reports/weekly-summary";
          break;
        case "monthly":
          endpoint = "/api/v1/reports/monthly-summary";
          break;
        case "yearly":
          const currentYear = new Date().getFullYear();
          endpoint = "/api/v1/reports/monthly-summary";
          params.append('year', currentYear.toString());
          break;
        case "quarterly":
          endpoint = "/api/v1/reports/monthly-summary";
          // Можно добавить логику для квартальных отчетов
          break;
        default:
          endpoint = "/api/v1/reports/monthly-summary";
      }

      const url = params.toString() ? `${endpoint}?${params}` : endpoint;
      const response = await apiFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Безопасно устанавливаем данные отчета
      const safeReportData = {
        income: data.income || 0,
        expenses: data.expenses || 0,
        net_balance: data.net_balance || 0,
        period_name: data.period_name || getPeriodName(selectedPeriod),
        savings_rate: data.savings_rate || 0,
        budget_total: data.budget_total || 0,
        budget_used: data.budget_used || 0,
        budget_remaining: data.budget_remaining || 0,
        budget_percentage: data.budget_percentage || 0,
        transaction_count: data.transaction_count || 0,
        average_transaction_amount: data.average_transaction_amount || 0,
        largest_expense: data.largest_expense || { amount: 0 },
        most_spending_category: data.most_spending_category || t('common.not_available'),
        spending_categories: data.spending_categories || [],
        insights: data.insights || [],
        daily_data: data.daily_data || []
      };

      setReportData(safeReportData);

      // Обновляем данные для Line Chart (доходы vs расходы)
      await updateChartData(safeReportData);

      // Обновляем данные для Pie Chart (категории)
      updatePieChartData(safeReportData.spending_categories);

    } catch (error) {
      console.error("Error fetching report data:", error);
      
      // Устанавливаем пустые данные в случае ошибки
      setReportData({
        income: 0,
        expenses: 0,
        net_balance: 0,
        period_name: getPeriodName(selectedPeriod),
        savings_rate: 0,
        budget_total: 0,
        budget_used: 0,
        budget_remaining: 0,
        budget_percentage: 0,
        transaction_count: 0,
        average_transaction_amount: 0,
        largest_expense: { amount: 0 },
        most_spending_category: t('common.not_available'),
        spending_categories: [],
        insights: [],
        daily_data: []
      });
      
      setChartData({ labels: [], datasets: [{ data: [] }] });
      setPieChartData([]);
      
      Alert.alert(t('common.error'), t('reports.failed_to_load') || "Failed to load report data. Please try again.");
    }
  }, [selectedPeriod, isDark, t]);

  // Получение данных для графика из транзакций
  const updateChartData = useCallback(async (reportData) => {
    try {
      // Если есть daily_data в ответе, используем их
      if (reportData.daily_data && reportData.daily_data.length > 0) {
        const labels = reportData.daily_data.map(item => {
          const date = new Date(item.date);
          return selectedPeriod === "weekly" ? 
            date.toLocaleDateString('en', { weekday: 'short' }) :
            date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        });

        setChartData({
          labels,
          datasets: [
            {
              data: reportData.daily_data.map(item => item.income || 0),
              color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
              strokeWidth: 3,
            },
            {
              data: reportData.daily_data.map(item => Math.abs(item.expenses || 0)),
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              strokeWidth: 3,
            }
          ],
        });
        return;
      }

      // Если нет daily_data, получаем данные из транзакций
      const response = await apiFetch("/api/v1/transactions/?limit=1000");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions for chart");
      }

      const transactionsData = await response.json();
      const transactions = transactionsData.transactions || [];

      // Фильтруем транзакции по выбранному периоду
      const filteredTransactions = filterTransactionsByPeriod(transactions, selectedPeriod);
      
      // Группируем по дням
      const dailyData = groupTransactionsByDay(filteredTransactions);
      
      if (dailyData.length === 0) {
        setChartData({ labels: [], datasets: [{ data: [] }] });
        return;
      }

      const labels = dailyData.map(item => {
        const date = new Date(item.date);
        return selectedPeriod === "weekly" ? 
          date.toLocaleDateString('en', { weekday: 'short' }) :
          date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
      });

      setChartData({
        labels,
        datasets: [
          {
            data: dailyData.map(item => item.income),
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            strokeWidth: 3,
          },
          {
            data: dailyData.map(item => item.expenses),
            color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
            strokeWidth: 3,
          }
        ],
      });

    } catch (error) {
      console.error("Error updating chart data:", error);
      setChartData({ labels: [], datasets: [{ data: [] }] });
    }
  }, [selectedPeriod]);

  // Обновление данных для круговой диаграммы
  const updatePieChartData = useCallback((spendingCategories) => {
    if (!spendingCategories || spendingCategories.length === 0) {
      setPieChartData([]);
      return;
    }

    const colors = [
      "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
      "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"
    ];
    
    const pieData = spendingCategories.slice(0, 6).map((category, index) => ({
      name: category.category_name || 'Unknown',
      amount: Math.abs(category.amount || 0),
      color: category.category_color || colors[index % colors.length],
      legendFontColor: isDark ? "#FFFFFF" : "#000000",
      legendFontSize: 12,
    }));
    
    setPieChartData(pieData);
  }, [isDark]);

  // Вспомогательные функции
  const getPeriodName = (period) => {
    switch (period) {
      case "weekly": return t('reports.this_week') || "This Week";
      case "monthly": return t('reports.this_month') || "This Month";
      case "quarterly": return t('reports.this_quarter') || "This Quarter";
      case "yearly": return t('reports.this_year') || "This Year";
      default: return t('reports.this_month') || "This Month";
    }
  };

  const filterTransactionsByPeriod = (transactions, period) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      
      switch (period) {
        case "weekly":
          const weekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
          return txDate >= weekAgo;
          
        case "monthly":
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return txDate >= startOfMonth;
          
        case "quarterly":
          const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
          const startOfQuarter = new Date(now.getFullYear(), quarterStartMonth, 1);
          return txDate >= startOfQuarter;
          
        case "yearly":
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return txDate >= startOfYear;
          
        default:
          return true;
      }
    });
  };

  const groupTransactionsByDay = (transactions) => {
    const dailyMap = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.transaction_date).toDateString();
      if (!dailyMap[date]) {
        dailyMap[date] = { date, income: 0, expenses: 0 };
      }
      
      if (tx.transaction_type === "income") {
        dailyMap[date].income += Math.abs(tx.amount);
      } else if (tx.transaction_type === "expense") {
        dailyMap[date].expenses += Math.abs(tx.amount);
      }
    });
    
    return Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Экспорт отчета
  const handleExportReport = async () => {
    if (!reportData) {
      Alert.alert(t('common.error'), t('reports.no_data_to_export') || "No report data available to export.");
      return;
    }

    Alert.alert(
      t('reports.export_report') || "Export Report",
      t('reports.choose_export_format') || "Choose export format:",
      [
        { text: t('common.cancel'), style: "cancel" },
        { text: "PDF", onPress: () => exportReport("pdf") },
        { text: "CSV", onPress: () => exportReport("csv") }
      ]
    );
  };

  const exportReport = async (format) => {
    setExporting(true);
    
    try {
      const exportData = {
        report_type: selectedPeriod === "weekly" ? "weekly_summary" : "monthly_summary",
        format: format,
        options: {
          include_charts: true,
          include_transaction_details: true,
          include_categories_summary: true,
          include_budget_analysis: true,
          include_insights: true
        }
      };

      const response = await apiFetch("/api/v1/reports/export", {
        method: "POST",
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      const result = await response.json();
      
      if (result.status === "processing") {
        Alert.alert(
          t('reports.export_started') || "Export Started", 
          t('reports.export_processing') || "Your report is being generated. You can download it from the Export Report screen.",
          [
            { text: t('common.ok') },
            { text: t('reports.go_to_exports') || "Go to Exports", onPress: () => navigation.navigate("Export Report") }
          ]
        );
      } else if (result.download_url) {
        await downloadFile(result.download_url, `financial_report_${Date.now()}.${format}`);
      }

    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(t('common.error'), t('reports.export_failed') || "Failed to export report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = async (url, fileName) => {
    try {
      const downloadResult = await FileSystem.downloadAsync(
        url,
        FileSystem.documentDirectory + fileName
      );

      if (downloadResult.status === 200) {
        Alert.alert(
          t('reports.download_complete') || "Download Complete",
          t('reports.download_success') || "Report downloaded successfully!",
          [
            { text: t('common.ok') },
            { 
              text: t('common.share'), 
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(downloadResult.uri);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert(t('common.error'), t('reports.download_failed') || "Failed to download file.");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
  }, [fetchReportData]);

  useFocusEffect(
    useCallback(() => {
      fetchReportData();
    }, [fetchReportData])
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchReportData();
      setLoading(false);
    };

    loadData();
  }, [fetchReportData]);

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

  const PeriodModal = () => (
    <Modal
      visible={showPeriodModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPeriodModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowPeriodModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('reports.select_period') || "Select Period"}</Text>
          <FlatList
            data={periods}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  item.key === selectedPeriod && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setSelectedPeriod(item.key);
                  setShowPeriodModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  item.key === selectedPeriod && styles.modalOptionTextSelected
                ]}>
                  {item.label}
                </Text>
                {item.key === selectedPeriod && (
                  <Ionicons name="checkmark" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
          <Text style={styles.headerTitle}>{t('reports.title') || "Financial Reports"}</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowPeriodModal(true)}
          >
            <Text style={styles.headerButtonText}>
              {periods.find(p => p.key === selectedPeriod)?.label || "Monthly"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {reportData && (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('reports.total_income') || "Total Income"}</Text>
                <Text style={[styles.summaryAmount, { color: "#22C55E" }]}>
                  ${reportData.income?.toLocaleString() || "0"}
                </Text>
                <Text style={styles.summaryPeriod}>{reportData.period_name}</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{t('reports.total_expenses') || "Total Expenses"}</Text>
                <Text style={[styles.summaryAmount, { color: "#EF4444" }]}>
                  ${reportData.expenses?.toLocaleString() || "0"}
                </Text>
                <Text style={styles.summaryPeriod}>{reportData.period_name}</Text>
              </View>
            </View>

            {/* Net Balance Card */}
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={reportData.net_balance >= 0 ? ["#22C55E", "#16A34A"] : ["#EF4444", "#DC2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}  
                style={styles.balanceGradient}
              >
                <View style={styles.balanceContent}>
                  <Text style={styles.balanceLabel}>{t('reports.net_balance') || "Net Balance"}</Text>
                  <Text style={styles.balanceAmount}>
                    {reportData.net_balance >= 0 ? "+" : ""}${reportData.net_balance?.toLocaleString() || "0"}
                  </Text>
                  <Text style={styles.balanceSubtext}>
                    {t('reports.savings_rate') || "Savings Rate"}: {reportData.savings_rate?.toFixed(1) || "0"}%
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Budget Status */}
            {reportData.budget_total > 0 && (
              <View style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetTitle}>{t('reports.budget_status') || "Budget Status"}</Text>
                  <Text style={styles.budgetPercentage}>
                    {reportData.budget_percentage?.toFixed(0) || "0"}%
                  </Text>
                </View>
                <View style={styles.budgetProgressContainer}>
                  <View style={styles.budgetProgressBg}>
                    <View
                      style={[
                        styles.budgetProgressFill,
                        { 
                          width: `${Math.min(reportData.budget_percentage || 0, 100)}%`,
                          backgroundColor: (reportData.budget_percentage || 0) > 90 ? "#EF4444" : 
                                         (reportData.budget_percentage || 0) > 70 ? "#F59E0B" : "#22C55E"
                        }
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.budgetDetails}>
                  <Text style={styles.budgetDetailText}>
                    {t('reports.used') || "Used"}: ${reportData.budget_used?.toLocaleString() || "0"}
                  </Text>
                  <Text style={styles.budgetDetailText}>
                    {t('reports.remaining') || "Remaining"}: ${reportData.budget_remaining?.toLocaleString() || "0"}
                  </Text>
                </View>
              </View>
            )}

            {/* Income vs Expenses Chart */}
            {chartData.datasets[0].data.length > 0 && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>{t('reports.income_vs_expenses') || "Income vs Expenses Trend"}</Text>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={chartData}
                    width={screenWidth - 72}
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
                      <Text style={styles.legendText}>{t('reports.income') || "Income"}</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                      <Text style={styles.legendText}>{t('reports.expenses') || "Expenses"}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Spending Categories Pie Chart */}
            {pieChartData.length > 0 && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>{t('reports.spending_by_categories') || "Spending by Categories"}</Text>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={pieChartData}
                    width={screenWidth - 72}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              </View>
            )}

            {/* Transaction Statistics */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>{t('reports.transaction_statistics') || "Transaction Statistics"}</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {reportData.transaction_count || 0}
                  </Text>
                  <Text style={styles.statLabel}>{t('reports.total_transactions') || "Total Transactions"}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ${reportData.average_transaction_amount?.toFixed(2) || "0.00"}
                  </Text>
                  <Text style={styles.statLabel}>{t('reports.average_amount') || "Average Amount"}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ${reportData.largest_expense?.amount?.toLocaleString() || "0"}
                  </Text>
                  <Text style={styles.statLabel}>{t('reports.largest_expense') || "Largest Expense"}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {reportData.most_spending_category || t('common.not_available')}
                  </Text>
                  <Text style={styles.statLabel}>{t('reports.top_category') || "Top Category"}</Text>
                </View>
              </View>
            </View>

            {/* Insights */}
            {reportData.insights && reportData.insights.length > 0 && (
              <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>{t('reports.financial_insights') || "Financial Insights"}</Text>
                <View style={styles.insightsList}>
                  {reportData.insights.map((insight, index) => (
                    <View key={index} style={styles.insightItem}>
                      <View style={[
                        styles.insightIcon,
                        { backgroundColor: 
                          insight.type === "positive" ? "#DCFCE7" :
                          insight.type === "warning" ? "#FEF3C7" :
                          insight.type === "alert" ? "#FEE2E2" : "#E0E7FF"
                        }
                      ]}>
                        <Ionicons 
                          name={insight.icon || "information-circle"} 
                          size={20} 
                          color={
                            insight.type === "positive" ? "#16A34A" :
                            insight.type === "warning" ? "#D97706" :
                            insight.type === "alert" ? "#DC2626" : "#2563EB"
                          }
                        />
                      </View>
                      <View style={styles.insightContent}>
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                        <Text style={styles.insightText}>{insight.message}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Export Button */}
        <View style={styles.exportSection}>
          <TouchableOpacity 
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExportReport}
            activeOpacity={0.8}
            disabled={exporting}
          >
            <LinearGradient
              colors={exporting ? ["#9CA3AF", "#9CA3AF"] : ["#2563EB", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.exportGradient}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.exportButtonText}>
                {exporting ? (t('reports.exporting') || "Exporting...") : (t('reports.export_report') || "Export Report")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.viewExportsButton}
            onPress={() => navigation.navigate("Export Report")}
            activeOpacity={0.8}
          >
            <Ionicons name="folder-outline" size={20} color="#2563EB" />
            <Text style={styles.viewExportsText}>{t('reports.view_all_exports') || "View All Exports"}</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {!reportData && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={isDark ? "#6B7280" : "#9CA3AF"} />
            <Text style={styles.emptyTitle}>{t('reports.no_data') || "No Report Data"}</Text>
            <Text style={styles.emptySubtitle}>{t('reports.no_data_subtitle') || "Start adding transactions to see your financial reports"}</Text>
          </View>
        )}
      </ScrollView>

      <PeriodModal />
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    headerButtonText: {
      fontSize: 14,
      color: "#2563EB",
      fontWeight: "500",
    },
    summaryContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    summaryCard: {
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
    summaryLabel: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
      fontWeight: "500",
      marginBottom: 4,
    },
    summaryAmount: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 4,
    },
    summaryPeriod: {
      fontSize: 11,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    balanceCard: {
      marginBottom: 16,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    balanceGradient: {
      padding: 20,
    },
    balanceContent: {
      alignItems: "center",
    },
    balanceLabel: {
      fontSize: 14,
      color: "#FFFFFF",
      fontWeight: "500",
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 32,
      fontWeight: "700",
      color: "#FFFFFF",
      marginBottom: 8,
    },
    balanceSubtext: {
      fontSize: 14,
      color: "#FFFFFF",
      opacity: 0.9,
    },
    budgetCard: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    budgetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    budgetTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    budgetPercentage: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    budgetProgressContainer: {
      marginBottom: 12,
    },
    budgetProgressBg: {
      height: 8,
      backgroundColor: isDark ? "#374151" : "#E5E7EB",
      borderRadius: 4,
      overflow: "hidden",
    },
    budgetProgressFill: {
      height: "100%",
      borderRadius: 4,
    },
    budgetDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    budgetDetailText: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    chartSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
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
      alignItems: "center",
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
    statsSection: {
      marginBottom: 24,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    statItem: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 16,
      borderRadius: 12,
      flex: 1,
      minWidth: "45%",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
      marginBottom: 4,
      textAlign: "center",
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
      textAlign: "center",
    },
    insightsSection: {
      marginBottom: 24,
    },
    insightsList: {
      gap: 12,
    },
    insightItem: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    insightIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    insightContent: {
      flex: 1,
    },
    insightTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginBottom: 4,
    },
    insightText: {
      fontSize: 13,
      color: isDark ? "#D1D5DB" : "#4B5563",
      lineHeight: 18,
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
      marginBottom: 12,
    },
    exportButtonDisabled: {
      opacity: 0.7,
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
    viewExportsButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#2563EB",
      gap: 8,
    },
    viewExportsText: {
      fontSize: 14,
      fontWeight: "500",
      color: "#2563EB",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 12,
      padding: 20,
      width: "100%",
      maxHeight: "60%",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginBottom: 16,
      textAlign: "center",
    },
    modalOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 4,
    },
    modalOptionSelected: {
      backgroundColor: isDark ? "#374151" : "#EFF6FF",
    },
    modalOptionText: {
      fontSize: 16,
      color: isDark ? "#F9FAFB" : "#111827",
      flex: 1,
    },
    modalOptionTextSelected: {
      color: "#2563EB",
      fontWeight: "600",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      textAlign: "center",
    },
  });

export default ReportsScreen;