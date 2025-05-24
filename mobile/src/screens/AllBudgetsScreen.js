// src/screens/AllBudgetsScreen.js

import React, { useContext, useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";

const IconCmp = (iconName) =>
    iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

const AllBudgetsScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    const [budgets, setBudgets] = useState([
        {
            id: 1,
            categoryName: "Housing",
            categoryIcon: "home",
            categoryColor: "#8B5CF6",
            iconBg: "#F3E8FF",
            budgetLimit: 1500,
            spent: 1200,
            remaining: 300,
            percentage: 80,
            status: "on_track" // on_track, over_budget, warning
        },
        {
            id: 2,
            categoryName: "Food & Dining",
            categoryIcon: "restaurant",
            categoryColor: "#10B981",
            iconBg: "#D1FAE5",
            budgetLimit: 800,
            spent: 650,
            remaining: 150,
            percentage: 81,
            status: "on_track"
        },
        {
            id: 3,
            categoryName: "Transportation",
            categoryIcon: "car",
            categoryColor: "#F59E0B",
            iconBg: "#FEF3C7",
            budgetLimit: 500,
            spent: 520,
            remaining: -20,
            percentage: 104,
            status: "over_budget"
        },
        {
            id: 4,
            categoryName: "Shopping",
            categoryIcon: "bag",
            categoryColor: "#EC4899",
            iconBg: "#FCE7F3",
            budgetLimit: 400,
            spent: 350,
            remaining: 50,
            percentage: 88,
            status: "warning"
        },
        {
            id: 5,
            categoryName: "Entertainment",
            categoryIcon: "game-controller",
            categoryColor: "#06B6D4",
            iconBg: "#CFFAFE",
            budgetLimit: 300,
            spent: 200,
            remaining: 100,
            percentage: 67,
            status: "on_track"
        },
        {
            id: 6,
            categoryName: "Health & Fitness",
            categoryIcon: "fitness",
            categoryColor: "#EF4444",
            iconBg: "#FEE2E2",
            budgetLimit: 200,
            spent: 150,
            remaining: 50,
            percentage: 75,
            status: "on_track"
        }
    ]);

    const [loading, setLoading] = useState(false);

    const getStatusColor = (status) => {
        switch (status) {
            case "on_track":
                return "#10B981";
            case "warning":
                return "#F59E0B";
            case "over_budget":
                return "#EF4444";
            default:
                return "#6B7280";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "on_track":
                return t('all_budgets.on_track');
            case "warning":
                return t('all_budgets.warning');
            case "over_budget":
                return t('all_budgets.over_budget');
            default:
                return "";
        }
    };

    const handleEditBudget = (budgetId) => {
        // Navigate to edit budget or show modal
        console.log("Edit budget:", budgetId);
    };

    const handleDeleteBudget = (budgetId) => {
        Alert.alert(
            t('all_budgets.delete_budget'),
            t('all_budgets.delete_confirmation'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: () => {
                        setBudgets(prev => prev.filter(budget => budget.id !== budgetId));
                    }
                }
            ]
        );
    };

    const totalBudgetLimit = budgets.reduce((sum, budget) => sum + budget.budgetLimit, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    const totalRemaining = totalBudgetLimit - totalSpent;
    const overallPercentage = totalBudgetLimit > 0 ? Math.round((totalSpent / totalBudgetLimit) * 100) : 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('all_budgets.title')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Set Budget")}>
                    <Ionicons name="add" size={24} color="#2563EB" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Text style={styles.summaryTitle}>{t('all_budgets.budget_summary')}</Text>
                        <View style={styles.summaryPercentage}>
                            <Text style={styles.percentageText}>{overallPercentage}%</Text>
                        </View>
                    </View>

                    <View style={styles.summaryStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>{t('all_budgets.total_limit')}</Text>
                            <Text style={styles.statAmount}>${totalBudgetLimit.toLocaleString()}</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>{t('all_budgets.total_spent')}</Text>
                            <Text style={[styles.statAmount, { color: "#2563EB" }]}>
                                ${totalSpent.toLocaleString()}
                            </Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>{t('all_budgets.total_remaining')}</Text>
                            <Text style={[styles.statAmount, {
                                color: totalRemaining >= 0 ? "#10B981" : "#EF4444"
                            }]}>
                                ${Math.abs(totalRemaining).toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryProgress}>
                        <Progress.Bar
                            progress={overallPercentage / 100}
                            width={null}
                            height={8}
                            color={overallPercentage > 90 ? "#EF4444" : "#2563EB"}
                            unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                            borderWidth={0}
                            borderRadius={4}
                        />
                    </View>
                </View>

                {/* Budgets List */}
                <View style={styles.budgetsList}>
                    <Text style={styles.sectionTitle}>{t('all_budgets.all_budgets')}</Text>

                    {budgets.map((budget) => {
                        const Icon = IconCmp(budget.categoryIcon);
                        const statusColor = getStatusColor(budget.status);

                        return (
                            <View key={budget.id} style={styles.budgetItem}>
                                <View style={styles.budgetHeader}>
                                    <View style={styles.budgetLeft}>
                                        <View style={[styles.categoryIcon, { backgroundColor: budget.iconBg }]}>
                                            <Icon
                                                name={budget.categoryIcon}
                                                size={24}
                                                color={budget.categoryColor}
                                            />
                                        </View>
                                        <View style={styles.budgetInfo}>
                                            <Text style={styles.budgetName}>{budget.categoryName}</Text>
                                            <Text style={styles.budgetAmount}>
                                                ${budget.spent} / ${budget.budgetLimit}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.budgetRight}>
                                        <View style={styles.budgetActions}>
                                            <TouchableOpacity
                                                onPress={() => handleEditBudget(budget.id)}
                                                style={styles.actionButton}
                                            >
                                                <Ionicons name="create-outline" size={20} color="#6B7280" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleDeleteBudget(budget.id)}
                                                style={styles.actionButton}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.budgetStatus}>
                                            <Text style={[styles.statusText, { color: statusColor }]}>
                                                {getStatusText(budget.status)}
                                            </Text>
                                            <Text style={styles.percentageSmall}>{budget.percentage}%</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.budgetProgress}>
                                    <Progress.Bar
                                        progress={Math.min(budget.percentage / 100, 1)}
                                        width={null}
                                        height={6}
                                        color={budget.percentage > 100 ? "#EF4444" : budget.categoryColor}
                                        unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                                        borderWidth={0}
                                        borderRadius={3}
                                    />
                                </View>

                                <View style={styles.budgetDetails}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>{t('all_budgets.remaining')}</Text>
                                        <Text style={[styles.detailAmount, {
                                            color: budget.remaining >= 0 ? "#10B981" : "#EF4444"
                                        }]}>
                                            ${Math.abs(budget.remaining)}
                                        </Text>
                                    </View>

                                    {budget.remaining < 0 && (
                                        <View style={styles.warningBadge}>
                                            <Ionicons name="warning" size={12} color="#EF4444" />
                                            <Text style={styles.warningText}>
                                                {t('all_budgets.over_limit')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Empty State */}
                {budgets.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="wallet-outline" size={64} color={isDark ? "#6B7280" : "#9CA3AF"} />
                        <Text style={styles.emptyTitle}>{t('all_budgets.no_budgets')}</Text>
                        <Text style={styles.emptySubtitle}>{t('all_budgets.create_first_budget')}</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => navigation.navigate("Set Budget")}
                        >
                            <Text style={styles.createButtonText}>{t('all_budgets.create_budget')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        summaryCard: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            marginTop: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        summaryHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
        },
        summaryTitle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        summaryPercentage: {
            backgroundColor: isDark ? "#374151" : "#F3F4F6",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
        },
        percentageText: {
            fontSize: 14,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        summaryStats: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 16,
        },
        statItem: {
            flex: 1,
            alignItems: "center",
        },
        statLabel: {
            fontSize: 12,
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginBottom: 4,
        },
        statAmount: {
            fontSize: 16,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        summaryProgress: {
            marginTop: 8,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
            marginBottom: 16,
        },
        budgetsList: {
            marginBottom: 32,
        },
        budgetItem: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 12,
            padding: 16,
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
        budgetLeft: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
        },
        categoryIcon: {
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },
        budgetInfo: {
            flex: 1,
        },
        budgetName: {
            fontSize: 16,
            fontWeight: "500",
            color: isDark ? "#F9FAFB" : "#111827",
            marginBottom: 2,
        },
        budgetAmount: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        budgetRight: {
            alignItems: "flex-end",
        },
        budgetActions: {
            flexDirection: "row",
            gap: 8,
            marginBottom: 8,
        },
        actionButton: {
            padding: 4,
        },
        budgetStatus: {
            alignItems: "flex-end",
        },
        statusText: {
            fontSize: 12,
            fontWeight: "500",
            marginBottom: 2,
        },
        percentageSmall: {
            fontSize: 14,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        budgetProgress: {
            marginBottom: 12,
        },
        budgetDetails: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        detailItem: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        detailLabel: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        detailAmount: {
            fontSize: 14,
            fontWeight: "500",
        },
        warningBadge: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FEE2E2",
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            gap: 4,
        },
        warningText: {
            fontSize: 12,
            color: "#EF4444",
            fontWeight: "500",
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
            marginBottom: 24,
        },
        createButton: {
            backgroundColor: "#2563EB",
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
        },
        createButtonText: {
            fontSize: 16,
            fontWeight: "500",
            color: "#FFFFFF",
        },
    });

export default AllBudgetsScreen;