// src/screens/ReportsScreen.js - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОЛНОЙ ИНТЕГРАЦИЕЙ БЭКЕНДА

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
    { key: "weekly", label: "Weekly Summary" },
    { key: "monthly", label: "Monthly Summary" },
    { key: "quarterly", label: "Quarterly" },
    { key: "yearly", label: "Yearly" }
  ];

  // Получение данных отчета с бэкенда
  const fetchReportData = useCallback(async () => {
    try {
      let endpoint = "/api/v1/reports/weekly-summary";
      
      if (selectedPeriod === "monthly") {
        endpoint = "/api/v1/reports/monthly-summary";
      } else if (selectedPeriod === "yearly") {
        const currentYear = new Date().getFullYear();
        endpoint = `/api/v1/reports/monthly-summary?year=${currentYear}&month=12`;
      }

      const response = await apiFetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setReportData(data);

      // Обновляем данные для графика доходы vs расходы
      if (data.income_vs_expenses_chart && data.income_vs_expenses_chart.data_points) {
        const chartPoints = data.income_vs_expenses_chart.data_points;
        
        setChartData({
          labels: chartPoints.map(point => {
            const date = new Date(point.date);
            return selectedPeriod === "weekly" ? 
              date.toLocaleDateString('en', { weekday: 'short' }) :
              date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
          }),
          datasets: [
            {
              data: chartPoints.map(point => point.income),
              color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
              strokeWidth: 3,
            },
            {
              data: chartPoints.map(point => point.expenses),
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              strokeWidth: 3,
            }
          ],
        });
      }

      // Обновляем данные для круговой диаграммы категорий
      if (data.spending_categories && data.spending_categories.length > 0) {
        const colors = [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
          "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"
        ];
        
        const pieData = data.spending_categories.slice(0, 6).map((category, index) => ({
          name: category.category_name,
          amount: category.amount,
          color: category.category_color || colors[index % colors.length],
          legendFontColor: isDark ? "#FFFFFF" : "#000000",
          legendFontSize: 12,
        }));
        
        setPieChartData(pieData);
      }

    } catch (error) {
      console.error("Error fetching report data:", error);
      Alert.alert("Error", "Failed to load report data. Please try again.");
    }
  }, [selectedPeriod, isDark]);

  // Экспорт отчета
  const handleExportReport = async () => {
    if (!reportData) {
      Alert.alert("Error", "No report data available to export.");
      return;
    }

    Alert.alert(
      "Export Report",
      "Choose export format:",
      [
        { text: "Cancel", style: "cancel" },
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
          "Export Started", 
          "Your report is being generated. You can download it from the Export Report screen.",
          [
            { text: "OK" },
            { text: "Go to Exports", onPress: () => navigation.navigate("Export Report") }
          ]
        );
      } else if (result.download_url) {
        // Если файл готов сразу, скачиваем его
        await downloadFile(result.download_url, `financial_report_${Date.now()}.${format}`);
      }

    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Export Error", "Failed to export report. Please try again.");
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
          "Download Complete",
          "Report downloaded successfully!",
          [
            { text: "OK" },
            { 
              text: "Share", 
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
      Alert.alert("Download Error", "Failed to download file.");
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
          <Text style={styles.modalTitle}>Select Period</Text>
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
          <Text style={styles.headerTitle}>Financial Reports</Text>
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
                <Text style={styles.summaryLabel}>Total Income</Text>
                <Text style={[styles.summaryAmount, { color: "#22C55E" }]}>
                  ${reportData.income?.toLocaleString() || "0"}
                </Text>
                <Text style={styles.summaryPeriod}>{reportData.period_name}</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Expenses</Text>
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
                  <Text style={styles.balanceLabel}>Net Balance</Text>
                  <Text style={styles.balanceAmount}>
                    {reportData.net_balance >= 0 ? "+" : ""}${reportData.net_balance?.toLocaleString() || "0"}
                  </Text>
                  <Text style={styles.balanceSubtext}>
                    Savings Rate: {reportData.savings_rate?.toFixed(1) || "0"}%
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Budget Status */}
            {reportData.budget_total > 0 && (
              <View style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetTitle}>Budget Status</Text>
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
                    Used: ${reportData.budget_used?.toLocaleString() || "0"}
                  </Text>
                  <Text style={styles.budgetDetailText}>
                    Remaining: ${reportData.budget_remaining?.toLocaleString() || "0"}
                  </Text>
                </View>
              </View>
            )}

            {/* Income vs Expenses Chart */}
            {chartData.datasets[0].data.length > 0 && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>Income vs Expenses Trend</Text>
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
                      <Text style={styles.legendText}>Income</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                      <Text style={styles.legendText}>Expenses</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Spending Categories Pie Chart */}
            {pieChartData.length > 0 && (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>Spending by Categories</Text>
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
              <Text style={styles.sectionTitle}>Transaction Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {reportData.transaction_count || 0}
                  </Text>
                  <Text style={styles.statLabel}>Total Transactions</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ${reportData.average_transaction_amount?.toFixed(2) || "0.00"}
                  </Text>
                  <Text style={styles.statLabel}>Average Amount</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ${reportData.largest_expense?.amount?.toLocaleString() || "0"}
                  </Text>
                  <Text style={styles.statLabel}>Largest Expense</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {reportData.most_spending_category || "N/A"}
                  </Text>
                  <Text style={styles.statLabel}>Top Category</Text>
                </View>
              </View>
            </View>

            {/* Insights */}
            {reportData.insights && reportData.insights.length > 0 && (
              <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>Financial Insights</Text>
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
                {exporting ? "Exporting..." : "Export Report"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.viewExportsButton}
            onPress={() => navigation.navigate("Export Report")}
            activeOpacity={0.8}
          >
            <Ionicons name="folder-outline" size={20} color="#2563EB" />
            <Text style={styles.viewExportsText}>View All Exports</Text>
          </TouchableOpacity>
        </View>
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
  });

export default ReportsScreen;