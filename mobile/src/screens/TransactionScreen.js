import React, { useState, useContext, useEffect } from "react";
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

const TransactionScreen = () => {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [searchText, setSearchText] = useState("");

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

  const getCurrentMonthPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    return { start: `${year}-${month}-01`, end: `${year}-${month}-31` };
  };

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
      fetchTransactions();
    }, [])
  );

  useEffect(() => {
    fetchTransactions();
  }, []);

  const openModal = (transaction) => {
    setSelectedTransaction(transaction);
    setEditDescription(transaction.description || "");
    setEditAmount(String(transaction.amount));
    setEditPaymentMethod(transaction.payment_method || "cash");
    setEditIsRecurring(!!transaction.is_recurring);
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.ease),
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
      strokeDashoffset: -accumulatedAngle, // Отрицательное смещение
    };

    accumulatedAngle += arcLength;
    return arc;
  });

  const slideUp = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
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
              <View style={[styles.header, { alignItems: "center" }]}>
                <Text style={[styles.headerText, isDark && styles.headerTextDark]}>
                  {t('transactions.title')}
                </Text>
                <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
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
                </View>
              </View>

              <View style={styles.totalBalance}>
                <LinearGradient
                  colors={["#2563EB", "#3B82F6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.balanceCardGradient}
                >
                  <View style={styles.balanceCard}>
                    <Text style={styles.balanceTitle}>{t('home.total_balance')}</Text>
                    <Text
                      style={[
                        styles.balanceAmount,
                        {
                          color: summary.net_balance >= 0 ? "#22c55e" /* зеленый яркий */ : "#ef4444" /* красный яркий */,
                        },
                      ]}
                    >
                      {summary.net_balance >= 0 ? "+" : "-"} {Math.abs(summary.net_balance).toFixed(2)} $
                    </Text>

                    <View style={styles.graphContainer}>
                      {[20, 40, 25, 45, 30, 40, 55].map((height, index) => (
                        <View key={index} style={[styles.graphBar, { height }]} />
                      ))}
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.categories}>
                <View
                  style={[
                    styles.blockOne,
                    isDark ? styles.blockOneDark : styles.blockOneLight,
                  ]}
                >
                  <View style={[styles.list, { justifyContent: 'space-between' }]}>
                    {tabs.map((tab) => {
                      const isActive = tab === activeTab;
                      return (
                        <TouchableOpacity
                          key={tab}
                          onPress={() => setActiveTab(tab)}
                          activeOpacity={0.7}
                          style={{ flex: 1, alignItems: 'center' }} // Равномерное распределение
                        >
                          <Text style={[
                            styles.itemBase,
                            isActive
                              ? isDark
                                ? styles.itemActiveDark
                                : styles.itemActiveLight
                              : isDark
                                ? styles.itemInactiveDark
                                : styles.itemInactiveLight,
                          ]}>
                            {tab}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.pieChartContainer}>
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
                      <View key={index} style={styles.legendItem}>
                        <View
                          style={[styles.legendColorBox, { backgroundColor: item.color }]}
                        />
                        <View style={styles.legendTextWrapper}>
                          <Text style={[styles.legendLabel, isDark && styles.legendLabelDark]}>
                            {item.label}
                          </Text>
                          <Text style={[styles.legendValue, isDark && styles.legendValueDark]}>
                            $ {item.value} ({(item.value / totalExpense * 100).toFixed(1)}%)
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.transactionList}>
                <View style={styles.transactionHead}>
                  <Text style={[styles.transactionTitle, isDark && styles.transactionTitleDark]}>
                    {t('transactions.title')}
                  </Text>
                </View>
                {filteredTransactions.length === 0 ? (
                  <Text
                    style={{
                      textAlign: "center",
                      marginTop: 20,
                      color: isDark ? "#D1D5DB" : "#4B5563",
                    }}
                  >
                    {t('transactions.no_transactions')}
                  </Text>
                ) : (
                  filteredTransactions.map(
                    ({
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
                    }) => {
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
                        <TouchableOpacity
                          key={id}
                          onPress={() => openModal({
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
                          })}
                          activeOpacity={0.7}
                          style={styles.transactionItem}
                        >
                          <View
                            style={[
                              styles.iconContainer,
                              isIncome && { backgroundColor: "#DCFCE7" },
                              isDark && !isIncome && { backgroundColor: "#1F2937" },
                            ]}
                          >
                            <Icon
                              name={category_icon || "cart"}
                              size={24}
                              color={
                                category_color ||
                                (isIncome ? "#16A34A" : isDark ? "#9CA3AF" : "gray")
                              }
                            />
                          </View>
                          <View style={styles.textContainer}>
                            <Text style={[styles.name, isDark && styles.nameDark]}>
                              {description}
                            </Text>
                            <Text style={[styles.date, isDark && styles.dateDark]}>
                              {new Date(transaction_date).toLocaleString()}
                            </Text>
                          </View>
                          <Text style={[styles.amount, { color: colorAmount }]}>
                            {displayAmount}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )
                )}
              </View>
            </View>
          </ScrollView>

          <Modal
            animationType="none"
            transparent
            visible={modalVisible}
            onRequestClose={closeModal}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={closeModal}
              style={styles.modalOverlay}
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
                  <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                    {t('transactions.edit_transaction')}
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, isDark && styles.labelDark]}>
                      {t('transactions.description')}
                    </Text>
                    <TextInput
                      style={[styles.input, isDark && styles.inputDark]}
                      placeholder={t('transactions.description')}
                      placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                      value={editDescription}
                      onChangeText={setEditDescription}
                      editable={!saving && !deleting}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, isDark && styles.labelDark]}>
                      {t('transactions.amount')}
                    </Text>
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
                                isActive && styles.typeButtonActive,
                                { flex: 1, marginRight: method === "cash" ? 8 : 0 },
                              ]}
                              onPress={() => !saving && !deleting && setEditPaymentMethod(method)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.typeButtonText,
                                  isActive ? styles.typeButtonTextActive : styles.typeButtonTextInactive,
                                ]}
                              >
                                {method === 'cash' ? t('transactions.cash') : t('transactions.card')}
                              </Text>
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
                        {editIsRecurring && <Ionicons name="checkmark" size={20} color="#FFF" />}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={closeModal}
                      disabled={saving || deleting}
                    >
                      <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.deleteButton]}
                      onPress={onDelete}
                      disabled={saving || deleting}
                    >
                      {deleting ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={onSave}
                      disabled={saving || deleting}
                    >
                      {saving ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </KeyboardAvoidingView>
            </TouchableOpacity>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  containerDark: {
    backgroundColor: "#111827",
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
  headerIcons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 25,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
    minWidth: 150,
    flex: 1,
  },
  searchContainerDark: {
    backgroundColor: "#374151",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  searchInputDark: {
    backgroundColor: "#374151",
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
  balanceGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceReportText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
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
  blockOne: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingVertical: 16,
  },
  blockOneLight: {},
  blockOneDark: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
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
  itemActiveLight: {
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  itemInactiveLight: {
    color: "#71717A",
    backgroundColor: "transparent",
  },
  itemActiveDark: {
    color: "#2563EB",
    backgroundColor: "#374151",
  },
  itemInactiveDark: {
    color: "#9CA3AF",
    backgroundColor: "transparent",
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
    width: 200,
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
    backgroundColor: "#f0f0f0",
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
  amount: {
    fontWeight: "500",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#000",
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
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#FAFAFA",
  },
  inputDark: {
    borderColor: "#374151",
    backgroundColor: "#1F2937",
    color: "#F9FAFB",
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#2563EB",
    marginHorizontal: 4,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#2563EB",
    borderWidth: 0,
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
    borderWidth: 2,
    borderColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  recurringToggleActive: {
    backgroundColor: "#2563EB",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#2563EB",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default TransactionScreen;