// src/screens/AnalyticsScreen.js

import React, { useContext, useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { LineChart } from "react-native-chart-kit";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";

const screenWidth = Dimensions.get("window").width;

const IconCmp = (iconName) =>
    iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

const AnalyticsScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    const [budgetData] = useState({
        totalBudget: 5000,
        spent: 3250,
    });

    const [chartData] = useState({
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
            {
                data: [2800, 2600, 3100, 2400, 3200, 3250],
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                strokeWidth: 3,
            },
        ],
    });

    const [categories] = useState([
        {
            id: 1,
            name: "Housing",
            icon: "home",
            color: "#8B5CF6",
            spent: 1500,
            budget: 1800,
            percentage: 83,
            iconBg: "#F3E8FF"
        },
        {
            id: 2,
            name: "Food",
            icon: "restaurant",
            color: "#10B981",
            spent: 600,
            budget: 800,
            percentage: 75,
            iconBg: "#D1FAE5"
        },
        {
            id: 3,
            name: "Transportation",
            icon: "car",
            color: "#F59E0B",
            spent: 400,
            budget: 500,
            percentage: 80,
            iconBg: "#FEF3C7"
        },
        {
            id: 4,
            name: "Entertainment",
            icon: "game-controller",
            color: "#EC4899",
            spent: 300,
            budget: 400,
            percentage: 75,
            iconBg: "#FCE7F3"
        },
        {
            id: 5,
            name: "Shopping",
            icon: "bag",
            color: "#8B5CF6",
            spent: 450,
            budget: 500,
            percentage: 90,
            iconBg: "#F3E8FF"
        }
    ]);

    const [insights] = useState([
        {
            id: 1,
            type: "positive",
            icon: "trending-down",
            text: "15% less spending than last month",
            color: "#10B981",
            bgColor: "#D1FAE5"
        },
        {
            id: 2,
            type: "neutral",
            icon: "trending-down",
            text: "Housing under budget by $300",
            color: "#2563EB",
            bgColor: "#EFF6FF"
        },
        {
            id: 3,
            type: "warning",
            icon: "trending-up",
            text: "Entertainment over budget by $50",
            color: "#EF4444",
            bgColor: "#FEE2E2"
        }
    ]);

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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('analytics.title')}</Text>
                <TouchableOpacity>
                    <Ionicons name="menu-outline" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Budget Cards */}
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
                                <View style={styles.progressLine} />
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
                                <View style={styles.progressLine} />
                            </View>
                        </LinearGradient>
                    </View>
                </View>

                {/* Monthly Overview Chart */}
                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>{t('analytics.monthly_overview')}</Text>
                    <View style={styles.chartContainer}>
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
                    </View>
                </View>

                {/* Spending by Category */}
                <View style={styles.categorySection}>
                    <Text style={styles.sectionTitle}>{t('analytics.spending_by_category')}</Text>

                    <View style={styles.categoriesList}>
                        {categories.map((category) => {
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
                </View>

                {/* Smart Insights */}
                <View style={styles.insightsSection}>
                    <Text style={styles.sectionTitle}>{t('analytics.smart_insights')}</Text>

                    <View style={styles.insightsList}>
                        {insights.map((insight) => (
                            <View key={insight.id} style={[styles.insightItem, { backgroundColor: insight.bgColor }]}>
                                <View style={styles.insightIcon}>
                                    <Ionicons
                                        name={insight.icon}
                                        size={16}
                                        color={insight.color}
                                    />
                                </View>
                                <Text style={[styles.insightText, { color: insight.color }]}>
                                    {insight.text}
                                </Text>
                            </View>
                        ))}
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
            width: "70%",
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
        insightsSection: {
            marginBottom: 32,
        },
        insightsList: {
            gap: 12,
        },
        insightItem: {
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 12,
            padding: 16,
        },
        insightIcon: {
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },
        insightText: {
            fontSize: 14,
            fontWeight: "500",
            flex: 1,
        },
    });

export default AnalyticsScreen;