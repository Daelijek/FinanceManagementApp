// src/screens/ExportReportScreen.js

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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ExportReportScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  // State for report configuration
  const [reportType, setReportType] = useState("Monthly Financial Summary");
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("PDF");
  const [showReportTypePicker, setShowReportTypePicker] = useState(false);

  // Export options
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);

  // API data states
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [recentExports, setRecentExports] = useState([]);
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    "Monthly Financial Summary",
    "Annual Financial Report", 
    "Transaction History",
    "Budget Analysis",
    "Category Breakdown"
  ];

  useEffect(() => {
    loadRecentExports();
    fetchReportPreview();
  }, [fromDate, toDate, reportType]);

  const loadRecentExports = async () => {
    try {
      // Load from AsyncStorage (in real app, this would be from API)
      const saved = await AsyncStorage.getItem('recentExports');
      if (saved) {
        setRecentExports(JSON.parse(saved));
      } else {
        // Set default recent exports
        const defaultExports = [
          {
            id: 1,
            name: "January Financial Report",
            date: "Feb 1, 2024",
            format: "PDF",
            icon: "document-text",
            color: "#EF4444",
            reportType: "Monthly Financial Summary",
            dateRange: "Jan 1, 2024 - Jan 31, 2024"
          },
          {
            id: 2,
            name: "Q4 Transaction Data",
            date: "Jan 15, 2024",
            format: "CSV",
            icon: "grid",
            color: "#10B981",
            reportType: "Transaction History",
            dateRange: "Oct 1, 2023 - Dec 31, 2023"
          },
          {
            id: 3,
            name: "December Summary",
            date: "Jan 5, 2024",
            format: "PDF",
            icon: "document-text",
            color: "#EF4444",
            reportType: "Budget Analysis",
            dateRange: "Dec 1, 2023 - Dec 31, 2023"
          }
        ];
        setRecentExports(defaultExports);
        await AsyncStorage.setItem('recentExports', JSON.stringify(defaultExports));
      }
    } catch (error) {
      console.error('Error loading recent exports:', error);
    }
  };

  const fetchReportPreview = async () => {
    setLoading(true);
    try {
      const startDate = fromDate.toISOString().split('T')[0];
      const endDate = toDate.toISOString().split('T')[0];

      // Fetch transactions for the selected period
      const response = await apiFetch(`/api/v1/transactions/?start_date=${startDate}&end_date=${endDate}&limit=1000`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      const transactions = data.transactions || [];

      // Calculate report statistics
      let totalIncome = 0;
      let totalExpenses = 0;
      let transactionCount = transactions.length;
      const categoryBreakdown = {};

      transactions.forEach(tx => {
        if (tx.transaction_type === "income") {
          totalIncome += tx.amount;
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

      // Get budget data if needed
      let budgetData = null;
      if (reportType === "Budget Analysis") {
        try {
          const budgetResponse = await apiFetch("/api/v1/budgets/current-month");
          if (budgetResponse.ok) {
            budgetData = await budgetResponse.json();
          }
        } catch (budgetError) {
          console.log("Budget data not available");
        }
      }

      setReportData({
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        transactionCount,
        categoryBreakdown,
        budgetData,
        period: `${formatDate(fromDate)} - ${formatDate(toDate)}`
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      Alert.alert('Error', 'Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
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
    
    // Estimate file size based on data
    const baseSize = reportData.transactionCount * 0.001; // KB per transaction
    const chartSize = includeCharts ? 0.5 : 0; // MB for charts
    const categoriesSize = includeCategories ? Object.keys(reportData.categoryBreakdown).length * 0.01 : 0;
    
    const totalSize = baseSize + chartSize + categoriesSize;
    
    if (format === "PDF") {
      return `~${Math.max(1.5, totalSize * 1.5).toFixed(1)} MB`;
    } else {
      return `~${Math.max(0.5, totalSize * 0.5).toFixed(1)} MB`;
    }
  };

  const handleExport = async () => {
    if (!reportData) {
      Alert.alert('Error', 'Report data not available. Please wait for data to load.');
      return;
    }

    Alert.alert(
      "Export Report",
      `Export ${reportType} (${reportData.period}) as ${selectedFormat}?\n\nReport will include:\n${reportData.transactionCount} transactions\n${Object.keys(reportData.categoryBreakdown).length} categories\n${includeCharts ? 'Charts and graphs' : 'No charts'}\n${includeTransactions ? 'Transaction details' : 'Summary only'}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => processExport() }
      ]
    );
  };

  const processExport = async () => {
    setExporting(true);
    try {
      // Simulate export API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to recent exports
      const newExport = {
        id: Date.now(),
        name: `${reportType} - ${formatDate(fromDate)}`,
        date: new Date().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        format: selectedFormat,
        icon: selectedFormat === "PDF" ? "document-text" : "grid",
        color: selectedFormat === "PDF" ? "#EF4444" : "#10B981",
        reportType,
        dateRange: reportData.period
      };

      const updatedExports = [newExport, ...recentExports.slice(0, 4)];
      setRecentExports(updatedExports);
      await AsyncStorage.setItem('recentExports', JSON.stringify(updatedExports));
      
      Alert.alert("Success", "Report exported successfully!");
      navigation.goBack();
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert("Error", "Failed to export report. Please try again.");
    } finally {
      setExporting(false);
    }
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
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  item === reportType && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setReportType(item);
                  setShowReportTypePicker(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  item === reportType && styles.modalOptionTextSelected
                ]}>
                  {item}
                </Text>
                {item === reportType && (
                  <Ionicons name="checkmark" size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Report Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Report Type</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowReportTypePicker(true)}
          >
            <Text style={styles.dropdownText}>{reportType}</Text>
            <Ionicons name="chevron-down" size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>
        </View>

        {/* Date Range Selection */}
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
                  {reportData.netBalance >= 0 ? "+" : "-"}${Math.abs(reportData.netBalance).toLocaleString()}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Categories:</Text>
                <Text style={styles.previewValue}>{Object.keys(reportData.categoryBreakdown).length}</Text>
              </View>
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
                selectedFormat === "PDF" && styles.formatCardSelected
              ]}
              onPress={() => setSelectedFormat("PDF")}
            >
              <View style={[styles.formatIcon, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="document-text" size={24} color="#EF4444" />
              </View>
              <Text style={styles.formatTitle}>PDF</Text>
              <Text style={styles.formatSize}>{getFileSize("PDF")}</Text>
              {selectedFormat === "PDF" && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.formatCard,
                selectedFormat === "CSV" && styles.formatCardSelected
              ]}
              onPress={() => setSelectedFormat("CSV")}
            >
              <View style={[styles.formatIcon, { backgroundColor: "#D1FAE5" }]}>
                <Ionicons name="grid" size={24} color="#10B981" />
              </View>
              <Text style={styles.formatTitle}>CSV</Text>
              <Text style={styles.formatSize}>{getFileSize("CSV")}</Text>
              {selectedFormat === "CSV" && (
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
                <View key={item.id} style={styles.recentItem}>
                  <View style={[styles.recentIcon, { backgroundColor: item.color + "20" }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{item.name}</Text>
                    <Text style={styles.recentDate}>{item.date}</Text>
                  </View>
                  <View style={styles.recentCheck}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
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
    },
    recentCheck: {
      marginLeft: 12,
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