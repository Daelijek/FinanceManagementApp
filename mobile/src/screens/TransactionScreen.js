import React, { useState, useContext, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  Easing,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import Svg, { G, Circle } from "react-native-svg";
import { apiFetch } from "../api";
import { API_URL } from "../config";
import { useFocusEffect } from '@react-navigation/native';

const radius = 50;
const strokeWidth = 25;
const circumference = 2 * Math.PI * radius;

const IconCmp = (iconName) =>
  iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

// Скелетон лоадер
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

// Анимированная карточка транзакции
const AnimatedTransactionCard = ({ transaction, onPress, isDark, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 100;
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
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const {
    id,
    description,
    transaction_date,
    amount,
    category_icon,
    category_color,
    transaction_type,
    payment_method,
    is_recurring,
    category_id,
    note,
  } = transaction;

  const isIncome = transaction_type === "income";
  const isExpense = transaction_type === "expense";

  let displayAmount = "";
  if (isIncome) {
    displayAmount = `+ ${amount.toFixed(2)} $`;
  } else if (isExpense) {
    displayAmount = `- ${Math.abs(amount).toFixed(2)} $`;
  } else {
    displayAmount = amount >= 0 ? `+ ${amount.toFixed(2)} $` : `- ${Math.abs(amount).toFixed(2)} $`;
  }

  const colorAmount = isIncome
    ? "#16A34A"
    : isExpense
      ? (isDark ? "#E5E7EB" : "#000")
      : (isDark ? "#E5E7EB" : "#000");

  const Icon = IconCmp(category_icon);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim }
        ],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.transactionItem}
      >
        <LinearGradient
          colors={isIncome 
            ? ["#DCFCE7", "#BBF7D0"]
            : isDark 
              ? ["#374151", "#4B5563"] 
              : ["#F3F4F6", "#E5E7EB"]
          }
          style={styles.iconContainer}
        >
          <Icon
            name={category_icon || "cart"}
            size={24}
            color={
              category_color ||
              (isIncome ? "#16A34A" : isDark ? "#9CA3AF" : "gray")
            }
          />
        </LinearGradient>
        <View style={styles.textContainer}>
          <Text style={[styles.name, isDark && styles.nameDark]}>
            {description}
          </Text>
          <Text style={[styles.date, isDark && styles.dateDark]}>
            {new Date(transaction_date).toLocaleString()}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: colorAmount }]}>
            {displayAmount}
          </Text>
          {is_recurring && (
            <View style={styles.recurringBadge}>
              <Ionicons name="repeat" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Анимированная вкладка
const AnimatedTab = ({ tab, isActive, onPress, isDark, delay }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark 
      ? ['transparent', '#374151']
      : ['transparent', '#EFF6FF'],
  });

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark 
      ? ['#9CA3AF', '#2563EB']
      : ['#71717A', '#2563EB'],
  });

  return (
    <Animated.View
      style={{
        flex: 1,
        alignItems: 'center',
        transform: [{ scale: scaleAnim }]
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={{ flex: 1, alignItems: 'center', width: '100%' }}
      >
        <Animated.View
          style={[
            styles.itemBase,
            { backgroundColor }
          ]}
        >
          <Animated.Text
            style={[
              styles.tabText,
              { color: textColor }
            ]}
          >
            {tab}
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const TransactionScreen = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [searchText, setSearchText] = useState("");

  // Анимации
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const balanceScaleAnim = useRef(new Animated.Value(0)).current;
  const tabsSlideAnim = useRef(new Animated.Value(50)).current;
  const chartFadeAnim = useRef(new Animated.Value(0)).current;
  const listFadeAnim = useRef(new Animated.Value(0)).current;

  // Обновленные вкладки с переводами
  const tabs = [
    t('transactions.all'),
    t('transactions.income'), 
    t('transactions.expenses')
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const slideAnim = React.useRef(new Animated.Value(0)).current;

  // Поля редактирования
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("cash");
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Запуск входных анимаций
  const startEntranceAnimations = useCallback(() => {
    // Сброс всех анимаций
    headerFadeAnim.setValue(0);
    balanceScaleAnim.setValue(0);
    tabsSlideAnim.setValue(50);
    chartFadeAnim.setValue(0);
    listFadeAnim.setValue(0);

    // Запуск анимаций с задержками
    Animated.stagger(200, [
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(balanceScaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(tabsSlideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(chartFadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(listFadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/v1/transactions/?limit=1000`);
      const json = await response.json();
      setTransactions(json.transactions || []);
      setSummary(json.summary || {
        total_income: 0,
        total_expense: 0,
        net_balance: 0,
      });
    } catch (error) {
      console.error("Ошибка при загрузке транзакций:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTransactions().then(() => {
        startEntranceAnimations();
      });
    }, [startEntranceAnimations])
  );

  useEffect(() => {
    fetchTransactions().then(() => {
      startEntranceAnimations();
    });
  }, [startEntranceAnimations]);

  const openModal = (transaction) => {
    setSelectedTransaction(transaction);
    setEditDescription(transaction.description || "");
    setEditAmount(String(transaction.amount));
    setEditPaymentMethod(transaction.payment_method || "cash");
    setEditIsRecurring(!!transaction.is_recurring);
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedTransaction(null);
      setSaving(false);
      setDeleting(false);
    });
  };

  const onSave = async () => {
    if (!selectedTransaction) return;
    if (!editDescription.trim()) {
      Alert.alert(t('common.error'), t('transactions.description_required'));
      return;
    }
    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum)) {
      Alert.alert(t('common.error'), t('transactions.amount_required'));
      return;
    }
    setSaving(true);
    try {
      const body = {
        description: editDescription,
        amount: amountNum,
        payment_method: editPaymentMethod,
        is_recurring: editIsRecurring,
        transaction_type: selectedTransaction.transaction_type,
        transaction_date: selectedTransaction.transaction_date,
        category_id: selectedTransaction.category_id,
        note: selectedTransaction.note || "",
      };

      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/v1/transactions/${selectedTransaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail ? JSON.stringify(errJson.detail) : t('transactions.save_error'));
      }

      await fetchTransactions();
      closeModal();
    } catch (error) {
      Alert.alert(t('common.error'), error.message);
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!selectedTransaction) return;
    Alert.alert(
      t('transactions.delete_transaction'),
      t('transactions.confirm_delete'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const token = await AsyncStorage.getItem("token");

              const res = await fetch(`${API_URL}/api/v1/transactions/${selectedTransaction.id}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!res.ok) {
                const errJson = await res.json();
                throw new Error(errJson.detail ? JSON.stringify(errJson.detail) : t('transactions.delete_error'));
              }
              await fetchTransactions();
              closeModal();
            } catch (error) {
              Alert.alert(t('common.error'), error.message);
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === t('transactions.all')) {
      return tx.description.toLowerCase().includes(searchText.trim().toLowerCase());
    }

    // Маппинг вкладки на значение в transaction_type
    const tabTypeMap = {
      [t('transactions.income')]: "income",
      [t('transactions.expenses')]: "expense",
    };

    const expectedType = tabTypeMap[activeTab];
    if (!expectedType) return false;

    const matchesTab = tx.transaction_type.toLowerCase() === expectedType;
    const matchesSearch = tx.description.toLowerCase().includes(searchText.trim().toLowerCase());

    return matchesTab && matchesSearch;
  });

  const expenseDataMap = {};
  transactions.forEach((tx) => {
    if (tx.transaction_type === "expense") {
      if (!expenseDataMap[tx.category_id]) {
        expenseDataMap[tx.category_id] = {
          label: tx.category_name,
          value: 0,
          color: tx.category_color || "#000000",
          iconName: tx.category_icon || "cart",
        };
      }
      expenseDataMap[tx.category_id].value += Math.abs(tx.amount);
    }
  });

  const expenseData = Object.values(expenseDataMap);
  const totalExpense = expenseData.reduce((sum, item) => sum + item.value, 0);

  let accumulatedAngle = 0;
  const arcs = expenseData.map((item) => {
    const percentage = totalExpense > 0 ? item.value / totalExpense : 0;
    const arcLength = percentage * circumference;

    const arc = {
      ...item,
      percentage,
      strokeDasharray: `${arcLength} ${circumference}`,
      strokeDashoffset: -accumulatedAngle,
    };

    accumulatedAngle += arcLength;
    return arc;
  });

  const slideUp = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const modalBackdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          {/* Скелетон лоадеры */}
          <View style={styles.containerInner}>
            {/* Header Skeleton */}
            <View style={[styles.header, { alignItems: "center" }]}>
              <SkeletonLoader width={150} height={24} isDark={isDark} />
              <SkeletonLoader width={200} height={40} isDark={isDark} style={{ borderRadius: 20 }} />
            </View>

            {/* Balance Card Skeleton */}
            <SkeletonLoader 
              width="100%" 
              height={190} 
              isDark={isDark} 
              style={{ borderRadius: 16, marginVertical: 20 }} 
            />

            {/* Tabs Skeleton */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonLoader 
                  key={index}
                  width={80} 
                  height={35} 
                  isDark={isDark} 
                  style={{ borderRadius: 20 }} 
                />
              ))}
            </View>

            {/* Chart Skeleton */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
              <SkeletonLoader width={150} height={150} isDark={isDark} style={{ borderRadius: 75 }} />
              <View style={{ marginLeft: 20 }}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <SkeletonLoader width={14} height={14} isDark={isDark} style={{ borderRadius: 7, marginRight: 8 }} />
                    <SkeletonLoader width={120} height={14} isDark={isDark} />
                  </View>
                ))}
              </View>
            </View>

            {/* Transactions Skeleton */}
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <SkeletonLoader width={40} height={40} isDark={isDark} style={{ borderRadius: 20, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <SkeletonLoader width="70%" height={16} isDark={isDark} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width="50%" height={12} isDark={isDark} />
                </View>
                <SkeletonLoader width={60} height={16} isDark={isDark} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.containerInner}>
              
              {/* Анимированный Header */}
              <Animated.View 
                style={[
                  styles.header, 
                  { alignItems: "center" },
                  { opacity: headerFadeAnim }
                ]}
              >
                <Text style={[styles.headerText, isDark && styles.headerTextDark]}>
                  {t('transactions.title')}
                </Text>
                <LinearGradient
                  colors={isDark ? ["#374151", "#4B5563"] : ["#F3F4F6", "#E5E7EB"]}
                  style={[styles.searchContainer, {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }]}
                >
                  <Ionicons
                    name="search"
                    size={20}
                    color={isDark ? "#D1D5DB" : "#4B5563"}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={[styles.searchInput, isDark && styles.searchInputDark]}
                    placeholder={t('transactions.search_placeholder')}
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    value={searchText}
                    onChangeText={setSearchText}
                    autoCorrect={false}
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                  />
                </LinearGradient>
              </Animated.View>

              {/* Анимированная Balance Card */}
              <Animated.View 
                style={[
                  styles.totalBalance,
                  { transform: [{ scale: balanceScaleAnim }] }
                ]}
              >
                <LinearGradient
                  colors={["#2563EB", "#3B82F6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.balanceCardGradient, {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                    elevation: 12,
                  }]}
                >
                  <View style={styles.balanceCard}>
                    <Text style={styles.balanceTitle}>{t('home.total_balance')}</Text>
                    <Text
                      style={[
                        styles.balanceAmount,
                        {
                          color: summary.net_balance >= 0 ? "#22c55e" : "#ef4444",
                        },
                      ]}
                    >
                      {summary.net_balance >= 0 ? "+" : "-"} {Math.abs(summary.net_balance).toFixed(2)} $
                    </Text>

                    <View style={styles.graphContainer}>
                      {[20, 40, 25, 45, 30, 40, 55].map((height, index) => (
                        <Animated.View 
                          key={index} 
                          style={[
                            styles.graphBar, 
                            { 
                              height,
                              transform: [{
                                scaleY: balanceScaleAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 1],
                                })
                              }]
                            }
                          ]} 
                        />
                      ))}
                    </View>

                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Анимированные Tabs */}
              <Animated.View 
                style={[
                  styles.categories,
                  { transform: [{ translateY: tabsSlideAnim }] }
                ]}
              >
                <LinearGradient
                  colors={isDark ? ["#1F2937", "#374151"] : ["#FFFFFF", "#F8FAFC"]}
                  style={[
                    styles.blockOne,
                    {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDark ? 0.3 : 0.1,
                      shadowRadius: 8,
                      elevation: 6,
                      borderRadius: 16,
                    }
                  ]}
                >
                  <View style={[styles.list, { justifyContent: 'space-between' }]}>
                    {tabs.map((tab, index) => (
                      <AnimatedTab
                        key={tab}
                        tab={tab}
                        isActive={tab === activeTab}
                        onPress={() => setActiveTab(tab)}
                        isDark={isDark}
                        delay={index * 100}
                      />
                    ))}
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Анимированный Pie Chart */}
              <Animated.View 
                style={[
                  { opacity: chartFadeAnim }
                ]}
              >
                <LinearGradient
                  colors={isDark ? ["#1F2937", "#374151"] : ["#FFFFFF", "#F8FAFC"]}
                  style={[styles.pieChartContainer, {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 12,
                    elevation: 8,
                    borderRadius: 20,
                    padding: 20,
                    marginVertical: 10,
                  }]}
                >
                  <View style={styles.pieChartHead}>
                    <Text style={[styles.pieChartTitle, isDark && styles.pieChartTitleDark]}>
                      {t('transactions.spending_by_category')}
                    </Text>
                  </View>
                  <View style={styles.pieChartGroup}>
                    <Svg
                      width={radius * 2 + strokeWidth}
                      height={radius * 2 + strokeWidth}
                      style={{ transform: [{ rotate: "-90deg" }] }}
                    >
                      <G origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}>
                        <Circle
                          cx={radius + strokeWidth / 2}
                          cy={radius + strokeWidth / 2}
                          r={radius}
                          stroke={isDark ? "#374151" : "#E5E7EB"}
                          strokeWidth={strokeWidth}
                          fill="transparent"
                        />
                        {arcs.map((arc, index) => (
                          <Circle
                            key={index}
                            cx={radius + strokeWidth / 2}
                            cy={radius + strokeWidth / 2}
                            r={radius}
                            stroke={arc.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={arc.strokeDasharray}
                            strokeDashoffset={arc.strokeDashoffset}
                            fill="transparent"
                          />
                        ))}
                      </G>
                    </Svg>
                    <View style={styles.legend}>
                      {expenseData.map((item, index) => (
                        <Animated.View 
                          key={index} 
                          style={[
                            styles.legendItem,
                            {
                              opacity: chartFadeAnim,
                              transform: [{
                                translateX: chartFadeAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [30, 0],
                                })
                              }]
                            }
                          ]}
                        >
                          <View
                            style={[styles.legendColorBox, { backgroundColor: item.color }]}
                          />
                          <View style={styles.legendTextWrapper}>
                            <Text style={[styles.legendLabel, isDark && styles.legendLabelDark]}>
                              {item.label}
                            </Text>
                            <Text style={[styles.legendValue, isDark && styles.legendValueDark]}>
                              $ {item.value.toFixed(0)} ({(item.value / totalExpense * 100).toFixed(1)}%)
                            </Text>
                          </View>
                        </Animated.View>
                      ))}
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Анимированный Transaction List */}
              <Animated.View 
                style={[
                  { opacity: listFadeAnim }
                ]}
              >
                <LinearGradient
                  colors={isDark ? ["#1F2937", "#374151"] : ["#FFFFFF", "#F8FAFC"]}
                  style={[styles.transactionList, {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 12,
                    elevation: 8,
                    borderRadius: 20,
                    padding: 20,
                    marginTop: 10,
                  }]}
                >
                  <View style={styles.transactionHead}>
                    <Text style={[styles.transactionTitle, isDark && styles.transactionTitleDark]}>
                      {t('transactions.title')}
                    </Text>
                  </View>
                  {filteredTransactions.length === 0 ? (
                    <Animated.View
                      style={{
                        opacity: listFadeAnim,
                        alignItems: "center",
                        paddingVertical: 40,
                      }}
                    >
                      <Ionicons 
                        name="receipt-outline" 
                        size={48} 
                        color={isDark ? "#6B7280" : "#9CA3AF"} 
                      />
                      <Text
                        style={{
                          textAlign: "center",
                          marginTop: 12,
                          color: isDark ? "#D1D5DB" : "#4B5563",
                          fontSize: 16,
                        }}
                      >
                        {t('transactions.no_transactions')}
                      </Text>
                    </Animated.View>
                  ) : (
                    filteredTransactions.map((transaction, index) => (
                      <AnimatedTransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        onPress={() => openModal(transaction)}
                        isDark={isDark}
                        index={index}
                      />
                    ))
                  )}
                </LinearGradient>
              </Animated.View>
            </View>
          </ScrollView>

          {/* Улучшенный Modal */}
          <Modal
            animationType="none"
            transparent
            visible={modalVisible}
            onRequestClose={closeModal}
          >
            <Animated.View
              style={[
                styles.modalOverlay,
                { opacity: modalBackdropOpacity }
              ]}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={closeModal}
                style={{ flex: 1 }}
              >
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
                  style={{ flex: 1, justifyContent: "flex-end" }}
                >
                  <Animated.View
                    style={[
                      styles.modalContent,
                      {
                        backgroundColor: isDark ? "#1F2937" : "#FFF",
                        transform: [{ translateY: slideUp }],
                      },
                    ]}
                  >
                    <View style={styles.modalHandle} />
                    
                    <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                      {t('transactions.edit_transaction')}
                    </Text>

                    <View style={styles.formGroup}>
                      <Text style={[styles.label, isDark && styles.labelDark]}>
                        {t('transactions.description')}
                      </Text>
                      <LinearGradient
                        colors={isDark ? ["#374151", "#4B5563"] : ["#F9FAFB", "#FFFFFF"]}
                        style={styles.inputContainer}
                      >
                        <TextInput
                          style={[styles.input, isDark && styles.inputDark]}
                          placeholder={t('transactions.description')}
                          placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                          value={editDescription}
                          onChangeText={setEditDescription}
                          editable={!saving && !deleting}
                        />
                      </LinearGradient>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={[styles.label, isDark && styles.labelDark]}>
                        {t('transactions.amount')}
                      </Text>
                      <LinearGradient
                        colors={isDark ? ["#374151", "#4B5563"] : ["#F9FAFB", "#FFFFFF"]}
                        style={styles.inputContainer}
                      >
                        <TextInput
                          style={[styles.input, isDark && styles.inputDark]}
                          placeholder={t('transactions.amount')}
                          placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                          value={editAmount}
                          onChangeText={setEditAmount}
                          keyboardType="numeric"
                          returnKeyType="done"
                          blurOnSubmit={true}
                          editable={!saving && !deleting}
                        />
                      </LinearGradient>
                    </View>

                    <View style={[styles.formGroup, styles.horizontalGroup]}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.label, isDark && styles.labelDark]}>
                          {t('transactions.payment_method')}
                        </Text>
                        <View style={styles.typeSelector}>
                          {["cash", "card"].map((method) => {
                            const isActive = editPaymentMethod === method;
                            return (
                              <TouchableOpacity
                                key={method}
                                style={[
                                  styles.typeButton,
                                  { flex: 1, marginRight: method === "cash" ? 8 : 0 },
                                ]}
                                onPress={() => !saving && !deleting && setEditPaymentMethod(method)}
                                activeOpacity={0.7}
                              >
                                <LinearGradient
                                  colors={isActive 
                                    ? ["#2563EB", "#3B82F6"]
                                    : isDark 
                                      ? ["#374151", "#4B5563"]
                                      : ["#F9FAFB", "#FFFFFF"]
                                  }
                                  style={styles.typeButtonGradient}
                                >
                                  <Text
                                    style={[
                                      styles.typeButtonText,
                                      isActive ? styles.typeButtonTextActive : styles.typeButtonTextInactive,
                                    ]}
                                  >
                                    {method === 'cash' ? t('transactions.cash') : t('transactions.card')}
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <Text style={[styles.label, isDark && styles.labelDark]}>
                          {t('transactions.recurring')}
                        </Text>
                        <TouchableOpacity
                          onPress={() => !saving && !deleting && setEditIsRecurring(!editIsRecurring)}
                          style={[
                            styles.recurringToggle,
                            editIsRecurring && styles.recurringToggleActive,
                          ]}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={editIsRecurring 
                              ? ["#2563EB", "#3B82F6"]
                              : isDark 
                                ? ["#374151", "#4B5563"]
                                : ["#F3F4F6", "#E5E7EB"]
                            }
                            style={styles.recurringToggleGradient}
                          >
                            {editIsRecurring && <Ionicons name="checkmark" size={20} color="#FFF" />}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={closeModal}
                        disabled={saving || deleting}
                      >
                        <LinearGradient
                          colors={["#E5E7EB", "#F3F4F6"]}
                          style={styles.buttonGradient}
                        >
                          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.deleteButton]}
                        onPress={onDelete}
                        disabled={saving || deleting}
                      >
                        <LinearGradient
                          colors={["#EF4444", "#DC2626"]}
                          style={styles.buttonGradient}
                        >
                          {deleting ? (
                            <ActivityIndicator color="#FFF" />
                          ) : (
                            <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.saveButton]}
                        onPress={onSave}
                        disabled={saving || deleting}
                      >
                        <LinearGradient
                          colors={["#2563EB", "#3B82F6"]}
                          style={styles.buttonGradient}
                        >
                          {saving ? (
                            <ActivityIndicator color="#FFF" />
                          ) : (
                            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </KeyboardAvoidingView>
              </TouchableOpacity>
            </Animated.View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  containerDark: {
    backgroundColor: "#0F172A",
  },
  scrollContainer: {
    paddingBottom: 32,
  },
  containerInner: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "column",
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  headerTextDark: {
    color: "#F9FAFB",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
    minWidth: 150,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  searchInputDark: {
    color: "#F9FAFB",
  },
  balanceCardGradient: {
    borderRadius: 16,
  },
  balanceCard: {
    height: 190,
    width: "100%",
    padding: 24,
    justifyContent: "space-around",
    position: "relative",
    overflow: "hidden",
  },
  balanceTitle: {
    fontWeight: "500",
    fontSize: 14,
    color: "#FFFFFF",
  },
  balanceAmount: {
    fontWeight: "700",
    fontSize: 30,
    color: "#FFFFFF",
  },
  graphContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 12,
    height: 50,
  },
  graphBar: {
    width: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    marginHorizontal: 4,
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
  blockOne: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingVertical: 16,
  },
  list: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  itemBase: {
    fontSize: 16,
    fontWeight: "400",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pieChartContainer: {
    flexDirection: "column",
  },
  pieChartTitle: {
    fontWeight: "600",
    fontSize: 18,
    color: "#000000",
  },
  pieChartTitleDark: {
    color: "#F9FAFB",
  },
  pieChartGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  legend: {
    marginLeft: 24,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  legendColorBox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendTextWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 180,
  },
  legendLabel: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
    flexShrink: 1,
  },
  legendLabelDark: {
    color: "#D1D5DB",
  },
  legendValue: {
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  legendValueDark: {
    color: "#D1D5DB",
  },
  transactionTitle: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 24,
  },
  transactionTitleDark: {
    color: "#F9FAFB",
  },
  transactionList: {
    marginTop: 10,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
    color: "#000",
  },
  nameDark: {
    color: "#F9FAFB",
  },
  date: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  dateDark: {
    color: "#D1D5DB",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontWeight: "500",
    fontSize: 16,
  },
  recurringBadge: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    padding: 2,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    paddingTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#000",
    textAlign: "center",
  },
  modalTitleDark: {
    color: "#F9FAFB",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 6,
    color: "#000",
  },
  labelDark: {
    color: "#D1D5DB",
  },
  horizontalGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    borderRadius: 10,
  },
  inputDark: {
    color: "#F9FAFB",
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeButton: {
    flex: 1,
    borderRadius: 25,
    marginHorizontal: 4,
    overflow: "hidden",
  },
  typeButtonGradient: {
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  typeButtonText: {
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  typeButtonTextActive: {
    color: "#FFFFFF",
  },
  typeButtonTextInactive: {
    color: "#2563EB",
  },
  recurringToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
  },
  recurringToggleGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 6,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default TransactionScreen;