// src/screens/TransactionAdd.js

import React, { useState, useEffect, useRef, useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTranslation } from 'react-i18next';
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";

const TransactionAdd = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [selectedType, setSelectedType] = useState("expense");
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [note, setNote] = useState("");
  const noteRef = useRef(null);

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await apiFetch("/api/v1/categories/");
        if (!res.ok) throw new Error(`Ошибка ${res.status}`);
        const data = await res.json();
        setCategories({
          expense: data.expense_categories || [],
          income: data.income_categories || [],
        });
      } catch (e) {
        console.error(e);
        Alert.alert(t('common.error'), t('transactions.category_load_error'));
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [t]);

  const formatDate = (d) => {
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    const str = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return isToday ? `${t('common.today')}, ${str}` : str;
  };

  const onChangeDate = (event, selected) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      selected && setDate(selected);
    } else {
      setTempDate(selected || date);
    }
  };

  const confirmDate = () => {
    setShowPicker(false);
    setDate(tempDate);
  };

  const cancelDate = () => {
    setShowPicker(false);
    setTempDate(date);
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return Alert.alert(t('common.error'), t('transactions.amount_required'));
    }
    if (!selectedCategoryId) {
      return Alert.alert(t('common.error'), t('transactions.category_required'));
    }
    if (!selectedMethod) {
      return Alert.alert(t('common.error'), t('transactions.method_required'));
    }

    const body = {
      amount: amt,
      transaction_type: selectedType,
      description: note.trim(),
      transaction_date: date.toISOString(),
      category_id: selectedCategoryId,
      payment_method: selectedMethod,
      is_recurring: isRecurring,
      note: note.trim(),
    };

    try {
      const res = await apiFetch("/api/v1/transactions/", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        Alert.alert(t('common.success'), t('transactions.transaction_saved'));
        navigation.goBack();
      } else {
        const err = await res.json();
        const msg = Array.isArray(err.detail)
          ? err.detail.map((e) => e.msg).join("\n")
          : err.detail || t('transactions.save_error');
        Alert.alert(t('common.error'), msg);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('common.error'), t('transactions.save_error'));
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setModalVisible(false);
  };

  const IconCmp = (iconName) =>
    iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.switch}>
            <TouchableOpacity
              style={[
                styles.switchButton,
                selectedType === "expense" && styles.selectedButton,
              ]}
              onPress={() => setSelectedType("expense")}
            >
              <Text
                style={[
                  styles.switchText,
                  { color: selectedType === "expense" ? "#fff" : styles.switchText.color },
                ]}
              >
                {t('transactions.expense')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.switchButton,
                selectedType === "income" && styles.selectedButton,
              ]}
              onPress={() => setSelectedType("income")}
            >
              <Text
                style={[
                  styles.switchText,
                  { color: selectedType === "income" ? "#fff" : styles.switchText.color },
                ]}
              >
                {t('transactions.income_label')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balance}>
            <Text style={styles.balanceValue}>$</Text>
            <TextInput
              style={styles.balanceAmountInput}
              placeholder="0.00"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              keyboardType="numeric"
              value={amount}
              returnKeyType="done"
              onChangeText={(t) => {
                const cleaned = t.replace(/[^0-9.]/g, "");
                setAmount(cleaned.split(".").length <= 2 ? cleaned : amount);
              }}
              maxLength={12}
            />
          </View>

          <View style={styles.category}>
            <Text style={styles.categoryTitle}>{t('transactions.category')}</Text>
            {loadingCategories ? (
              <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryGroup}>
                  {categories[selectedType].map((cat) => {
                    const Icon = IconCmp(cat.icon);
                    const isSel = cat.id === selectedCategoryId;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setSelectedCategoryId(cat.id)}
                        style={styles.categoryCard}
                      >
                        <View
                          style={[
                            styles.categoryIcon,
                            isSel && styles.selectedCategory,
                            { backgroundColor: isSel ? cat.color : styles.categoryIcon.backgroundColor },
                          ]}
                        >
                          <Icon
                            name={cat.icon}
                            size={32}
                            color={isSel ? "#fff" : cat.color}
                          />
                        </View>
                        <View style={styles.categoryLabel}>
                          <Text style={[styles.categoryText, isSel && { color: cat.color }]}>
                            {cat.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          <View style={styles.transactionDetails}>
            <View style={styles.transactionDate}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowPicker(true)}
              >
                <Ionicons name="calendar-outline" size={24} color="#4B5563" />
                <View style={styles.dateInputPlaceholder}>
                  <Text style={styles.dateInputLabel}>{t('transactions.date')}</Text>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                </View>
              </TouchableOpacity>
              {showPicker &&
                (Platform.OS === "ios" ? (
                  <View style={styles.iosPickerContainer}>
                    <View style={styles.iosPickerHeader}>
                      <TouchableOpacity onPress={cancelDate}>
                        <Text style={styles.cancelButton}>{t('common.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={confirmDate}>
                        <Text style={styles.confirmButton}>{t('common.confirm')}</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="inline"
                      onChange={onChangeDate}
                      style={styles.iosPicker}
                    />
                  </View>
                ) : (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onChangeDate}
                  />
                ))}
            </View>

            <View style={styles.transactionNote}>
              <TouchableOpacity
                style={styles.transactionNoteInner}
                onPress={() => noteRef.current?.focus()}
                activeOpacity={0.7}
              >
                <Ionicons name="document-text-outline" size={24} color="#4B5563" />
                <View style={styles.noteInputPlaceholder}>
                  <Text style={styles.noteInputLabel}>{t('transactions.note')}</Text>
                  <TextInput
                    ref={noteRef}
                    placeholder={t('transactions.add_note')}
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    value={note}
                    onChangeText={setNote}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.paymentMethod}>
              <TouchableOpacity
                style={styles.paymentMethodInner}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="card-outline" size={24} color="#4B5563" />
                <View style={styles.noteInputPlaceholder}>
                  <Text style={styles.noteInputLabel}>{t('transactions.payment_method')}</Text>
                  <Text style={styles.noteText}>
                    {selectedMethod
                      ? selectedMethod === "cash"
                        ? t('transactions.cash')
                        : t('transactions.card')
                      : t('transactions.select_method')}
                  </Text>
                </View>
              </TouchableOpacity>
              <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                  <View style={styles.modalContainer}>
                    <Pressable style={styles.modalOption} onPress={() => handleMethodSelect("cash")}>
                      <Text style={styles.modalText}>{t('transactions.cash')}</Text>
                    </Pressable>
                    <Pressable style={styles.modalOption} onPress={() => handleMethodSelect("card")}>
                      <Text style={styles.modalText}>{t('transactions.card')}</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Modal>
            </View>

            <View style={styles.recurringTransaction}>
              <TouchableOpacity
                style={[
                  styles.recurringTransactionInner,
                  isRecurring && styles.recurringTransactionActive,
                ]}
                onPress={() => setIsRecurring((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="repeat"
                  size={24}
                  color={isRecurring ? "#fff" : "#4B5563"}
                />
                <View style={styles.recurringContent}>
                  <Text
                    style={[
                      styles.recurringText,
                      isRecurring && styles.recurringTextActive,
                    ]}
                  >
                    {t('transactions.recurring_transaction')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.receiptePhoto}>
              <TouchableOpacity style={styles.receiptePhotoInner}>
                <Ionicons name="image-outline" size={24} color="#4B5563" />
                <View style={styles.receipteContent}>
                  <Text style={styles.receipteText}>{t('transactions.add_receipt')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.save}>
            <View style={styles.saveTransaction}>
              <TouchableOpacity
                style={styles.saveTransactionInner}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <View style={styles.saveTransactionContent}>
                  <Text style={styles.saveTransactionText}>{t('transactions.save_transaction')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Остальная часть кода со стилями остается без изменений
const getThemedStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
    },
    content: {
      padding: 20,
    },
    switch: {
      width: "100%",
      height: 60,
      backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
      alignItems: "center",
      flexDirection: "row",
      margin: "auto",
      borderRadius: 12,
      padding: 4,
      justifyContent: "space-around",
      marginBottom: 44,
    },
    switchButton: {
      flex: 1,
      width: "100%",
      height: "100%",
      borderRadius: 8,
    },
    selectedButton: {
      backgroundColor: "#007AFF",
    },
    switchText: {
      textAlign: "center",
      margin: "auto",
      alignItems: "center",
      color: isDark ? "#D1D5DB" : "#4B5563",
      fontSize: 16,
      fontWeight: "400",
    },
    selectedText: {},
    balance: {
      alignItems: "center",
      flexDirection: "row",
      margin: "auto",
      marginBottom: 44,
    },
    balanceValue: {
      color: "#9CA3AF",
      fontSize: 36,
      fontWeight: "600",
    },
    balanceAmount: {
      color: isDark ? "#FFFFFF" : "#000000",
      fontSize: 36,
      fontWeight: "600",
    },
    balanceAmountInput: {
      fontSize: 36,
      fontWeight: "600",
      color: isDark ? "#FFFFFF" : "#000000",
      marginLeft: 4,
      padding: 0,
      borderBottomWidth: 0,
      textAlignVertical: "center",
    },
    category: {
      marginBottom: 30,
    },
    categoryTitle: {
      fontWeight: "600",
      fontSize: 14,
      color: isDark ? "#E5E7EB" : "#4B5563",
      marginBottom: 15,
    },
    categoryGroup: {
      flexDirection: "row",
    },
    categoryCard: {
      marginRight: 16,
    },
    categoryIcon: {
      width: 72,
      height: 72,
      borderRadius: 16,
      backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
      alignItems: "center",
      padding: 20,
    },
    selectedCategory: {
      backgroundColor: "#007AFF",
    },
    categoryText: {
      color: isDark ? "#D1D5DB" : "#4B5563",
      fontWeight: "400",
      fontSize: 12,
      textAlign: "center",
      maxWidth: 70,
    },
    iosPickerContainer: {
      backgroundColor: isDark ? "#374151" : "#FFFFFF",
      borderRadius: 10,
      overflow: "hidden",
      marginTop: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    iosPickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
      backgroundColor: isDark ? "#374151" : "#F8F8F8",
      borderBottomWidth: 1,
      borderBottomColor: "#E5E5E5",
    },
    confirmButton: {
      color: "#007AFF",
      fontSize: 17,
      fontWeight: "600",
    },
    cancelButton: {
      color: "#FF3B30",
      fontSize: 17,
    },
    iosPicker: {
      height: 320,
      width: "100%",
    },
    transactionDetails: {
      flexDirection: "column",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    transactionDate: {
      marginBottom: 15,
    },
    dateInputPlaceholder: {
      marginLeft: 12,
    },
    dateInput: {
      height: 76,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      padding: 16,
      backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
    },
    dateInputLabel: {
      fontSize: 14,
      color: isDark ? "#D1D5DB" : "#4B5563",
      marginBottom: 4,
      fontWeight: "400",
    },
    dateText: {
      fontSize: 16,
      color: isDark ? "#F9FAFB" : "#1F2937",
    },
    transactionNote: {
      marginBottom: 15,
    },
    transactionNoteInner: {
      height: 76,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      padding: 16,
      backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
    },
    noteInputPlaceholder: {
      marginLeft: 12,
    },
    noteInputLabel: {
      fontSize: 14,
      color: isDark ? "#D1D5DB" : "#4B5563",
      marginBottom: 4,
      fontWeight: "400",
    },
    noteText: {
      fontSize: 16,
      color: isDark ? "#9CA3AF" : "#9CA3AF",
    },
    input: {
      borderWidth: 0,
      backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
      color: isDark ? "#FFFFFF" : "#000000",
      width: "100%",
      height: 19,
      fontSize: 16,
      padding: 0,
    },
    paymentMethod: {
      marginBottom: 16,
    },
    paymentMethodInner: {
      height: 76,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      padding: 16,
      backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    modalContainer: {
      marginHorizontal: 40,
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderRadius: 12,
      padding: 16,
    },
    modalOption: {
      paddingVertical: 12,
    },
    modalText: {
      fontSize: 16,
      color: isDark ? "#F3F4F6" : "#1F2937",
    },
    recurringTransaction: {
      marginBottom: 15,
    },
    recurringTransactionInner: {
      height: 76,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      padding: 16,
      backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
    },
    recurringTransactionActive: {
      backgroundColor: "#007AFF",
    },
    recurringContent: {
      marginLeft: 12,
    },
    recurringText: {
      fontSize: 16,
      color: isDark ? "#E5E7EB" : "#4B5563",
    },
    recurringTextActive: {
      color: "#FFFFFF",
      fontWeight: "500",
    },
    receiptePhoto: {
      marginBottom: 15,
    },
    receiptePhotoInner: {
      height: 76,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      padding: 16,
      backgroundColor: isDark ? "#1F2937" : "#F9FAFB",
    },
    receipteContent: {
      marginLeft: 12,
    },
    receipteText: {
      fontSize: 16,
      color: isDark ? "#E5E7EB" : "#4B5563",
    },
    saveTransaction: {
      backgroundColor: "#007AFF",
      borderRadius: 12,
    },
    saveTransactionInner: {
      height: 56,
      justifyContent: "center",
      alignItems: "center",
    },
    saveTransactionText: {
      color: "#FFFFFF",
      fontWeight: "500",
      fontSize: 16,
    },
  });

export default TransactionAdd;