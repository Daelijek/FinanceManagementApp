import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef } from "react";
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
} from "react-native";

const TransactionAdd = () => {
  const [selectedType, setSelectedType] = useState("expense");
  const [selectedCategory, setSelectedCategory] = useState();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const inputRef = useRef(null);

  const handlePress = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
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

  return (
    <SafeAreaView style={styles.container}>
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
                selectedType === "expense" && styles.selectedText,
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
                selectedType === "income" && styles.selectedText,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.balance}>
          <Text style={styles.balanceValue}>$</Text>
          {selectedType === "expense" ? (
            <Text style={styles.balanceAmount}>0.00</Text>
          ) : (
            <Text style={styles.balanceAmount}>194532.53</Text>
          )}
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
          <TouchableOpacity
            style={styles.transactionNote}
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

          <View style={styles.paymentMethod}>
            
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  switch: {
    width: "100%",
    height: 60,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    flexDirection: "row",
    margin: "auto",
    borderRadius: 12,
    padding: 4,
    justifyContent: "space-around",
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
    color: "#4B5563",
    fontSize: 16,
    fontWeight: 400,
  },
  selectedText: {
    color: "#fff",
  },
  balance: {
    alignItems: "center",
    flexDirection: "row",
    margin: "auto",
  },
  balanceValue: {
    color: "#9CA3AF",
    fontSize: 36,
    fontWeight: 600,
  },
  balanceAmount: {
    color: "#000",
    fontSize: 36,
    fontWeight: 600,
  },
  categoryTitle: {
    fontWeight: 600,
    fontSize: 14,
    color: "#4B5563",
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
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    padding: 20,
  },
  selectedCategory: {
    backgroundColor: "#007AFF",
  },
  categoryText: {
    color: "#4B5563",
    fontWeight: 400,
    fontSize: 12,
    textAlign: "center",
    maxWidth: 70,
  },
  iosPickerContainer: {
    backgroundColor: "#fff",
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
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
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
  dateInputPlaceholder: {
    marginLeft: 12,
  },
  dateInput: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  dateInputLabel: {
    fontSize: 14,
    color: "#4B5563", // Серый текст (Tailwind Gray-400)
    marginBottom: 4,
    fontWeight: "400",
  },
  dateText: {
    fontSize: 16,
    color: "#1F2937",
  },
  transactionNote: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  noteInputPlaceholder: {
    marginLeft: 12,
  },
  noteInputLabel: {
    fontSize: 14,
    color: "#4B5563", // Серый текст (Tailwind Gray-400)
    marginBottom: 4,
    fontWeight: "400",
  },
  noteText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  input: {
    // убираем все границы у TextInput
    borderWidth: 0,
    backgroundColor: "#F9FAFB",
    width: "100%",
    height: 19,
    fontSize: 16,
    padding: 0, // чтобы не было отступов внутри
  },
});

export default TransactionAdd;
