import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
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
  Animated,
  Easing,
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

// Скелетон лоадер с анимацией
const SkeletonLoader = ({ width, height, style, isDark }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: isDark ? "#374151" : "#E1E5E9",
          borderRadius: 8,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Анимированная карточка категории
const AnimatedCategoryCard = ({ category, isDark, index, screenWidth, styles }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 200;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        delay,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: delay + 200,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      const progress = category.budget > 0 ? category.spent / category.budget : 0;
      Animated.timing(progressAnim, {
        toValue: Math.min(progress, 1),
        duration: 1500,
        delay: delay + 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, 100);
  }, [index, category.spent, category.budget]);

  const progress = category.budget > 0 ? category.spent / category.budget : 0;
  const isOverBudget = category.spent > category.budget;
  const Icon = IconCmp(category.icon);

  return (
    <Animated.View
      style={[
        styles.categoryItem,
        {
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
        }
      ]}
    >
      <View style={styles.categoryContent}>
        <View style={styles.categoryLeft}>
          <Animated.View 
            style={[
              styles.categoryIcon, 
              { 
                backgroundColor: category.iconBg,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Icon
              name={category.icon}
              size={24}
              color={category.color}
            />
          </Animated.View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, isDark && styles.categoryNameDark]}>
              {category.name}
            </Text>
            <Text style={[styles.categoryAmount, isDark && styles.categoryAmountDark]}>
              $ {category.spent} / {category.budget}
            </Text>
          </View>
        </View>

        <View style={styles.categoryProgress}>
          <View 
            style={[
              styles.progressBackground,
              {
                backgroundColor: isDark ? "#374151" : "#F3F4F6",
                width: screenWidth - 80,
              }
            ]}
          />
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, screenWidth - 80],
                }),
                backgroundColor: isOverBudget ? "#EF4444" : category.color,
              }
            ]}
          />
          
          {isOverBudget && (
            <Animated.View 
              style={[
                styles.overBudgetBadge,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <Ionicons name="warning" size={12} color="#FFFFFF" />
              <Text style={styles.overBudgetText}>Over</Text>
            </Animated.View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// Анимированная кнопка действия
const AnimatedActionButton = ({ onPress, icon, text, isDark, delay, styles }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        delay,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        delay: delay + 300,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { translateY: slideAnim }
        ],
      }}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={isDark ? ["#1F2937", "#374151"] : ["#FFFFFF", "#F8FAFC"]}
          style={[styles.actionButton, {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 12,
            elevation: 8,
          }]}
        >
          <Animated.View 
            style={[
              styles.actionButtonIcon,
              { transform: [{ rotate: rotateInterpolate }] }
            ]}
          >
            <Ionicons name={icon} size={20} color="#2563EB" />
          </Animated.View>
          <Text style={[styles.actionButtonText, isDark && styles.actionButtonTextDark]}>
            {text}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Анимированный инсайт
const AnimatedInsight = ({ insight, index, isDark, styles }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const dotScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 300;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        delay,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.spring(dotScaleAnim, {
        toValue: 1,
        delay: delay + 400,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.insightItem,
        {
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }
      ]}
    >
      <Animated.View 
        style={[
          styles.insightDot,
          { transform: [{ scale: dotScaleAnim }] }
        ]} 
      />
      <Text style={[styles.insightText, isDark && styles.insightTextDark]}>
        {insight}
      </Text>
    </Animated.View>
  );
};

const BudgetScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  // Множество анимаций для разных секций
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;
  const budgetCardScaleAnim = useRef(new Animated.Value(0)).current;
  const budgetCardRotateAnim = useRef(new Animated.Value(0)).current;
  const actionsSlideAnim = useRef(new Animated.Value(100)).current;
  const sectionTitleFadeAnim = useRef(new Animated.Value(0)).current;
  const sectionTitleSlideAnim = useRef(new Animated.Value(-30)).current;

  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [budgetData, setBudgetData] = useState({
    totalBudget: 0,
    spent: 0,
    remaining: 0,
    percentage: 0,
  });

  const [categories, setCategories] = useState([]);
  const [insights, setInsights] = useState([]);

  // Мощная анимация входа
  const startEntranceAnimations = useCallback(() => {
    // Сброс всех анимаций
    headerFadeAnim.setValue(0);
    headerSlideAnim.setValue(-50);
    budgetCardScaleAnim.setValue(0);
    budgetCardRotateAnim.setValue(0);
    actionsSlideAnim.setValue(100);
    sectionTitleFadeAnim.setValue(0);
    sectionTitleSlideAnim.setValue(-30);
    
    // Запуск анимаций поэтапно
    Animated.stagger(150, [
      // Header анимация
      Animated.parallel([
        Animated.timing(headerFadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(headerSlideAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      
      // Budget card анимация
      Animated.parallel([
        Animated.spring(budgetCardScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(budgetCardRotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      
      // Actions анимация
      Animated.timing(actionsSlideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      
      // Section titles анимация
      Animated.parallel([
        Animated.timing(sectionTitleFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(sectionTitleSlideAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Остальные функции остаются теми же...
  const getCurrentMonthYear = () => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  };

  const fetchBudgetData = async () => {
    try {
      const { year, month } = getCurrentMonthYear();

      const response = await apiFetch(`/api/v1/budgets/current-month`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setBudgetData({
        totalBudget: data.total_budget || 0,
        spent: data.spent || 0,
        remaining: data.remaining || 0,
        percentage: data.usage_percentage || 0,
      });

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
      generateInsights(data);

    } catch (error) {
      console.error('Error fetching budget data:', error);

      if (!isFirstLoad) {
        Alert.alert(t('common.error'), 'Failed to load budget data');
      }

      setBudgetData({
        totalBudget: 0,
        spent: 0,
        remaining: 0,
        percentage: 0,
      });
      setCategories([]);
      setInsights([]);
    } finally {
      setIsFirstLoad(false);
    }
  };

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

  useFocusEffect(
    React.useCallback(() => {
      fetchBudgetData().then(() => {
        startEntranceAnimations();
      });
    }, [startEntranceAnimations])
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBudgetData();
      setLoading(false);
      startEntranceAnimations();
    };

    loadData();
  }, [startEntranceAnimations]);

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
          {/* Анимированные скелетоны */}
          <View style={styles.header}>
            <SkeletonLoader width={120} height={24} isDark={isDark} />
            <SkeletonLoader width={24} height={24} isDark={isDark} />
          </View>
          
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <SkeletonLoader width="100%" height={180} style={{ borderRadius: 16, marginBottom: 20 }} isDark={isDark} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 }}>
              <SkeletonLoader width={100} height={70} style={{ borderRadius: 12 }} isDark={isDark} />
              <SkeletonLoader width={100} height={70} style={{ borderRadius: 12 }} isDark={isDark} />
            </View>
            
            {Array.from({ length: 3 }).map((_, index) => (
              <View key={index} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <SkeletonLoader width={40} height={40} style={{ borderRadius: 12, marginRight: 12 }} isDark={isDark} />
                  <SkeletonLoader width={100} height={16} isDark={isDark} />
                </View>
                <SkeletonLoader width="100%" height={6} style={{ borderRadius: 3 }} isDark={isDark} />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const budgetCardRotate = budgetCardRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '0deg'],
  });

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
        {/* Анимированный Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerFadeAnim,
              transform: [{ translateY: headerSlideAnim }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }
          ]}
        >
          <Text style={styles.headerTitle}>{t('budget.title')}</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="menu-outline" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
          </TouchableOpacity>
        </Animated.View>

        {/* Анимированная Budget Card */}
        <Animated.View 
          style={[
            styles.budgetCard,
            {
              transform: [
                { scale: budgetCardScaleAnim },
                { rotate: budgetCardRotate }
              ],
            }
          ]}
        >
          <LinearGradient
            colors={["#2563EB", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.budgetGradient, {
              shadowColor: "#667EEA",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 15,
            }]}
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

              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Анимированные Action Buttons */}
        <Animated.View 
          style={[
            styles.actionButtons,
            { transform: [{ translateY: actionsSlideAnim }] }
          ]}
        >
          <AnimatedActionButton
            onPress={onSetBudget}
            icon="wallet"
            text={t('budget.set_budget')}
            isDark={isDark}
            delay={0}
            styles={styles}
          />
          
          <AnimatedActionButton
            onPress={onAnalytics}
            icon="analytics"
            text={t('budget.analytics')}
            isDark={isDark}
            delay={200}
            styles={styles}
          />
        </Animated.View>

        {/* Анимированная секция Categories */}
        <View style={styles.categorySection}>
          <Animated.View 
            style={[
              styles.sectionHeader,
              {
                opacity: sectionTitleFadeAnim,
                transform: [{ translateX: sectionTitleSlideAnim }],
              }
            ]}
          >
            <Text style={styles.sectionTitle}>{t('budget.budget_by_category')}</Text>
            <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>{t('budget.see_all')}</Text>
            </TouchableOpacity>
          </Animated.View>

          {categories.length === 0 ? (
            <Animated.View 
              style={[
                styles.emptyState,
                {
                  opacity: sectionTitleFadeAnim,
                  transform: [{ scale: sectionTitleFadeAnim }],
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 12,
                  elevation: 8,
                }
              ]}
            >
              <Ionicons name="wallet-outline" size={48} color={isDark ? "#6B7280" : "#9CA3AF"} />
              <Text style={styles.emptyStateText}>No budgets set yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first budget to start tracking expenses</Text>
              <TouchableOpacity 
                style={styles.createBudgetButton} 
                onPress={onSetBudget}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#2563EB", "#3B82F6"]}
                  style={styles.createBudgetButtonGradient}
                >
                  <Text style={styles.createBudgetButtonText}>Create Budget</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.categoriesList}>
              {categories.slice(0, 6).map((category, index) => (
                <AnimatedCategoryCard
                  key={category.id}
                  category={category}
                  isDark={isDark}
                  index={index}
                  screenWidth={screenWidth}
                  styles={styles}
                />
              ))}
            </View>
          )}
        </View>

        {/* Анимированные Insights */}
        <View style={styles.insightsSection}>
          <Animated.View 
            style={{
              opacity: sectionTitleFadeAnim,
              transform: [{ translateX: sectionTitleSlideAnim }],
            }}
          >
            <Text style={styles.sectionTitle}>{t('budget.insights')}</Text>
          </Animated.View>

          <View style={styles.insightsList}>
            {insights.map((insight, index) => (
              <AnimatedInsight
                key={index}
                insight={insight}
                index={index}
                isDark={isDark}
                styles={styles}
              />
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
      paddingTop: 20,
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
      paddingBottom: 16,
      backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    budgetCard: {
      marginHorizontal: 20,
      marginVertical: 16,
      borderRadius: 20,
      overflow: "hidden",
    },
    budgetGradient: {
      padding: 28,
      position: "relative",
      overflow: "hidden",
    },
    budgetContent: {
      flex: 1,
    },
    budgetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    budgetLabel: {
      fontSize: 16,
      color: "#FFFFFF",
      opacity: 0.9,
    },
    percentageCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    percentageText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    budgetAmount: {
      fontSize: 36,
      fontWeight: "700",
      color: "#FFFFFF",
      marginBottom: 24,
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
      marginBottom: 6,
    },
    budgetDetailAmount: {
      fontSize: 20,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    decorativeCircle1: {
      position: "absolute",
      top: -50,
      right: -50,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    decorativeCircle2: {
      position: "absolute",
      bottom: -30,
      left: -30,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
    },
    actionButtons: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 40,
      marginVertical: 16,
    },
    actionButton: {
      alignItems: "center",
      paddingVertical: 20,
      paddingHorizontal: 24,
      borderRadius: 16,
      minWidth: 120,
    },
    actionButtonIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#EFF6FF",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    actionButtonText: {
      fontSize: 14,
      color: "#4B5563",
      fontWeight: "600",
      textAlign: "center",
    },
    actionButtonTextDark: {
      color: "#D1D5DB",
    },
    categorySection: {
      paddingHorizontal: 20,
      marginTop: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    seeAllText: {
      fontSize: 14,
      color: "#2563EB",
      fontWeight: "500",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 48,
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 20,
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
      borderRadius: 12,
      overflow: "hidden",
    },
    createBudgetButtonGradient: {
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    createBudgetButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 16,
    },
    categoriesList: {
      gap: 16,
    },
    categoryItem: {
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 6,
    },
    categoryContent: {
      padding: 20,
    },
    categoryLeft: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: "600",
      color: "#111827",
      marginBottom: 4,
    },
    categoryNameDark: {
      color: "#F9FAFB",
    },
    categoryAmount: {
      fontSize: 14,
      color: "#6B7280",
    },
    categoryAmountDark: {
      color: "#9CA3AF",
    },
    categoryProgress: {
      position: "relative",
    },
    progressBackground: {
      height: 8,
      borderRadius: 4,
    },
    progressFill: {
      position: "absolute",
      top: 0,
      left: 0,
      height: 8,
      borderRadius: 4,
    },
    overBudgetBadge: {
      position: "absolute",
      top: -12,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#EF4444",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    overBudgetText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "600",
    },
    insightsSection: {
      paddingHorizontal: 20,
      marginTop: 32,
    },
    insightsList: {
      marginTop: 20,
      gap: 12,
    },
    insightItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 20,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    insightDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#2563EB",
      marginTop: 6,
      marginRight: 16,
    },
    insightText: {
      fontSize: 14,
      color: "#4B5563",
      flex: 1,
      lineHeight: 20,
    },
    insightTextDark: {
      color: "#D1D5DB",
    },
  });

export default BudgetScreen;