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

    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [
            {
                data: [],
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                strokeWidth: 3,
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

    const fetchDailyOverview = useCallback(async () => {
        try {
            const daysToFetch = 7;
            const today = new Date();
            let dailyTotals = {};

            for (let i = daysToFetch - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().slice(0, 10);

                const res = await apiFetch(
                    `/api/v1/transactions/?transaction_type=expense&start_date=${dateString}&end_date=${dateString}&limit=1000`
                );
                if (!res.ok) throw new Error("Ошибка загрузки расходов");
                const data = await res.json();
                const total = data.transactions.reduce((sum, tx) => sum + tx.amount, 0);

                const dayLabel = date.getDate().toString();
                dailyTotals[dayLabel] = total;
            }

            const labels = Object.keys(dailyTotals);
            const dataPoints = Object.values(dailyTotals);

            setChartData({
                labels,
                datasets: [{ data: dataPoints, color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, strokeWidth: 3 }]
            });
        } catch (error) {
            console.error("Ошибка загрузки daily overview:", error);
        }
    }, []);

    useEffect(() => {
        fetchBudgetData();
        fetchDailyOverview();
    }, [fetchBudgetData, fetchDailyOverview]);

    const chartConfig = {
        backgroundColor: isDark ? "#1F2937" : "#ffffff",
        backgroundGradientFrom: isDark ? "#1F2937" : "#ffffff",
        backgroundGradientTo: isDark ? "#1F2937" : "#ffffff",
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#2563EB",
            fill: "#2563EB"
        },
        propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: isDark ? "#374151" : "#E5E7EB",
            strokeWidth: 1,
        },
        fillShadowGradient: '#2563EB',
        fillShadowGradientOpacity: 0.1,
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
                ) : budgetData ? (
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

                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>{t('analytics.monthly_overview')}</Text>
                    <View style={styles.chartContainer}>
                        {chartData.labels.length === 0 ? (
                            <Text style={{ color: isDark ? "#FFF" : "#000", textAlign: "center" }}>
                                {t('analytics.no_data')}
                            </Text>
                        ) : (
                            <LineChart
                                data={chartData}
                                width={screenWidth - 40}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                                withInnerLines={true}
                                withOuterLines={false}
                                withVerticalLines={false}
                                withHorizontalLines={true}
                                withDots={true}
                                withShadow={false}
                                fromZero={false}
                            />
                        )}
                    </View>
                </View>

                <View style={styles.categorySection}>
                    <Text style={styles.sectionTitle}>{t('analytics.spending_by_category')}</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
                    ) : (
                        <View style={styles.categoriesList}>
                            {categories.length === 0 ? (
                                <Text style={{ color: isDark ? "#FFF" : "#000", textAlign: "center" }}>
                                    {t('analytics.no_categories')}
                                </Text>
                            ) : categories.map((category) => {
                                const Icon = IconCmp(category.icon);

                                return (
                                    <View key={category.id} style={styles.categoryItem}>
                                        <View style={styles.categoryLeft}>
                                            <View style={[styles.categoryIcon, { backgroundColor: category.iconBg }]}>
                                                <Icon
                                                    name={category.icon}
                                                    size={20}
                                                    color={category.color}
                                                />
                                            </View>
                                            <View style={styles.categoryInfo}>
                                                <Text style={styles.categoryName}>{category.name}</Text>
                                                <Text style={styles.categoryAmount}>
                                                    $ {category.spent} / $ {category.budget}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.categoryRight}>
                                            <Text style={styles.categoryPercentage}>{category.percentage} %</Text>
                                            <View style={styles.categoryProgressContainer}>
                                                <Progress.Bar
                                                    progress={category.percentage / 100}
                                                    width={120}
                                                    height={4}
                                                    color={category.color}
                                                    unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                                                    borderWidth={0}
                                                    borderRadius={2}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
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
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#374151" : "#E5E7EB",
        },
        backButton: {
            padding: 4,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        content: {
            flex: 1,
            paddingHorizontal: 20,
        },
        budgetCards: {
            flexDirection: "row",
            gap: 12,
            marginTop: 20,
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
            padding: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        chart: {
            borderRadius: 16,
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
    });

export default AnalyticsScreen;