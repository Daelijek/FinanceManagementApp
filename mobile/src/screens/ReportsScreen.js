// src/screens/ReportsScreen.js

import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
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
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
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
import ChatBotFAB from "../components/ChatBotFAB";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

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

  // Initialize animations - ТЕСТ: делаем видимыми для проверки
  const fadeAnim = useRef(new Animated.Value(1)).current; // Тест: видимо
  const slideAnim = useRef(new Animated.Value(0)).current; // Тест: на месте
  const headerAnim = useRef(new Animated.Value(1)).current; // Тест: видимо
  const summaryCardsAnim = useRef(new Animated.Value(1)).current; // Тест: видимо
  const balanceCardAnim = useRef(new Animated.Value(1)).current; // Тест: видимо
  const chartAnimRef = useRef(new Animated.Value(1)).current; // Тест: видимо
  const statsAnimRef = useRef(new Animated.Value(1)).current; // Тест: видимо
  const exportButtonScale = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const budgetProgressAnim = useRef(new Animated.Value(0)).current;

  // Состояние для защиты от невидимости
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Insight cards animation values
  const insightAnimations = useRef([]).current;

  const periods = [
    { key: "weekly", label: t('reports.weekly_summary') || "Weekly Summary" },
    { key: "monthly", label: t('reports.monthly_summary') || "Monthly Summary" },
    { key: "quarterly", label: t('reports.quarterly') || "Quarterly" },
    { key: "yearly", label: t('reports.yearly') || "Yearly" }
  ];

  // Initialize insight animations
  const initializeInsightAnimations = (count) => {
    insightAnimations.splice(0);
    for (let i = 0; i < count; i++) {
      insightAnimations.push(new Animated.Value(0));
    }
  };

  // ТЕСТ: Простая анимация которая точно работает
  const testSimpleAnimation = useCallback(() => {
    console.log("🧪 Testing simple animation");

    Animated.sequence([
      Animated.timing(exportButtonScale, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(exportButtonScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log("✅ Simple test animation completed!");
    });
  }, []);

  // Start entrance animations - теперь с анимациями ОТ видимого состояния
  const startEntranceAnimations = useCallback(() => {
    console.log("🎬 Starting entrance animations!");

    if (!animationsEnabled) {
      console.log("🚫 Animations disabled, skipping");
      return;
    }

    // Тест простой анимации
    testSimpleAnimation();

    // Делаем "волновой" эффект появления
    console.log("🎬 Starting wave effect");

    // Заголовок - небольшое покачивание
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log("✅ Header wave completed");
    });

    // Карточки - масштабирование
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(summaryCardsAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(summaryCardsAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log("✅ Summary cards wave completed");
      });
    }, 100);

    // Баланс карточка
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(balanceCardAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(balanceCardAnim, {
          toValue: 1,
          tension: 60,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log("✅ Balance card wave completed");
      });
    }, 200);

    // Графики
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(chartAnimRef, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(chartAnimRef, {
          toValue: 1,
          tension: 70,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log("✅ Chart wave completed");
      });
    }, 300);

    // Статистика
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(statsAnimRef, {
          toValue: 0.85,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(statsAnimRef, {
          toValue: 1,
          tension: 90,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log("✅ Stats wave completed");
      });
    }, 400);

  }, [animationsEnabled, testSimpleAnimation]);

  // Animate insights with stagger
  const animateInsights = useCallback((insights) => {
    if (insights && insights.length > 0) {
      initializeInsightAnimations(insights.length);

      insights.forEach((_, index) => {
        setTimeout(() => {
          Animated.spring(insightAnimations[index], {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }, index * 100);
      });
    }
  }, []);

  // Pulse animation for loading states
  const startPulseAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Animate budget progress bar
  const animateBudgetProgress = useCallback((percentage) => {
    Animated.timing(budgetProgressAnim, {
      toValue: Math.min(percentage, 100), // Animate to actual percentage, max 100
      duration: 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, []);

  // Button press animations
  const handleButtonPressIn = useCallback((animValue) => {
    Animated.spring(animValue, {
      toValue: 0.95,
      tension: 300,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleButtonPressOut = useCallback((animValue) => {
    Animated.spring(animValue, {
      toValue: 1,
      tension: 300,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, []);

  // Modal animations
  const showModal = useCallback(() => {
    setShowPeriodModal(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const hideModal = useCallback(() => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setShowPeriodModal(false);
    });
  }, []);

  // Получение данных отчета с бэкенда
  const fetchReportData = useCallback(async () => {
    console.log("🔄 fetchReportData started, selectedPeriod:", selectedPeriod);

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
      console.log("📡 API URL:", url);

      const response = await apiFetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ API Response received:", data);

      // Debug: проверяем данные о бюджете  
      console.log("💰 Budget data from API:", {
        budget_total: data.budget_total,
        budget_used: data.budget_used,
        budget_remaining: data.budget_remaining,
        budget_percentage: data.budget_percentage
      });

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

      console.log("📊 Setting report data:", safeReportData);
      setReportData(safeReportData);
      setHasDataLoaded(true);

      // Запускаем красивые анимации через небольшую задержку
      console.log("🎬 About to start animations in 50ms...");
      setTimeout(() => {
        console.log("🎬 Calling startEntranceAnimations now!");
        startEntranceAnimations();
      }, 50);

      // Insights анимации
      if (safeReportData.insights && safeReportData.insights.length > 0) {
        setTimeout(() => {
          console.log("🎬 Starting insights animations");
          animateInsights(safeReportData.insights);
        }, 1200);
      }

      // Budget progress анимация
      if (safeReportData.budget_percentage > 0) {
        setTimeout(() => {
          console.log("🎬 Starting budget progress animation");
          animateBudgetProgress(safeReportData.budget_percentage);
        }, 1400);
      }

      // Fallback: если анимации не сработали через 2 секунды, показываем контент принудительно
      setTimeout(() => {
        console.log("🛡️ Fallback activated - showing content");
        setShowFallback(true);
      }, 2000);

      // Обновляем данные для Line Chart (доходы vs расходы)
      await updateChartData(safeReportData);

      // Обновляем данные для Pie Chart (категории)
      updatePieChartData(safeReportData.spending_categories);

      console.log("✅ fetchReportData completed successfully");

    } catch (error) {
      console.error("❌ Error fetching report data:", error);

      // Устанавливаем пустые данные в случае ошибки
      const emptyData = {
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
      };

      setReportData(emptyData);
      setChartData({ labels: [], datasets: [{ data: [] }] });
      setPieChartData([]);

      Alert.alert(t('common.error'), t('reports.failed_to_load') || "Failed to load report data. Please try again.");
    }
  }, [selectedPeriod, isDark, t, startEntranceAnimations, animateInsights, animateBudgetProgress]);

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

  // Вспомогательные функции для бюджета
  const getBudgetProgressColor = (percentage) => {
    if (percentage > 100) return "#EF4444"; // Red for over budget
    if (percentage > 90) return "#EF4444";  // Red for close to limit
    if (percentage > 70) return "#F59E0B";  // Orange for warning
    return "#22C55E"; // Green for safe
  };

  const getBudgetPercentageColor = (percentage) => {
    if (percentage > 100) return "#EF4444"; // Red for over budget
    if (percentage > 90) return "#EF4444";  // Red for close to limit  
    if (percentage > 70) return "#F59E0B";  // Orange for warning
    return isDark ? "#F9FAFB" : "#111827"; // Default color
  };

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
    console.log("🔄 onRefresh triggered");
    setRefreshing(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await fetchReportData();
    setRefreshing(false);
    console.log("✅ onRefresh completed");
  }, [fetchReportData]);

  const handlePeriodChange = useCallback((newPeriod) => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.7,
      },
    });
    setSelectedPeriod(newPeriod);
    hideModal();
  }, [hideModal]);

  useFocusEffect(
    useCallback(() => {
      // Просто загружаем данные, без сброса анимаций
      console.log("🎯 useFocusEffect triggered");
      setLoading(true);
      setHasDataLoaded(false);
      setShowFallback(false);
      fetchReportData().finally(() => {
        console.log("✅ fetchReportData completed, setting loading to false");
        setLoading(false);
      });
    }, [fetchReportData])
  );

  // Убираем дублирующий useEffect для начальной загрузки

  // Start pulse animation on component mount
  useEffect(() => {
    startPulseAnimation();
  }, [startPulseAnimation]);

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
      animationType="none"
      onRequestClose={hideModal}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={hideModal}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  scale: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
                {
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
              opacity: modalAnim,
            },
          ]}
        >
          <Text style={styles.modalTitle}>{t('reports.select_period') || "Select Period"}</Text>
          <FlatList
            data={periods}
            keyExtractor={(item) => item.key}
            renderItem={({ item, index }) => (
              <Animated.View
                style={{
                  transform: [
                    {
                      translateX: modalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                  opacity: modalAnim,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    item.key === selectedPeriod && styles.modalOptionSelected
                  ]}
                  onPress={() => handlePeriodChange(item.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.modalOptionText,
                    item.key === selectedPeriod && styles.modalOptionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {item.key === selectedPeriod && (
                    <Animated.View
                      style={{
                        transform: [{ scale: pulseAnim }],
                      }}
                    >
                      <Ionicons name="checkmark" size={20} color="#2563EB" />
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    console.log("🔄 Rendering loading state");
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.loadingContainer, { opacity: 1 }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <ActivityIndicator size="large" color="#2563EB" />
          </Animated.View>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log("📱 Rendering main content, reportData exists:", !!reportData);
  console.log("📊 Report data:", reportData);

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
        <Animated.View
          style={[
            styles.header,
            {
              transform: [
                { translateY: slideAnim },
                { scale: headerAnim },
              ],
              opacity: showFallback ? 1 : headerAnim, // Fallback защита
            },
          ]}
        >
          <Text style={styles.headerTitle}>{t('reports.title') || "Financial Reports"}</Text>
          <Animated.View style={{ transform: [{ scale: exportButtonScale }] }}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={showModal}
              onPressIn={() => handleButtonPressIn(exportButtonScale)}
              onPressOut={() => handleButtonPressOut(exportButtonScale)}
              activeOpacity={0.8}
            >
              <Text style={styles.headerButtonText}>
                {periods.find(p => p.key === selectedPeriod)?.label || "Monthly"}
              </Text>
              <Animated.View
                style={{
                  transform: [{
                    rotate: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  }],
                }}
              >
                <Ionicons name="chevron-down" size={16} color="#2563EB" />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {reportData && (
          <>
            {/* Summary Cards */}
            <Animated.View
              style={[
                styles.summaryContainer,
                {
                  transform: [{ scale: summaryCardsAnim }],
                  opacity: showFallback ? 1 : summaryCardsAnim, // Fallback защита
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.summaryCard,
                  {
                    transform: [
                      {
                        translateX: summaryCardsAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.summaryLabel}>{t('reports.total_income') || "Total Income"}</Text>
                <Text style={[styles.summaryAmount, { color: "#22C55E" }]}>
                  ${reportData.income?.toLocaleString() || "0"}
                </Text>
                <Text style={styles.summaryPeriod}>{reportData.period_name}</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.summaryCard,
                  {
                    transform: [
                      {
                        translateX: summaryCardsAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.summaryLabel}>{t('reports.total_expenses') || "Total Expenses"}</Text>
                <Text style={[styles.summaryAmount, { color: "#EF4444" }]}>
                  ${reportData.expenses?.toLocaleString() || "0"}
                </Text>
                <Text style={styles.summaryPeriod}>{reportData.period_name}</Text>
              </Animated.View>
            </Animated.View>

            {/* Net Balance Card */}
            <Animated.View
              style={[
                styles.balanceCard,
                {
                  transform: [
                    { scale: balanceCardAnim },
                    {
                      rotateX: balanceCardAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['90deg', '0deg'],
                      }),
                    },
                  ],
                  opacity: showFallback ? 1 : balanceCardAnim, // Fallback защита
                },
              ]}
            >
              <LinearGradient
                colors={reportData.net_balance >= 0 ? ["#22C55E", "#16A34A"] : ["#EF4444", "#DC2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceGradient}
              >
                <View style={styles.balanceContent}>
                  <Text style={styles.balanceLabel}>{t('reports.net_balance') || "Net Balance"}</Text>
                  <Animated.Text
                    style={[
                      styles.balanceAmount,
                      { transform: [{ scale: pulseAnim }] }
                    ]}
                  >
                    {reportData.net_balance >= 0 ? "+" : ""}${reportData.net_balance?.toLocaleString() || "0"}
                  </Animated.Text>
                  <Text style={styles.balanceSubtext}>
                    {t('reports.savings_rate') || "Savings Rate"}: {reportData.savings_rate?.toFixed(1) || "0"}%
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Budget Status */}
            {(reportData.budget_total > 0 || reportData.budget_used > 0) && (
              <Animated.View
                style={[
                  styles.budgetCard,
                  {
                    transform: [{ scale: balanceCardAnim }],
                    opacity: showFallback ? 1 : balanceCardAnim, // Fallback защита
                  },
                ]}
              >
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetTitle}>{t('reports.budget_status') || "Budget Status"}</Text>
                  <View style={styles.budgetPercentageContainer}>
                    <Animated.Text
                      style={[
                        styles.budgetPercentage,
                        {
                          transform: [{ scale: pulseAnim }],
                          color: getBudgetPercentageColor(reportData.budget_percentage || 0)
                        }
                      ]}
                    >
                      {reportData.budget_percentage?.toFixed(0) || "0"}%
                    </Animated.Text>
                    {(reportData.budget_percentage || 0) > 100 && (
                      <View style={styles.overBudgetIndicator}>
                        <Ionicons name="warning" size={16} color="#EF4444" />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.budgetProgressContainer}>
                  <View style={styles.budgetProgressBg}>
                    <Animated.View
                      style={[
                        styles.budgetProgressFill,
                        {
                          width: budgetProgressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%'],
                            extrapolate: 'clamp',
                          }),
                          backgroundColor: getBudgetProgressColor(reportData.budget_percentage || 0)
                        }
                      ]}
                    />
                    {/* Overflow indicator for over-budget */}
                    {(reportData.budget_percentage || 0) > 100 && (
                      <Animated.View
                        style={[
                          styles.budgetOverflowFill,
                          {
                            width: budgetProgressAnim.interpolate({
                              inputRange: [0, 100],
                              outputRange: ['0%', '100%'],
                              extrapolate: 'clamp',
                            }),
                          }
                        ]}
                      />
                    )}
                  </View>
                </View>
                <View style={styles.budgetDetails}>
                  <Text style={styles.budgetDetailText}>
                    {t('reports.used') || "Used"}: ${Math.abs(reportData.budget_used || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.budgetDetailText}>
                    {t('reports.total') || "Total"}: ${Math.abs(reportData.budget_total || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.budgetDetailsSecondRow}>
                  <Text style={[
                    styles.budgetDetailText,
                    {
                      color: (reportData.budget_remaining || 0) < 0 ? "#EF4444" : isDark ? "#9CA3AF" : "#6B7280",
                      fontWeight: (reportData.budget_remaining || 0) < 0 ? "600" : "normal"
                    }
                  ]}>
                    {(reportData.budget_remaining || 0) < 0
                      ? `${t('reports.over_budget') || "Over Budget"}: ${Math.abs(reportData.budget_remaining || 0).toLocaleString()}`
                      : `${t('reports.remaining') || "Remaining"}: ${Math.abs(reportData.budget_remaining || 0).toLocaleString()}`
                    }
                  </Text>
                  {(reportData.budget_percentage || 0) > 100 && (
                    <Text style={[styles.budgetWarningText]}>
                      {t('reports.budget_exceeded') || "Budget exceeded!"}
                    </Text>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Income vs Expenses Chart */}
            {chartData.datasets[0].data.length > 0 && (
              <Animated.View
                style={[
                  styles.chartSection,
                  {
                    transform: [
                      { scale: chartAnimRef },
                      {
                        translateY: chartAnimRef.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                    opacity: showFallback ? 1 : chartAnimRef, // Fallback защита
                  },
                ]}
              >
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
                    <Animated.View
                      style={[
                        styles.legendItem,
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    >
                      <View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} />
                      <Text style={styles.legendText}>{t('reports.income') || "Income"}</Text>
                    </Animated.View>
                    <Animated.View
                      style={[
                        styles.legendItem,
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    >
                      <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                      <Text style={styles.legendText}>{t('reports.expenses') || "Expenses"}</Text>
                    </Animated.View>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Spending Categories Pie Chart */}
            {pieChartData.length > 0 && (
              <Animated.View
                style={[
                  styles.chartSection,
                  {
                    transform: [{ scale: chartAnimRef }],
                    opacity: showFallback ? 1 : chartAnimRef, // Fallback защита
                  },
                ]}
              >
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
              </Animated.View>
            )}

            {/* Transaction Statistics */}
            <Animated.View
              style={[
                styles.statsSection,
                {
                  transform: [{ scale: statsAnimRef }],
                  opacity: showFallback ? 1 : statsAnimRef, // Fallback защита
                },
              ]}
            >
              <Text style={styles.sectionTitle}>{t('reports.transaction_statistics') || "Transaction Statistics"}</Text>
              <View style={styles.statsGrid}>
                {[
                  { value: reportData.transaction_count || 0, label: t('reports.total_transactions') || "Total Transactions" },
                  { value: `$${reportData.average_transaction_amount?.toFixed(2) || "0.00"}`, label: t('reports.average_amount') || "Average Amount" },
                  { value: `$${reportData.largest_expense?.amount?.toLocaleString() || "0"}`, label: t('reports.largest_expense') || "Largest Expense" },
                  { value: reportData.most_spending_category || t('common.not_available'), label: t('reports.top_category') || "Top Category" }
                ].map((stat, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.statItem,
                      {
                        transform: [
                          {
                            translateY: statsAnimRef.interpolate({
                              inputRange: [0, 1],
                              outputRange: [30, 0],
                            }),
                          },
                          { scale: pulseAnim },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Insights */}
            {reportData.insights && reportData.insights.length > 0 && (
              <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>{t('reports.financial_insights') || "Financial Insights"}</Text>
                <View style={styles.insightsList}>
                  {reportData.insights.map((insight, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.insightItem,
                        {
                          transform: [
                            {
                              translateX: insightAnimations[index] ? insightAnimations[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [100, 0],
                              }) : 0,
                            },
                            {
                              scale: insightAnimations[index] || new Animated.Value(1),
                            },
                          ],
                          opacity: insightAnimations[index] || new Animated.Value(1),
                        },
                      ]}
                    >
                      <View style={[
                        styles.insightIcon,
                        {
                          backgroundColor:
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
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Export Button */}
        <View style={styles.exportSection}>
          <Animated.View style={{ transform: [{ scale: exportButtonScale }] }}>
            <TouchableOpacity
              style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
              onPress={handleExportReport}
              onPressIn={() => handleButtonPressIn(exportButtonScale)}
              onPressOut={() => handleButtonPressOut(exportButtonScale)}
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
                  <Animated.View style={{ transform: [{ rotate: '360deg' }] }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </Animated.View>
                ) : (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                  </Animated.View>
                )}
                <Text style={styles.exportButtonText}>
                  {exporting ? (t('reports.exporting') || "Exporting...") : (t('reports.export_report') || "Export Report")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.viewExportsButton}
            onPress={() => navigation.navigate("Export Report")}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="folder-outline" size={20} color="#2563EB" />
            </Animated.View>
            <Text style={styles.viewExportsText}>{t('reports.view_all_exports') || "View All Exports"}</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {!reportData && !loading && (
          <View style={styles.emptyState}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="document-text-outline" size={64} color={isDark ? "#6B7280" : "#9CA3AF"} />
            </Animated.View>
            <Text style={styles.emptyTitle}>{t('reports.no_data') || "No Report Data"}</Text>
            <Text style={styles.emptySubtitle}>{t('reports.no_data_subtitle') || "Start adding transactions to see your financial reports"}</Text>
          </View>
        )}
      </ScrollView>

      <PeriodModal />
      <ChatBotFAB navigation={navigation} />
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
    budgetPercentageContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    overBudgetIndicator: {
      backgroundColor: "#FEE2E2",
      borderRadius: 12,
      padding: 2,
    },
    budgetOverflowFill: {
      position: "absolute",
      top: 0,
      left: 0,
      height: "100%",
      backgroundColor: "#EF4444",
      borderRadius: 4,
      opacity: 0.3,
    },
    budgetDetailsSecondRow: {
      marginTop: 8,
      alignItems: "flex-start",
    },
    budgetWarningText: {
      fontSize: 12,
      color: "#EF4444",
      fontWeight: "600",
      marginTop: 4,
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