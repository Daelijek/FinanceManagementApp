// src/screens/ExportReportScreen.js - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОЛНОЙ ИНТЕГРАЦИЕЙ БЭКЕНДА

// src/screens/ExportReportScreen.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useContext, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const ExportReportScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  // State for report configuration
  const [reportType, setReportType] = useState("monthly_summary");
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("pdf");
  const [showReportTypePicker, setShowReportTypePicker] = useState(false);

  // Export options
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeBudgetAnalysis, setIncludeBudgetAnalysis] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);

  // API data states
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentExports, setRecentExports] = useState([]);
  const [reportData, setReportData] = useState(null);

  // Исправленный список типов отчетов
  const reportTypes = [
    { key: "weekly_summary", label: t('reports.weekly_summary') || "Weekly Financial Summary" },
    { key: "monthly_summary", label: t('reports.monthly_summary') || "Monthly Financial Summary" },
    { key: "quarterly_summary", label: t('reports.quarterly') || "Quarterly Financial Report" },
    { key: "yearly_summary", label: t('reports.yearly') || "Yearly Financial Report" },
    { key: "custom_period", label: "Custom Date Range" },
    { key: "transaction_details", label: "Transaction History" },
    { key: "budget_analysis", label: "Budget Analysis" },
    { key: "category_breakdown", label: "Category Breakdown" }
  ];

  useEffect(() => {
    loadRecentExports();
    fetchReportPreview();
  }, [fromDate, toDate, reportType]);

  const loadRecentExports = async () => {
    try {
      const response = await apiFetch("/api/v1/reports/exports?limit=10");
      if (response.ok) {
        const data = await response.json();
        setRecentExports(Array.isArray(data) ? data : []);
      } else {
        console.warn('Failed to load recent exports:', response.status);
        setRecentExports([]);
      }
    } catch (error) {
      console.error('Error loading recent exports:', error);
      setRecentExports([]);
    }
  };

  const fetchReportPreview = async () => {
    setLoading(true);
    try {
      const startDate = fromDate.toISOString().split('T')[0];
      const endDate = toDate.toISOString().split('T')[0];

      let endpoint = "/api/v1/reports/monthly-summary";
      const params = new URLSearchParams();

      // Исправленная логика выбора эндпоинта
      switch (reportType) {
        case "weekly_summary":
          endpoint = "/api/v1/reports/weekly-summary";
          break;
        case "monthly_summary":
          endpoint = "/api/v1/reports/monthly-summary";
          params.append('year', fromDate.getFullYear().toString());
          params.append('month', (fromDate.getMonth() + 1).toString());
          break;
        case "quarterly_summary":
          endpoint = "/api/v1/reports/monthly-summary";
          // Для квартального отчета используем текущий квартал
          const quarter = Math.floor(fromDate.getMonth() / 3) + 1;
          params.append('year', fromDate.getFullYear().toString());
          params.append('quarter', quarter.toString());
          break;
        case "yearly_summary":
          endpoint = "/api/v1/reports/monthly-summary";
          params.append('year', fromDate.getFullYear().toString());
          break;
        case "custom_period":
        case "transaction_details":
          endpoint = "/api/v1/transactions/";
          params.append('start_date', startDate);
          params.append('end_date', endDate);
          params.append('limit', '10000');
          break;
        case "budget_analysis":
          endpoint = "/api/v1/budgets/current-month";
          break;
        case "category_breakdown":
          endpoint = "/api/v1/transactions/";
          params.append('start_date', startDate);
          params.append('end_date', endDate);
          params.append('limit', '10000');
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
      
      // Обработка данных в зависимости от типа отчета
      if (reportType === "custom_period" || reportType === "transaction_details" || reportType === "category_breakdown") {
        // Обрабатываем данные транзакций
        const transactions = data.transactions || [];
        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryBreakdown = {};

        transactions.forEach(tx => {
          if (tx.transaction_type === "income") {
            totalIncome += Math.abs(tx.amount);
          } else if (tx.transaction_type === "expense") {
            totalExpenses += Math.abs(tx.amount);
            
            const categoryName = tx.category_name || "Other";
            if (!categoryBreakdown[categoryName]) {
              categoryBreakdown[categoryName] = {
                amount: 0,
                count: 0,
                color: tx.category_color || "#6B7280"
              };
            }
            categoryBreakdown[categoryName].amount += Math.abs(tx.amount);
            categoryBreakdown[categoryName].count += 1;
          }
        });

        setReportData({
          totalIncome,
          totalExpenses,
          netBalance: totalIncome - totalExpenses,
          transactionCount: transactions.length,
          categoryBreakdown,
          period: reportType === "custom_period" ? 
            `${formatDate(fromDate)} - ${formatDate(toDate)}` : 
            getPeriodName(reportType),
          reportType
        });
      } else if (reportType === "budget_analysis") {
        // Обрабатываем данные бюджета
        setReportData({
          totalIncome: 0,
          totalExpenses: data.spent || 0,
          netBalance: (data.total_budget || 0) - (data.spent || 0),
          transactionCount: 0,
          categoryBreakdown: (data.budgets_by_category || []).reduce((acc, cat) => {
            acc[cat.category_name] = {
              amount: cat.spent_amount,
              count: 0,
              color: cat.category_color,
              budget: cat.amount,
              percentage: cat.usage_percentage
            };
            return acc;
          }, {}),
          period: data.period_name || "Current Month",
          budgetData: {
            total: data.total_budget || 0,
            used: data.spent || 0,
            percentage: data.usage_percentage || 0
          },
          reportType
        });
      } else {
        // Используем данные из готового отчета
        setReportData({
          totalIncome: data.income || 0,
          totalExpenses: data.expenses || 0,
          netBalance: data.net_balance || 0,
          transactionCount: data.transaction_count || 0,
          categoryBreakdown: data.spending_categories ? 
            data.spending_categories.reduce((acc, cat) => {
              acc[cat.category_name] = {
                amount: cat.amount,
                count: cat.transaction_count || 0,
                color: cat.category_color
              };
              return acc;
            }, {}) : {},
          period: data.period_name || getPeriodName(reportType),
          budgetData: data.budget_total ? {
            total: data.budget_total,
            used: data.budget_used,
            percentage: data.budget_percentage
          } : null,
          reportType
        });
      }

    } catch (error) {
      console.error('Error fetching report data:', error);
      Alert.alert(t('common.error'), 'Failed to load report preview. Please try again.');
      
      // Устанавливаем пустые данные при ошибке
      setReportData({
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        transactionCount: 0,
        categoryBreakdown: {},
        period: getPeriodName(reportType),
        reportType
      });
    } finally {
      setLoading(false);
    }
  };

  const getPeriodName = (type) => {
    switch (type) {
      case "weekly_summary": return "This Week";
      case "monthly_summary": return "This Month";
      case "quarterly_summary": return "This Quarter";
      case "yearly_summary": return "This Year";
      case "transaction_details": return "Transaction History";
      case "budget_analysis": return "Budget Analysis";
      case "category_breakdown": return "Category Breakdown";
      default: return "Custom Period";
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFileSize = (format) => {
    if (!reportData) return "~0 MB";
    
    const baseSize = reportData.transactionCount * 0.001;
    const chartSize = includeCharts ? 0.5 : 0;
    const categoriesSize = includeCategories ? Object.keys(reportData.categoryBreakdown).length * 0.01 : 0;
    
    const totalSize = baseSize + chartSize + categoriesSize;
    
    if (format === "pdf") {
      return `~${Math.max(1.5, totalSize * 1.5).toFixed(1)} MB`;
    } else {
      return `~${Math.max(0.5, totalSize * 0.5).toFixed(1)} MB`;
    }
  };

  const handleExport = async () => {
    if (!reportData) {
      Alert.alert(t('common.error'), 'Report data not available. Please wait for data to load.');
      return;
    }

    const exportOptions = {
      include_charts: includeCharts,
      include_transaction_details: includeTransactions,
      include_categories_summary: includeCategories,
      include_budget_analysis: includeBudgetAnalysis,
      include_insights: includeInsights
    };

    const currentReportType = reportTypes.find(rt => rt.key === reportType);
    
    Alert.alert(
      "Export Report",
      `Export ${currentReportType?.label || reportType} (${reportData.period}) as ${selectedFormat.toUpperCase()}?\n\nReport will include:\n• ${reportData.transactionCount} transactions\n• ${Object.keys(reportData.categoryBreakdown).length} categories\n• ${includeCharts ? 'Charts and graphs' : 'No charts'}\n• ${includeTransactions ? 'Transaction details' : 'Summary only'}`,
      [
        { text: t('common.cancel'), style: "cancel" },
        { text: "Export", onPress: () => processExport(exportOptions) }
      ]
    );
  };

  const processExport = async (options) => {
    setExporting(true);
    try {
      const exportRequest = {
        report_type: reportType,
        format: selectedFormat,
        start_date: (reportType === "custom_period" || reportType === "transaction_details" || reportType === "category_breakdown") ? 
          fromDate.toISOString().split('T')[0] : null,
        end_date: (reportType === "custom_period" || reportType === "transaction_details" || reportType === "category_breakdown") ? 
          toDate.toISOString().split('T')[0] : null,
        options: options
      };

      const response = await apiFetch("/api/v1/reports/export", {
        method: "POST",
        body: JSON.stringify(exportRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to export report");
      }

      const result = await response.json();
      
      if (result.status === "processing") {
        Alert.alert(
          "Export Started", 
          `Your report is being generated. Export ID: ${result.export_id}\n\nYou can check the status or download it once ready.`,
          [
            { text: t('common.ok'), onPress: () => loadRecentExports() }
          ]
        );
      } else if (result.download_url) {
        await downloadFile(result.download_url, result.export_id);
      }
      
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert("Export Error", `Failed to export report: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = async (url, exportId) => {
    try {
      const fileName = `financial_report_${exportId}.${selectedFormat}`;
      const downloadResult = await FileSystem.downloadAsync(
        url,
        FileSystem.documentDirectory + fileName
      );

      if (downloadResult.status === 200) {
        Alert.alert(
          "Download Complete",
          "Report downloaded successfully!",
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
      Alert.alert("Download Error", "Failed to download file.");
    }
  };

  const handleDownloadExport = async (exportItem) => {
    try {
      const response = await apiFetch(`/api/v1/reports/export/${exportItem.export_id}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const fileName = exportItem.file_name || `report_${exportItem.export_id}.${exportItem.format}`;
        
        // Создаем временный файл
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result.split(',')[1];
          const fileUri = FileSystem.documentDirectory + fileName;
          
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          Alert.alert(
            "Download Complete",
            "Report downloaded successfully!",
            [
              { text: t('common.ok') },
              { 
                text: t('common.share'), 
                onPress: async () => {
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                  }
                }
              }
            ]
          );
        };
        reader.readAsDataURL(blob);
      } else {
        Alert.alert("Error", "Failed to download export. File may have expired.");
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Download Error", "Failed to download file.");
    }
  };

  const deleteExport = async (exportId) => {
    try {
      const response = await apiFetch(`/api/v1/reports/exports/${exportId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setRecentExports(prev => prev.filter(exp => exp.export_id !== exportId));
        Alert.alert("Success", "Export deleted successfully.");
      } else {
        Alert.alert("Error", "Failed to delete export.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete export.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRecentExports(), fetchReportPreview()]);
    setRefreshing(false);
  };

  const ReportTypeModal = () => (
    <Modal
      visible={showReportTypePicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowReportTypePicker(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowReportTypePicker(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Report Type</Text>
          <FlatList
            data={reportTypes}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  item.key === reportType && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setReportType(item.key);
                  setShowReportTypePicker(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  item.key === reportType && styles.modalOptionTextSelected
                ]}>
                  {item.label}
                </Text>
                {item.key === reportType && (
                  <Ionicons name="checkmark" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Показываем выбор дат для custom_period, transaction_details и category_breakdown
  const shouldShowDatePicker = ["custom_period", "transaction_details", "category_breakdown"].includes(reportType);

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
        
        {/* Report Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Report Type</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowReportTypePicker(true)}
          >
            <Text style={styles.dropdownText}>
              {reportTypes.find(rt => rt.key === reportType)?.label || "Monthly Summary"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>
        </View>

        {/* Date Range Selection */}
        {shouldShowDatePicker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date Range</Text>
            <View style={styles.dateContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>From</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowFromPicker(true)}
                >
                  <Text style={styles.dateText}>{formatDate(fromDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                </TouchableOpacity>
              </View>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>To</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowToPicker(true)}
                >
                  <Text style={styles.dateText}>{formatDate(toDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                </TouchableOpacity>
              </View>
            </View>

            {showFromPicker && (
              <DateTimePicker
                value={fromDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowFromPicker(false);
                  if (selectedDate) setFromDate(selectedDate);
                }}
              />
            )}

            {showToPicker && (
              <DateTimePicker
                value={toDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowToPicker(false);
                  if (selectedDate) setToDate(selectedDate);
                }}
              />
            )}
          </View>
        )}

        {/* Report Preview */}
        {loading ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loading Report Preview...</Text>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          </View>
        ) : reportData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Period:</Text>
                <Text style={styles.previewValue}>{reportData.period}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Transactions:</Text>
                <Text style={styles.previewValue}>{reportData.transactionCount}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Total Income:</Text>
                <Text style={[styles.previewValue, { color: "#10B981" }]}>
                  ${reportData.totalIncome.toLocaleString()}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Total Expenses:</Text>
                <Text style={[styles.previewValue, { color: "#EF4444" }]}>
                  ${reportData.totalExpenses.toLocaleString()}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Net Balance:</Text>
                <Text style={[
                  styles.previewValue, 
                  { color: reportData.netBalance >= 0 ? "#10B981" : "#EF4444" }
                ]}>
                  {reportData.netBalance >= 0 ? "+" : ""}${reportData.netBalance.toLocaleString()}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Categories:</Text>
                <Text style={styles.previewValue}>{Object.keys(reportData.categoryBreakdown).length}</Text>
              </View>
              {reportData.budgetData && (
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Budget Usage:</Text>
                  <Text style={styles.previewValue}>{reportData.budgetData.percentage.toFixed(0)}%</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Export Format */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatContainer}>
            <TouchableOpacity 
              style={[
                styles.formatCard,
                selectedFormat === "pdf" && styles.formatCardSelected
              ]}
              onPress={() => setSelectedFormat("pdf")}
            >
              <View style={[styles.formatIcon, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="document-text" size={24} color="#EF4444" />
              </View>
              <Text style={styles.formatTitle}>PDF</Text>
              <Text style={styles.formatSize}>{getFileSize("pdf")}</Text>
              {selectedFormat === "pdf" && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.formatCard,
                selectedFormat === "csv" && styles.formatCardSelected
              ]}
              onPress={() => setSelectedFormat("csv")}
            >
              <View style={[styles.formatIcon, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="grid" size={24} color="#10B981" />
              </View>
              <Text style={styles.formatTitle}>CSV</Text>
              <Text style={styles.formatSize}>{getFileSize("csv")}</Text>
              {selectedFormat === "csv" && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Options</Text>
          
          <View style={styles.optionItem}>
            <Text style={styles.optionText}>Include Charts and Graphs</Text>
            <Switch
              value={includeCharts}
              onValueChange={setIncludeCharts}
              trackColor={{ false: isDark ? "#374151" : "#F3F4F6", true: "#2563EB" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.optionItem}>
            <Text style={styles.optionText}>Include Transaction Details</Text>
            <Switch
              value={includeTransactions}
              onValueChange={setIncludeTransactions}
              trackColor={{ false: isDark ? "#374151" : "#F3F4F6", true: "#2563EB" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.optionItem}>
            <Text style={styles.optionText}>Include Categories Summary</Text>
            <Switch
              value={includeCategories}
              onValueChange={setIncludeCategories}
              trackColor={{ false: isDark ? "#374151" : "#F3F4F6", true: "#2563EB" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.optionItem}>
            <Text style={styles.optionText}>Include Budget Analysis</Text>
            <Switch
              value={includeBudgetAnalysis}
              onValueChange={setIncludeBudgetAnalysis}
              trackColor={{ false: isDark ? "#374151" : "#F3F4F6", true: "#2563EB" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.optionItem}>
            <Text style={styles.optionText}>Include Financial Insights</Text>
            <Switch
              value={includeInsights}
              onValueChange={setIncludeInsights}
              trackColor={{ false: isDark ? "#374151" : "#F3F4F6", true: "#2563EB" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Export Button */}
        <View style={styles.exportButtonContainer}>
          <TouchableOpacity 
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            activeOpacity={0.8}
            disabled={exporting || loading}
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
        </View>

        {/* Recent Exports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Exports</Text>
          <View style={styles.recentList}>
            {recentExports.length === 0 ? (
              <View style={styles.noExportsContainer}>
                <Ionicons name="document-outline" size={48} color={isDark ? "#6B7280" : "#9CA3AF"} />
                <Text style={styles.noExportsText}>No recent exports</Text>
                <Text style={styles.noExportsSubtext}>Your exported reports will appear here</Text>
              </View>
            ) : (
              recentExports.map((item) => (
                <View key={item.export_id} style={styles.recentItem}>
                  <View style={[styles.recentIcon, { 
                    backgroundColor: item.format === "pdf" ? "#FEE2E2" : "#D1FAE5" 
                  }]}>
                    <Ionicons 
                      name={item.format === "pdf" ? "document-text" : "grid"} 
                      size={20} 
                      color={item.format === "pdf" ? "#EF4444" : "#10B981"} 
                    />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{item.file_name || `${item.report_type}_${item.created_at}`}</Text>
                    <Text style={styles.recentDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    <Text style={styles.recentStatus}>
                      Status: {item.status === "completed" ? "✅ Ready" : 
                               item.status === "processing" ? "⏳ Processing" : 
                               item.status === "failed" ? "❌ Failed" : "📋 " + item.status}
                    </Text>
                  </View>
                  <View style={styles.recentActions}>
                    {item.status === "completed" && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDownloadExport(item)}
                      >
                        <Ionicons name="download-outline" size={16} color="#2563EB" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        Alert.alert(
                          "Delete Export",
                          "Are you sure you want to delete this export?",
                          [
                            { text: t('common.cancel'), style: "cancel" },
                            { text: t('common.delete'), style: "destructive", onPress: () => deleteExport(item.export_id) }
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>

      <ReportTypeModal />
    </SafeAreaView>
  );
};

const getThemedStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 32,
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginBottom: 12,
    },
    dropdown: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#E5E7EB",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    dropdownText: {
      fontSize: 16,
      color: isDark ? "#F9FAFB" : "#111827",
    },
    dateContainer: {
      flexDirection: "row",
      gap: 12,
    },
    dateInputContainer: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginBottom: 8,
      fontWeight: "500",
    },
    dateInput: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#E5E7EB",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    dateText: {
      fontSize: 16,
      color: isDark ? "#F9FAFB" : "#111827",
    },
    loadingContainer: {
      alignItems: "center",
      paddingVertical: 20,
    },
    previewCard: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#E5E7EB",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#F3F4F6",
    },
    previewLabel: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      fontWeight: "500",
    },
    previewValue: {
      fontSize: 14,
      color: isDark ? "#F9FAFB" : "#111827",
      fontWeight: "600",
    },
    formatContainer: {
      flexDirection: "row",
      gap: 16,
    },
    formatCard: {
      flex: 1,
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 20,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
      position: "relative",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    formatCardSelected: {
      borderColor: "#2563EB",
      backgroundColor: isDark ? "#1E3A8A" : "#EFF6FF",
    },
    formatIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    formatTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginBottom: 4,
    },
    formatSize: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    selectedIndicator: {
      position: "absolute",
      top: 8,
      right: 8,
    },
    optionItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    optionText: {
      fontSize: 16,
      color: isDark ? "#F9FAFB" : "#111827",
      flex: 1,
    },
    exportButtonContainer: {
      marginBottom: 32,
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
    recentList: {
      gap: 12,
    },
    noExportsContainer: {
      alignItems: "center",
      paddingVertical: 40,
    },
    noExportsText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginTop: 16,
      marginBottom: 8,
    },
    noExportsSubtext: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      textAlign: "center",
    },
    recentItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      padding: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    recentIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    recentInfo: {
      flex: 1,
    },
    recentName: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#F9FAFB" : "#111827",
      marginBottom: 2,
    },
    recentDate: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginBottom: 2,
    },
    recentStatus: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
    },
    recentActions: {
      flexDirection: "row",
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: isDark ? "#374151" : "#F3F4F6",
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

export default ExportReportScreen;