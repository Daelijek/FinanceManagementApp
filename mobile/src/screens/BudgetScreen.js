// src/screens/BudgetScreen.js

import React, { useContext, useState, useEffect } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get("window").width;

const IconCmp = (iconName) =>
  iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

const BudgetScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [budgetData, setBudgetData] = useState({
    totalBudget: 0,
    spent: 0,
    remaining: 0,
    percentage: 0,
  });

  const [categories, setCategories] = useState([]);
  const [insights, setInsights] = useState([]);

  // Получение текущего месяца и года
  const getCurrentMonthYear = () => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1, // JavaScript месяцы начинаются с 0
    };
  };

  const fetchBudgetData = async () => {
    try {
      const { year, month } = getCurrentMonthYear();
      
      // Получаем данные о бюджете за текущий месяц
      const response = await apiFetch(`/api/v1/budgets/current-month`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Обновляем общие данные о бюджете
      setBudgetData({
        totalBudget: data.total_budget || 0,
        spent: data.spent || 0,
        remaining: data.remaining || 0,
        percentage: data.usage_percentage || 0,
      });

      // Обновляем категории бюджета
      const formattedCategories = (data.budgets_by_category || []).map(budget => ({
        id: budget.id,
        name: budget.category_name || 'Unknown',
        icon: budget.category_icon || 'help-outline',
        color: budget.category_color || '#6B7280',
        spent: budget.spent_amount || 0,
        budget: budget.amount || 0,
        percentage: budget.usage_percentage || 0,
        iconBg: getIconBackgroundColor(budget.category_color),
        remaining: budget.remaining_amount || 0,
      }));

      setCategories(formattedCategories);

      // Генерируем инсайты на основе данных
      generateInsights(data);

    } catch (error) {
      console.error('Error fetching budget data:', error);
      // В случае ошибки устанавливаем пустые данные
      setBudgetData({
        totalBudget: 0,
        spent: 0,
        remaining: 0,
        percentage: 0,
      });
      setCategories([]);
      setInsights([]);
    }
  };

  // Функция для получения цвета фона иконки на основе основного цвета
  const getIconBackgroundColor = (color) => {
    const colorMap = {
      '#EF4444': '#FEE2E2',
      '#F59E0B': '#FEF3C7',
      '#10B981': '#D1FAE5',
      '#3B82F6': '#DBEAFE',
      '#8B5CF6': '#F3E8FF',
      '#EC4899': '#FCE7F3',
      '#06B6D4': '#CFFAFE',
      '#6B7280': '#F3F4F6',
    };
    return colorMap[color] || '#F3F4F6';
  };

  // Генерация инсайтов на основе данных бюджета
  const generateInsights = (data) => {
    const newInsights = [];
    
    if (data.usage_percentage <= 80) {
      newInsights.push("You're on track with your budget");
    }
    
    if (data.usage_percentage > 90) {
      newInsights.push("Warning: You're close to your budget limit");
    }

    if (data.summary?.over_budget_count > 0) {
      newInsights.push(`${data.summary.over_budget_count} categories are over budget`);
    }

    // Если нет специальных инсайтов, добавляем общие
    if (newInsights.length === 0) {
      newInsights.push("Keep tracking your expenses to stay on budget");
    }

    setInsights(newInsights);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBudgetData();
    setRefreshing(false);
  };

  // Загружаем данные при фокусе на экране
  useFocusEffect(
    React.useCallback(() => {
      fetchBudgetData();
    }, [])
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBudgetData();
      setLoading(false);
    };
    
    loadData();
  }, []);

  const onSetBudget = () => {
    navigation.navigate("Set Budget");
  };

  const onAnalytics = () => {
    navigation.navigate("Budget Analytics");
  };

  const onSeeAll = () => {
    navigation.navigate("All Budgets");
  };

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
        contentContainerStyle={styles.scrollContainer}
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
          <Text style={styles.headerTitle}>{t('budget.title')}</Text>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
          </TouchableOpacity>
        </View>

        {/* Budget Card */}
        <View style={styles.budgetCard}>
          <LinearGradient
            colors={["#2563EB", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.budgetGradient}
          >
            <View style={styles.budgetContent}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetLabel}>{t('budget.total_budget')}</Text>
                <View style={styles.percentageCircle}>
                  <Text style={styles.percentageText}>{budgetData.percentage}%</Text>
                </View>
              </View>

              <Text style={styles.budgetAmount}>${budgetData.totalBudget.toLocaleString()}</Text>

              <View style={styles.budgetDetails}>
                <View style={styles.budgetDetailItem}>
                  <Text style={styles.budgetDetailLabel}>{t('budget.spent')}</Text>
                  <Text style={styles.budgetDetailAmount}>${budgetData.spent.toLocaleString()}</Text>
                </View>
                <View style={styles.budgetDetailItem}>
                  <Text style={styles.budgetDetailLabel}>{t('budget.remaining')}</Text>
                  <Text style={styles.budgetDetailAmount}>${budgetData.remaining.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onSetBudget}>
            <Ionicons name="wallet" size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>{t('budget.set_budget')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onAnalytics}>
            <Ionicons name="analytics" size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>{t('budget.analytics')}</Text>
          </TouchableOpacity>
        </View>

        {/* Budget by Category */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('budget.budget_by_category')}</Text>
            <TouchableOpacity onPress={onSeeAll}>
              <Text style={styles.seeAllText}>{t('budget.see_all')}</Text>
            </TouchableOpacity>
          </View>

          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={isDark ? "#6B7280" : "#9CA3AF"} />
              <Text style={styles.emptyStateText}>No budgets set yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first budget to start tracking expenses</Text>
              <TouchableOpacity style={styles.createBudgetButton} onPress={onSetBudget}>
                <Text style={styles.createBudgetButtonText}>Create Budget</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.categoriesList}>
              {categories.slice(0, 6).map((category) => {
                const progress = category.budget > 0 ? category.spent / category.budget : 0;
                const isOverBudget = category.spent > category.budget;
                const Icon = IconCmp(category.icon);

                return (
                  <View key={category.id} style={styles.categoryItem}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryIcon, { backgroundColor: category.iconBg }]}>
                        <Icon
                          name={category.icon}
                          size={24}
                          color={category.color}
                        />
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>

                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>
                        $ {category.spent} / {category.budget}
                      </Text>
                    </View>

                    <View style={styles.categoryProgress}>
                      <Progress.Bar
                        progress={Math.min(progress, 1)}
                        width={screenWidth - 80}
                        height={6}
                        color={isOverBudget ? "#EF4444" : category.color}
                        unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                        borderWidth={0}
                        borderRadius={3}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Budget Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>{t('budget.insights')}</Text>

          <View style={styles.insightsList}>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <View style={styles.insightDot} />
                <Text style={styles.insightText}>{insight}</Text>
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
    scrollContainer: {
      paddingBottom: 32,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    budgetCard: {
      marginHorizontal: 20,
      marginVertical: 16,
      borderRadius: 16,
      overflow: "hidden",
    },
    budgetGradient: {
      padding: 24,
    },
    budgetContent: {
      flex: 1,
    },
    budgetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    budgetLabel: {
      fontSize: 14,
      color: "#FFFFFF",
      opacity: 0.9,
    },
    percentageCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    percentageText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    budgetAmount: {
      fontSize: 32,
      fontWeight: "700",
      color: "#FFFFFF",
      marginBottom: 20,
    },
    budgetDetails: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    budgetDetailItem: {
      flex: 1,
    },
    budgetDetailLabel: {
      fontSize: 14,
      color: "#FFFFFF",
      opacity: 0.8,
      marginBottom: 4,
    },
    budgetDetailAmount: {
      fontSize: 18,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    actionButtons: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 40,
      marginVertical: 8,
    },
    actionButton: {
      alignItems: "center",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      minWidth: 100,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    actionButtonText: {
      fontSize: 12,
      color: isDark ? "#D1D5DB" : "#4B5563",
      marginTop: 4,
      textAlign: "center",
    },
    categorySection: {
      paddingHorizontal: 20,
      marginTop: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    seeAllText: {
      fontSize: 14,
      color: "#2563EB",
      fontWeight: "500",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      textAlign: "center",
      marginBottom: 24,
    },
    createBudgetButton: {
      backgroundColor: "#2563EB",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    createBudgetButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 16,
    },
    categoriesList: {
      gap: 20,
    },
    categoryItem: {
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
      marginBottom: 12,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: "500",
      color: isDark ? "#F9FAFB" : "#111827",
      flex: 1,
    },
    categoryRight: {
      position: "absolute",
      top: 16,
      right: 16,
    },
    categoryAmount: {
      fontSize: 14,
      color: isDark ? "#9CA3AF" : "#6B7280",
      textAlign: "right",
    },
    categoryProgress: {
      marginTop: 4,
    },
    insightsSection: {
      paddingHorizontal: 20,
      marginTop: 32,
    },
    insightsList: {
      marginTop: 16,
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

export default BudgetScreen;