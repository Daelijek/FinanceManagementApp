// src/screens/AllBudgetsScreen.js

import React, { useContext, useState, useEffect, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";
import { useFocusEffect } from '@react-navigation/native';

const IconCmp = (iconName) =>
    iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

// Утилита для обработки ошибок API
const handleApiError = (error, context, t) => {
    console.error(`Error in ${context}:`, error);
    
    let message = 'An unexpected error occurred';
    
    if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        message = 'Network error. Please check your connection.';
    } else if (error.message.includes('401')) {
        message = 'Authentication expired. Please log in again.';
    } else if (error.message.includes('403')) {
        message = 'You do not have permission to perform this action.';
    } else if (error.message.includes('404')) {
        message = 'Budget not found.';
    } else if (error.message.includes('500')) {
        message = 'Server error. Please try again later.';
    } else if (error.message) {
        message = error.message;
    }
    
    Alert.alert(t('common.error'), message);
};

const AllBudgetsScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingBudgets, setDeletingBudgets] = useState(new Set());

    // Состояния для summary
    const [totalBudgetLimit, setTotalBudgetLimit] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [totalRemaining, setTotalRemaining] = useState(0);
    const [overallPercentage, setOverallPercentage] = useState(0);

    const fetchBudgets = useCallback(async () => {
        try {
            const response = await apiFetch("/api/v1/budgets/current-month");
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Преобразуем данные в нужный формат
            const formattedBudgets = data.budgets_by_category.map(budget => ({
                id: budget.category_id,
                apiId: budget.id, // Реальный ID бюджета для операций
                categoryName: budget.category_name,
                categoryIcon: budget.category_icon,
                categoryColor: budget.category_color,
                iconBg: budget.category_color ? `${budget.category_color}33` : "#ccc33",
                budgetLimit: budget.amount,
                spent: budget.spent_amount,
                remaining: budget.remaining_amount,
                percentage: Math.round(budget.usage_percentage),
                status: getStatusFromPercentage(budget.usage_percentage),
                period: budget.period,
                startDate: budget.start_date,
                endDate: budget.end_date,
                isActive: budget.is_active,
                createdAt: budget.created_at,
                updatedAt: budget.updated_at,
            }));

            setBudgets(formattedBudgets);

            // Обновляем summary
            setTotalBudgetLimit(data.total_budget || 0);
            setTotalSpent(data.spent || 0);
            setTotalRemaining(data.remaining || 0);
            setOverallPercentage(Math.round(data.usage_percentage || 0));

        } catch (error) {
            handleApiError(error, 'fetch budgets', t);
            // В случае ошибки устанавливаем пустые данные
            setBudgets([]);
            setTotalBudgetLimit(0);
            setTotalSpent(0);
            setTotalRemaining(0);
            setOverallPercentage(0);
        }
    }, [t]);

    const getStatusFromPercentage = (percentage) => {
        if (percentage >= 100) return "over_budget";
        if (percentage >= 90) return "warning";
        return "on_track";
    };

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

    const handleDeleteBudget = (budget) => {
        Alert.alert(
            t('all_budgets.delete_budget'),
            t('all_budgets.delete_confirmation'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: () => deleteBudget(budget)
                }
            ]
        );
    };

    const deleteBudget = async (budget) => {
        // Добавляем бюджет в список удаляемых для показа индикатора загрузки
        setDeletingBudgets(prev => new Set([...prev, budget.apiId]));

        try {
            const response = await apiFetch(`/api/v1/budgets/${budget.apiId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to delete budget');
            }

            // Удаляем бюджет из локального состояния
            setBudgets(prev => prev.filter(b => b.apiId !== budget.apiId));
            
            // Обновляем summary
            const newTotalLimit = totalBudgetLimit - budget.budgetLimit;
            const newTotalSpent = totalSpent - budget.spent;
            const newTotalRemaining = newTotalLimit - newTotalSpent;
            const newPercentage = newTotalLimit > 0 ? Math.round((newTotalSpent / newTotalLimit) * 100) : 0;
            
            setTotalBudgetLimit(newTotalLimit);
            setTotalSpent(newTotalSpent);
            setTotalRemaining(newTotalRemaining);
            setOverallPercentage(newPercentage);

            Alert.alert(t('common.success'), 'Budget deleted successfully');
            
        } catch (error) {
            handleApiError(error, 'delete budget', t);
        } finally {
            // Убираем бюджет из списка удаляемых
            setDeletingBudgets(prev => {
                const newSet = new Set(prev);
                newSet.delete(budget.apiId);
                return newSet;
            });
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchBudgets();
        setRefreshing(false);
    }, [fetchBudgets]);

    // Загружаем данные при фокусе на экране
    useFocusEffect(
        useCallback(() => {
            fetchBudgets();
        }, [fetchBudgets])
    );

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchBudgets();
            setLoading(false);
        };
        
        loadData();
    }, [fetchBudgets]);

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
                                {totalRemaining >= 0 ? '+' : '-'}${Math.abs(totalRemaining).toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryProgress}>
                        <Progress.Bar
                            progress={Math.min(overallPercentage / 100, 1)}
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

                    {budgets.length === 0 ? (
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
                    ) : (
                        budgets.map((budget) => {
                            const Icon = IconCmp(budget.categoryIcon);
                            const statusColor = getStatusColor(budget.status);
                            const isDeleting = deletingBudgets.has(budget.apiId);

                            return (
                                <View key={budget.apiId} style={[styles.budgetItem, isDeleting && styles.budgetItemDeleting]}>
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
                                                    onPress={() => handleDeleteBudget(budget)}
                                                    style={styles.actionButton}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? (
                                                        <ActivityIndicator size="small" color="#EF4444" />
                                                    ) : (
                                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                                    )}
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
                                                {budget.remaining >= 0 ? '+' : '-'}${Math.abs(budget.remaining)}
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

                                    {/* Дополнительная информация */}
                                    <View style={styles.budgetMeta}>
                                        <Text style={styles.budgetMetaText}>
                                            Period: {budget.period} • {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
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
        budgetItemDeleting: {
            opacity: 0.6,
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
            marginBottom: 8,
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
        budgetMeta: {
            marginTop: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: isDark ? "#374151" : "#F3F4F6",
        },
        budgetMetaText: {
            fontSize: 12,
            color: isDark ? "#6B7280" : "#9CA3AF",
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