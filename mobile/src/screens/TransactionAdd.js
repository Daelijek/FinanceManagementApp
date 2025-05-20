import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef, useContext } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from '@react-native-picker/picker';
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
} from "react-native";
import { ThemeContext } from "../context/ThemeContext";

const TransactionAdd = () => {
  const [amount, setAmount] = useState("0.00");
  const [selectedType, setSelectedType] = useState("expense");
  const [selectedCategory, setSelectedCategory] = useState();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const inputRef = useRef(null);
  const [isRecurring, setIsRecurring] = useState(false);

  const handlePress = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const [selectedMethod, setSelectedMethod] = useState(null); // 'cash' | 'card'
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (method) => {
    setSelectedMethod(method);
    setModalVisible(false);
  };

  // Обработчик изменений в DateTimePicker
  const onChange = (event, selectedDate) => {
    // На Android выбор даты подтверждается сразу
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (selectedDate) {
        setDate(selectedDate);
      }
    } else {
      // На iOS дата "живет" во временном стейте, пока пользователь не нажмёт Confirm
      setTempDate(selectedDate || date);
    }
  };

  // Кнопка "Confirm" на iOS
  const handleConfirm = () => {
    setShowPicker(false);
    setDate(tempDate);
  };

  // Кнопка "Cancel" на iOS
  const handleCancel = () => {
    setShowPicker(false);
    setTempDate(date);
  };

  // Форматирование даты: если сегодня – добавляем "Today, ...", иначе "DD MMM YYYY"
  const formatDate = (dateToFormat) => {
    const today = new Date();
    const isToday =
      dateToFormat.getDate() === today.getDate() &&
      dateToFormat.getMonth() === today.getMonth() &&
      dateToFormat.getFullYear() === today.getFullYear();

    // Пример: 15 Feb 2024
    const formattedDate = dateToFormat.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return isToday ? `Today, ${formattedDate}` : formattedDate;
  };

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getThemedStyles(isDark);

  const textColor = isDark ? "#F9FAFB" : "#1F2937";
  const subTextColor = isDark ? "#9CA3AF" : "#4B5563";
  const placeholderColor = isDark ? "#6B7280" : "#9CA3AF";
  const iconColor = isDark ? "#D1D5DB" : "#4B5563";
  const switchInactiveColor = isDark ? "#1F2937" : "#F3F4F6";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false} // Отключает эффект перетягивания вверх/вниз на iOS
        overScrollMode="never" // Отключает overscroll на Android
        showsVerticalScrollIndicator={false} // Скрывает полосу прокрутки
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
                  { color: selectedType === "expense" ? "#FFFFFF" : textColor },
                ]}
              >
                Expense
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
                  { color: selectedType === "income" ? "#FFFFFF" : textColor },
                ]}
              >
                Income
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
              onChangeText={(text) => {
                // Разрешаем только числа и точку, при этом не более одной точки
                const cleaned = text.replace(/[^0-9.]/g, '');
                const valid = cleaned.split('.').length <= 2 ? cleaned : amount;
                setAmount(valid);
              }}
              maxLength={12}
            />
          </View>

          <View style={styles.category}>
            <Text style={styles.categoryTitle}>Category</Text>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryGroup}>
                {selectedType === "expense" ? (
                  <>
                    {/* Shopping */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("shopping")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "shopping" &&
                          styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "shopping"
                              ? "cart-outline"
                              : "cart"
                          }
                          size={32}
                          color={
                            selectedCategory === "shopping" ? "#fff" : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Shopping</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Food */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("food")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "food" && styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "food"
                              ? "restaurant-outline"
                              : "restaurant"
                          }
                          size={32}
                          color={selectedCategory === "food" ? "#fff" : "#4B5563"}
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Food</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Transport */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("transport")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "transport" &&
                          styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "transport"
                              ? "car-outline"
                              : "car"
                          }
                          size={32}
                          color={
                            selectedCategory === "transport" ? "#fff" : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Transport</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Bills */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("bills")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "bills" && styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "bills"
                              ? "receipt-outline"
                              : "receipt"
                          }
                          size={32}
                          color={
                            selectedCategory === "bills" ? "#fff" : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Bills</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Health Care */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("healthCare")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "healthCare" &&
                          styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "healthCare"
                              ? "medkit-outline"
                              : "medkit"
                          }
                          size={32}
                          color={
                            selectedCategory === "healthCare" ? "#fff" : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Health Care</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Entertainment */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("entertainment")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "entertainment" &&
                          styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "entertainment"
                              ? "game-controller-outline"
                              : "game-controller"
                          }
                          size={32}
                          color={
                            selectedCategory === "entertainment"
                              ? "#fff"
                              : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Entertainment</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Travel */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("travel")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "travel" &&
                          styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "travel"
                              ? "airplane-outline"
                              : "airplane"
                          }
                          size={32}
                          color={
                            selectedCategory === "travel" ? "#fff" : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Travel</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Subscription */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("subscription")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "subscription" &&
                          styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "subscription"
                              ? "tv-outline"
                              : "tv"
                          }
                          size={32}
                          color={
                            selectedCategory === "subscription"
                              ? "#fff"
                              : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Subscription</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Salary */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("salary")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "salary" &&
                          styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "salary"
                              ? "briefcase-outline"
                              : "briefcase"
                          }
                          size={32}
                          color={
                            selectedCategory === "salary" ? "#fff" : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Salary</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Investment */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("investment")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "investment" &&
                          styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "investment"
                              ? "trending-up-outline"
                              : "trending-up"
                          }
                          size={32}
                          color={
                            selectedCategory === "investment" ? "#fff" : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Investment</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Savings */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("savings")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "savings" &&
                          styles.selectedCategory,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            selectedCategory === "savings"
                              ? "piggy-bank-outline"
                              : "piggy-bank"
                          }
                          size={32}
                          color={
                            selectedCategory === "savings" ? "#fff" : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Savings</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Bonus */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("bonus")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "bonus" && styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "bonus" ? "gift-outline" : "gift"
                          }
                          size={32}
                          color={
                            selectedCategory === "bonus" ? "#fff" : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Bonus</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Other Income */}
                    <TouchableOpacity
                      onPress={() => setSelectedCategory("otherIncome")}
                      style={styles.categoryCard}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          selectedCategory === "otherIncome" &&
                          styles.selectedCategory,
                        ]}
                      >
                        <Ionicons
                          name={
                            selectedCategory === "otherIncome"
                              ? "document-text-outline"
                              : "document-text"
                          }
                          size={32}
                          color={
                            selectedCategory === "otherIncome"
                              ? "#fff"
                              : "#4B5563"
                          }
                        />
                      </View>
                      <View style={styles.categoryLabel}>
                        <Text style={styles.categoryText}>Other Income</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
          <View style={styles.transactionDetails}>
            <View style={styles.transactionDate}>
              {/* Кнопка (поле) для отображения выбранной даты */}
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowPicker(true)}
              >
                <Ionicons name="calendar-outline" size={24} color="#4B5563" />
                <View style={styles.dateInputPlaceholder}>
                  <Text style={styles.dateInputLabel}>Date</Text>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                </View>
              </TouchableOpacity>

              {/* Сам DateTimePicker */}
              {showPicker &&
                (Platform.OS === "ios" ? (
                  <View style={styles.iosPickerContainer}>
                    <View style={styles.iosPickerHeader}>
                      <TouchableOpacity onPress={handleCancel}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleConfirm}>
                        <Text style={styles.confirmButton}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="inline"
                      onChange={onChange}
                      style={styles.iosPicker}
                    />
                  </View>
                ) : (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onChange}
                  />
                ))}
            </View>
            <View style={styles.transactionNote}>
              <TouchableOpacity
                style={styles.transactionNoteInner}
                onPress={handlePress}
                activeOpacity={0.3} // Значение меньше 1 для анимации при нажатии
              >
                <Ionicons name="document-text-outline" size={24} color="#4B5563" />
                <View style={styles.noteInputPlaceholder}>
                  <Text style={styles.noteInputLabel}>Note</Text>
                  <TextInput
                    ref={inputRef}
                    placeholder="Add note"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    underlineColorAndroid="transparent"
                    selectionColor="transparent"
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.paymentMethod}>
              <TouchableOpacity
                style={styles.paymentMethodInner}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.3}
              >
                <Ionicons name="card-outline" size={24} color="#4B5563" />
                <View style={styles.noteInputPlaceholder}>
                  <Text style={styles.noteInputLabel}>Payment Method</Text>
                  <Text style={[styles.noteText, selectedMethod && styles.selectedText]}>
                    {selectedMethod ? (selectedMethod === 'cash' ? 'Cash' : 'Card') : 'Select...'}
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
                    <Pressable style={styles.modalOption} onPress={() => handleSelect('cash')}>
                      <Text style={styles.modalText}>Cash</Text>
                    </Pressable>
                    <Pressable style={styles.modalOption} onPress={() => handleSelect('card')}>
                      <Text style={styles.modalText}>Card</Text>
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
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <Ionicons
                  name="repeat"
                  size={24}
                  color={isRecurring ? "#FFFFFF" : "#4B5563"}
                />
                <View style={styles.recurringContent}>
                  <Text
                    style={[
                      styles.recurringText,
                      isRecurring && styles.recurringTextActive,
                    ]}
                  >
                    Recurring Transaction
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.receiptePhoto}>
              <TouchableOpacity
                style={styles.receiptePhotoInner}>
                <Ionicons
                  name="image-outline"
                  size={24}
                  color="#4B5563"
                />
                <View style={styles.receipteContent}>
                  <Text style={styles.receipteText}>Add Receipt Photo</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.save}>
            <View style={styles.saveTransaction}>
              <TouchableOpacity style={styles.saveTransactionInner}>
                <View style={styles.saveTransactionContent}>
                  <Text style={styles.saveTransactionText}>Save Transaction</Text>
                </View>
              </TouchableOpacity>
            </View>
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
