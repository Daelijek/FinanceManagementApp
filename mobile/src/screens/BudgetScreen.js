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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";

const screenWidth = Dimensions.get("window").width;

const IconCmp = (iconName) =>
  iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

const BudgetScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  const [selectedMonth, setSelectedMonth] = useState("September 2023");
  const [loading, setLoading] = useState(false);
  const [budgetData, setBudgetData] = useState({
    totalBudget: 4500,
    spent: 2850,
    remaining: 1650,
    percentage: 63,
  });

  const [categories, setCategories] = useState([
    {
      id: 1,
      name: "Housing",
      icon: "home",
      color: "#EF4444",
      spent: 1200,
      budget: 1500,
      iconBg: "#FEE2E2"
    },
    {
      id: 2,
      name: "Food & Dining",
      icon: "restaurant",
      color: "#10B981",
      spent: 650,
      budget: 800,
      iconBg: "#D1FAE5"
    },
    {
      id: 3,
      name: "Transportation",
      icon: "car",
      color: "#F59E0B",
      spent: 400,
      budget: 500,
      iconBg: "#FEF3C7"
    },
    {
      id: 4,
      name: "Shopping",
      icon: "bag",
      color: "#8B5CF6",
      spent: 300,
      budget: 400,
      iconBg: "#F3E8FF"
    },
    {
      id: 5,
      name: "Entertainment",
      icon: "game-controller",
      color: "#06B6D4",
      spent: 200,
      budget: 300,
      iconBg: "#CFFAFE"
    },
    {
      id: 6,
      name: "Others",
      icon: "ellipsis-horizontal",
      color: "#6B7280",
      spent: 100,
      budget: 1000,
      iconBg: "#F3F4F6"
    }
  ]);

  const [insights] = useState([
    "You're on track with your budget",
    "Housing expenses are 15% higher than last month",
    "Save $200 more in Food category"
  ]);

  const months = [
    "January 2023", "February 2023", "March 2023", "April 2023",
    "May 2023", "June 2023", "July 2023", "August 2023",
    "September 2023", "October 2023", "November 2023", "December 2023"
  ];

  const onSetBudget = () => {
    navigation.navigate("Set Budget");
  };

  const onAnalytics = () => {
    navigation.navigate("Budget Analytics");
  };

  const onSeeAll = () => {
    navigation.navigate("All Budgets");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('budget.title')}</Text>
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.monthButton}>
            <Text style={styles.monthText}>{selectedMonth}</Text>
            <Ionicons name="chevron-down" size={16} color={isDark ? "#D1D5DB" : "#6B7280"} />
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

          <View style={styles.categoriesList}>
            {categories.map((category) => {
              const progress = category.spent / category.budget;
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
    monthSelector: {
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    monthButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    monthText: {
      fontSize: 16,
      color: isDark ? "#D1D5DB" : "#6B7280",
      marginRight: 4,
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
      paddingHorizontal: 40, // Увеличил отступы чтобы кнопки лучше распределились
      marginVertical: 8,
    },
    actionButton: {
      alignItems: "center",
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      paddingVertical: 16,
      paddingHorizontal: 20, // Увеличил padding для большего размера кнопок
      borderRadius: 12,
      minWidth: 100, // Увеличил минимальную ширину
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