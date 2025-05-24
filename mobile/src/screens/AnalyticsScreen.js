// src/screens/AnalyticsScreen.js

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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { LineChart } from "react-native-chart-kit";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";

const screenWidth = Dimensions.get("window").width;

const IconCmp = (iconName) =>
    iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

const AnalyticsScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    const [budgetData, setBudgetData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingChart, setLoadingChart] = useState(false);

    // Новые состояния для выбранной категории
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryData, setSelectedCategoryData] = useState(null);

    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [
            {
                data: [],
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                strokeWidth: 2,
            },
        ],
    });

    const fetchBudgetData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiFetch("/api/v1/budgets/current-month");
            if (!response.ok) throw new Error("Failed to fetch budgets");
            const data = await response.json();

            const totalBudget = data.total_budget || 0;
            const totalSpent = data.spent || 0;
            setBudgetData({ totalBudget, spent: totalSpent });

            const cats = (data.budgets_by_category || []).map(b => ({
                id: b.category_id,
                budgetId: b.id,
                name: b.category_name,
                icon: b.category_icon,
                color: b.category_color,
                spent: b.spent_amount,
                budget: b.amount,
                percentage: b.usage_percentage,
                iconBg: b.category_color ? `${b.category_color}33` : "#ccc33",
            }));

            setCategories(cats);
        } catch (error) {
            console.error("Ошибка загрузки бюджета:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDailyOverview = useCallback(async (categoryId = null) => {
        setLoadingChart(true);
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();

            const dailyData = [];
            const labels = [];

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateString = date.toISOString().slice(0, 10);

                try {
                    let url = `/api/v1/transactions/?transaction_type=expense&start_date=${dateString}&end_date=${dateString}&limit=1000`;

                    // Если выбрана категория, фильтруем по ней
                    if (categoryId) {
                        url += `&category_id=${categoryId}`;
                    }

                    const res = await apiFetch(url);

                    if (res.ok) {
                        const data = await res.json();
                        const dayTotal = data.transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
                        dailyData.push(dayTotal);
                    } else {
                        dailyData.push(0);
                    }
                } catch (error) {
                    console.error(`Error fetching data for ${dateString}:`, error);
                    dailyData.push(0);
                }

                labels.push(day.toString());
            }

            // Определяем цвет графика в зависимости от выбранной категории
            const chartColor = selectedCategory
                ? selectedCategory.color
                : 'rgba(37, 99, 235, 1)';

            setChartData({
                labels,
                datasets: [{
                    data: dailyData,
                    color: (opacity = 1) => selectedCategory
                        ? `${selectedCategory.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
                        : `rgba(37, 99, 235, ${opacity})`,
                    strokeWidth: 2
                }]
            });

        } catch (error) {
            console.error("Ошибка загрузки daily overview:", error);
            setChartData({
                labels: [],
                datasets: [{ data: [] }]
            });
        } finally {
            setLoadingChart(false);
        }
    }, [selectedCategory]);

    const fetchCategoryDetails = useCallback(async (category) => {
        try {
            // Получаем детальную информацию о категории
            const response = await apiFetch(`/api/v1/budgets/${category.budgetId}`);
            if (!response.ok) throw new Error("Failed to fetch category details");
            const data = await response.json();

            // Получаем все транзакции этой категории за месяц
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

            const transactionsResponse = await apiFetch(
                `/api/v1/transactions/?category_id=${category.id}&start_date=${startDate}&end_date=${endDate}&limit=1000`
            );

            let transactions = [];
            if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json();
                transactions = transactionsData.transactions || [];
            }

            // Вычисляем дополнительную статистику
            const averageDailySpending = category.spent / new Date().getDate();
            const transactionCount = transactions.length;
            const largestTransaction = transactions.length > 0
                ? Math.max(...transactions.map(t => Math.abs(t.amount)))
                : 0;

            const projectedMonthlySpending = averageDailySpending * new Date(year, month + 1, 0).getDate();

            setSelectedCategoryData({
                ...data,
                transactions,
                averageDailySpending,
                transactionCount,
                largestTransaction,
                projectedMonthlySpending,
            });

        } catch (error) {
            console.error("Error fetching category details:", error);
        }
    }, []);

    const handleCategorySelect = useCallback((category) => {
        if (selectedCategory?.id === category.id) {
            // Если уже выбрана, отменяем выбор
            setSelectedCategory(null);
            setSelectedCategoryData(null);
            fetchDailyOverview(); // Загружаем общие данные
        } else {
            // Выбираем новую категорию
            setSelectedCategory(category);
            fetchCategoryDetails(category);
            fetchDailyOverview(category.id); // Загружаем данные для категории
        }
    }, [selectedCategory, fetchDailyOverview, fetchCategoryDetails]);

    useEffect(() => {
        fetchBudgetData();
        fetchDailyOverview();
    }, [fetchBudgetData, fetchDailyOverview]);

    const chartConfig = {
        backgroundColor: isDark ? "#1F2937" : "#ffffff",
        backgroundGradientFrom: isDark ? "#1F2937" : "#ffffff",
        backgroundGradientTo: isDark ? "#1F2937" : "#ffffff",
        decimalPlaces: 0,
        color: (opacity = 1) => selectedCategory
            ? `${selectedCategory.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
            : `rgba(37, 99, 235, ${opacity})`,
        labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: (value, index) => {
                const today = new Date().getDate();
                return index + 1 === today ? "4" : "3";
            },
            strokeWidth: "1",
            stroke: (value, index) => {
                const today = new Date().getDate();
                if (index + 1 === today) return "#EF4444";
                return selectedCategory ? selectedCategory.color : "#2563EB";
            },
            fill: (value, index) => {
                const today = new Date().getDate();
                if (index + 1 === today) return "#EF4444";
                return selectedCategory ? selectedCategory.color : "#2563EB";
            }
        },
        propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: isDark ? "#374151" : "#E5E7EB",
            strokeWidth: 1,
        },
        fillShadowGradient: selectedCategory ? selectedCategory.color : '#2563EB',
        fillShadowGradientOpacity: 0.1,
        formatXLabel: (value) => {
            const dayNum = parseInt(value);
            return dayNum % 5 === 1 || dayNum === 1 ? value : '';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header с индикацией выбранной категории */}
                <View style={styles.headerSection}>
                    {selectedCategory ? (
                        <View style={styles.selectedCategoryHeader}>
                            <View style={styles.selectedCategoryInfo}>
                                <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.iconBg }]}>
                                    {(() => {
                                        const Icon = IconCmp(selectedCategory.icon);
                                        return <Icon name={selectedCategory.icon} size={24} color={selectedCategory.color} />;
                                    })()}
                                </View>
                                <View>
                                    <Text style={styles.selectedCategoryName}>{selectedCategory.name}</Text>
                                    <Text style={styles.selectedCategorySubtitle}>Category Analytics</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleCategorySelect(selectedCategory)}
                                style={styles.clearSelectionButton}
                            >
                                <Ionicons name="close" size={20} color={isDark ? "#F9FAFB" : "#111827"} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <Text style={styles.mainTitle}>Budget Analytics</Text>
                    )}
                </View>

                {/* Budget Cards - показываем либо общие, либо для выбранной категории */}
                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
                ) : selectedCategory ? (
                    // Карточки для выбранной категории
                    <View style={styles.budgetCards}>
                        <View style={styles.budgetCard}>
                            <LinearGradient
                                colors={[selectedCategory.color, selectedCategory.color]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardLabel}>Budget Limit</Text>
                                <Text style={styles.cardAmount}>${selectedCategory.budget.toLocaleString()}</Text>
                                <View style={styles.cardProgress}>
                                    <View style={[styles.progressLine, { width: "100%" }]} />
                                </View>
                            </LinearGradient>
                        </View>

                        <View style={styles.budgetCard}>
                            <LinearGradient
                                colors={selectedCategory.percentage > 100 ? ["#EF4444", "#DC2626"] : ["#10B981", "#059669"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardLabel}>Spent</Text>
                                <Text style={styles.cardAmount}>${selectedCategory.spent.toLocaleString()}</Text>
                                <View style={styles.cardProgress}>
                                    <View
                                        style={[
                                            styles.progressLine,
                                            {
                                                width: `${Math.min(selectedCategory.percentage, 100)}%`,
                                            },
                                        ]}
                                    />
                                </View>
                            </LinearGradient>
                        </View>
                    </View>
                ) : budgetData ? (
                    // Общие карточки
                    <View style={styles.budgetCards}>
                        <View style={styles.budgetCard}>
                            <LinearGradient
                                colors={["#2563EB", "#3B82F6"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardLabel}>{t('analytics.total_budget')}</Text>
                                <Text style={styles.cardAmount}>${budgetData.totalBudget.toLocaleString()}</Text>
                                <View style={styles.cardProgress}>
                                    <View style={[styles.progressLine, { width: "100%" }]} />
                                </View>
                            </LinearGradient>
                        </View>

                        <View style={styles.budgetCard}>
                            <LinearGradient
                                colors={["#10B981", "#059669"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardLabel}>{t('analytics.spent')}</Text>
                                <Text style={styles.cardAmount}>${budgetData.spent.toLocaleString()}</Text>
                                <View style={styles.cardProgress}>
                                    <View
                                        style={[
                                            styles.progressLine,
                                            {
                                                width:
                                                    budgetData.totalBudget > 0
                                                        ? `${(budgetData.spent / budgetData.totalBudget) * 100}%`
                                                        : "0%",
                                            },
                                        ]}
                                    />
                                </View>
                            </LinearGradient>
                        </View>
                    </View>
                ) : null}

                {/* Chart Section */}
                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>
                        {selectedCategory
                            ? `${selectedCategory.name} - Daily Spending`
                            : t('analytics.monthly_overview')
                        }
                    </Text>
                    <View style={styles.chartContainer}>
                        {loadingChart ? (
                            <View style={styles.chartLoadingContainer}>
                                <ActivityIndicator size="large" color={selectedCategory ? selectedCategory.color : "#2563EB"} />
                                <Text style={styles.loadingText}>Loading daily data...</Text>
                            </View>
                        ) : chartData.labels.length === 0 ? (
                            <Text style={{ color: isDark ? "#FFF" : "#000", textAlign: "center" }}>
                                No data available for this month
                            </Text>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={true}
                                style={styles.chartScrollView}
                                contentContainerStyle={styles.chartScrollContent}
                            >
                                <LineChart
                                    data={chartData}
                                    width={Math.max(screenWidth - 40, chartData.labels.length * 25)}
                                    height={220}
                                    chartConfig={chartConfig}
                                    bezier={false}
                                    style={styles.chart}
                                    withInnerLines={true}
                                    withOuterLines={false}
                                    withVerticalLines={false}
                                    withHorizontalLines={true}
                                    withDots={true}
                                    withShadow={false}
                                    fromZero={true}
                                />
                            </ScrollView>
                        )}
                    </View>
                </View>

                {/* Categories Section */}
                <View style={styles.categorySection}>
                    <Text style={styles.sectionTitle}>
                        {selectedCategory ? "Other Categories" : t('analytics.spending_by_category')}
                    </Text>
                    {loading ? (
                        <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
                    ) : (
                        <View style={styles.categoriesList}>
                            {categories.length === 0 ? (
                                <Text style={{ color: isDark ? "#FFF" : "#000", textAlign: "center" }}>
                                    No categories with budgets found
                                </Text>
                            ) : categories.map((category) => {
                                const Icon = IconCmp(category.icon);
                                const isSelected = selectedCategory?.id === category.id;

                                return (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[
                                            styles.categoryItem,
                                            isSelected && styles.categoryItemSelected
                                        ]}
                                        onPress={() => handleCategorySelect(category)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.categoryLeft}>
                                            <View style={[
                                                styles.categoryIcon,
                                                { backgroundColor: category.iconBg },
                                                isSelected && { backgroundColor: category.color }
                                            ]}>
                                                <Icon
                                                    name={category.icon}
                                                    size={20}
                                                    color={isSelected ? "#FFFFFF" : category.color}
                                                />
                                            </View>
                                            <View style={styles.categoryInfo}>
                                                <Text style={[
                                                    styles.categoryName,
                                                    isSelected && { color: category.color }
                                                ]}>
                                                    {category.name}
                                                </Text>
                                                <Text style={styles.categoryAmount}>
                                                    $ {category.spent} / $ {category.budget}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.categoryRight}>
                                            <Text style={[
                                                styles.categoryPercentage,
                                                isSelected && { color: category.color }
                                            ]}>
                                                {Math.round(category.percentage)} %
                                            </Text>
                                            <View style={styles.categoryProgressContainer}>
                                                <Progress.Bar
                                                    progress={Math.min(category.percentage / 100, 1)}
                                                    width={120}
                                                    height={4}
                                                    color={category.percentage > 100 ? "#EF4444" : category.color}
                                                    unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                                                    borderWidth={0}
                                                    borderRadius={2}
                                                />
                                            </View>
                                        </View>

                                        {isSelected && (
                                            <View style={styles.selectedIndicator}>
                                                <Ionicons name="checkmark-circle" size={24} color={category.color} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Insights Section */}
                <View style={styles.insightsSection}>
                    <Text style={styles.sectionTitle}>
                        {selectedCategory ? `${selectedCategory.name} Insights` : t('analytics.smart_insights')}
                    </Text>
                    <View style={styles.insightsList}>
                        {selectedCategory && selectedCategoryData ? (
                            // Инсайты для выбранной категории
                            <>
                                <View style={styles.insightItem}>
                                    <View style={[styles.insightDot, { backgroundColor: selectedCategory.color }]} />
                                    <Text style={styles.insightText}>
                                        Average daily spending: ${selectedCategoryData.averageDailySpending.toFixed(2)}
                                    </Text>
                                </View>

                                <View style={styles.insightItem}>
                                    <View style={[styles.insightDot, { backgroundColor: selectedCategory.color }]} />
                                    <Text style={styles.insightText}>
                                        Total transactions this month: {selectedCategoryData.transactionCount}
                                    </Text>
                                </View>

                                {selectedCategoryData.largestTransaction > 0 && (
                                    <View style={styles.insightItem}>
                                        <View style={[styles.insightDot, { backgroundColor: selectedCategory.color }]} />
                                        <Text style={styles.insightText}>
                                            Largest transaction: ${selectedCategoryData.largestTransaction.toFixed(2)}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.insightItem}>
                                    <View style={[styles.insightDot, { backgroundColor: selectedCategory.color }]} />
                                    <Text style={styles.insightText}>
                                        Projected monthly spending: ${selectedCategoryData.projectedMonthlySpending.toFixed(2)}
                                        {selectedCategoryData.projectedMonthlySpending > selectedCategory.budget
                                            ? " (⚠️ Over budget)"
                                            : " (✅ Within budget)"
                                        }
                                    </Text>
                                </View>
                            </>
                        ) : budgetData ? (
                            // Общие инсайты
                            <>
                                <View style={styles.insightItem}>
                                    <View style={styles.insightDot} />
                                    <Text style={styles.insightText}>
                                        {budgetData.spent === 0
                                            ? "No expenses recorded this month yet."
                                            : `Average daily spending: $${(budgetData.spent / new Date().getDate()).toFixed(2)}`
                                        }
                                    </Text>
                                </View>

                                {categories.length > 0 && (
                                    <View style={styles.insightItem}>
                                        <View style={styles.insightDot} />
                                        <Text style={styles.insightText}>
                                            {categories.filter(c => c.percentage > 90).length > 0
                                                ? `${categories.filter(c => c.percentage > 90).length} categories are close to budget limit.`
                                                : "All categories are within budget limits."
                                            }
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.insightItem}>
                                    <View style={styles.insightDot} />
                                    <Text style={styles.insightText}>
                                        {budgetData.totalBudget > budgetData.spent
                                            ? `You have $${(budgetData.totalBudget - budgetData.spent).toFixed(2)} remaining this month.`
                                            : "You have exceeded your total budget for this month."
                                        }
                                    </Text>
                                </View>

                                <View style={styles.insightItem}>
                                    <View style={styles.insightDot} />
                                    <Text style={styles.insightText}>
                                        💡 Tap on any category above to see detailed analytics
                                    </Text>
                                </View>
                            </>
                        ) : null}
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
        content: {
            flex: 1,
            paddingHorizontal: 20,
        },
        headerSection: {
            marginTop: 20,
            marginBottom: 16,
        },
        mainTitle: {
            fontSize: 24,
            fontWeight: "700",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        selectedCategoryHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        selectedCategoryInfo: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
        },
        selectedCategoryIcon: {
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },
        selectedCategoryName: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        selectedCategorySubtitle: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        clearSelectionButton: {
            padding: 8,
            borderRadius: 8,
            backgroundColor: isDark ? "#374151" : "#F3F4F6",
        },
        budgetCards: {
            flexDirection: "row",
            gap: 12,
            marginBottom: 24,
        },
        budgetCard: {
            flex: 1,
            borderRadius: 16,
            overflow: "hidden",
        },
        cardGradient: {
            padding: 20,
            height: 120,
            justifyContent: "space-between",
        },
        cardLabel: {
            fontSize: 14,
            color: "#FFFFFF",
            opacity: 0.9,
        },
        cardAmount: {
            fontSize: 24,
            fontWeight: "700",
            color: "#FFFFFF",
        },
        cardProgress: {
            height: 4,
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            borderRadius: 2,
            overflow: "hidden",
        },
        progressLine: {
            height: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: 2,
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
        chartContainer: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 16,
            padding: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        chartLoadingContainer: {
            alignItems: "center",
            paddingVertical: 40,
        },
        loadingText: {
            marginTop: 10,
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        chartScrollView: {
            flex: 1,
        },
        chartScrollContent: {
            paddingRight: 20,
        },
        chart: {
            borderRadius: 16,
            marginLeft: -15,
        },
        categorySection: {
            marginBottom: 32,
        },
        categoriesList: {
            gap: 16,
        },
        categoryItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
            position: "relative",
        },
        categoryItemSelected: {
            borderWidth: 2,
            borderColor: isDark ? "#374151" : "#E5E7EB",
            backgroundColor: isDark ? "#374151" : "#F8FAFC",
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
        categoryInfo: {
            flex: 1,
        },
        categoryName: {
            fontSize: 16,
            fontWeight: "500",
            color: isDark ? "#F9FAFB" : "#111827",
            marginBottom: 2,
        },
        categoryAmount: {
            fontSize: 13,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        categoryRight: {
            alignItems: "flex-end",
        },
        categoryPercentage: {
            fontSize: 14,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
            marginBottom: 8,
        },
        categoryProgressContainer: {
            width: 120,
        },
        selectedIndicator: {
            position: "absolute",
            top: 8,
            right: 8,
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
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#2563EB",
            marginTop: 6,
            marginRight: 12,
        },
        insightText: {
            fontSize: 14,
            color: isDark ? "#D1D5DB" : "#4B5563",
            flex: 1,
            lineHeight: 20,
        },
    });

export default AnalyticsScreen;