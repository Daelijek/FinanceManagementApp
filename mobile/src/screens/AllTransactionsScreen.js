import React, { useState, useContext, useEffect, useCallback, useRef } from "react";
import {
  SectionList,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";

const tabs = [
  { label: "All", period: "all" },
  { label: "Week", period: "week" },
  { label: "Month", period: "month" },
  { label: "Year", period: "year" },
];

const materialIcons = ["piggy-bank", "cart", "wallet", "cash"];

const IconCmp = (iconName) => {
  if (iconName && materialIcons.some((prefix) => iconName.startsWith(prefix))) {
    return MaterialCommunityIcons;
  }
  return Ionicons;
};

export default function AllTransactionsScreen() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState(tabs[0].period);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("cash");
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const slideUp = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const fetchGroupedTransactions = useCallback(async (period) => {
    setLoading(true);
    try {
      let res;
      let data;

      if (period === "all") {
        // Получаем сгруппированные данные для всех транзакций
        res = await apiFetch("/api/v1/transactions/grouped?skip=0&limit=100");
        if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
        data = await res.json(); // Ожидаем, что данные уже сгруппированы и в нужном формате
      } else {
        // Получаем транзакции за период (day, week, month, year)
        res = await apiFetch(`/api/v1/transactions/period/${period}`);
        if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
        const json = await res.json();
        const transactions = json.transactions || [];

        // Ручная группировка по дате для SectionList
        const grouped = transactions.reduce((acc, tx) => {
          const dateKey = new Date(tx.transaction_date).toLocaleDateString();
          const section = acc.find(s => s.title === dateKey);
          if (section) {
            section.data.push(tx);
          } else {
            acc.push({ title: dateKey, data: [tx] });
          }
          return acc;
        }, []);

        // Отсортировать группы по дате (новые сверху)
        grouped.sort((a, b) => new Date(b.title) - new Date(a.title));

        // Также можно отсортировать транзакции внутри групп по времени
        grouped.forEach(section => {
          section.data.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
        });

        data = grouped;
      }

      setSections(data);
    } catch (error) {
      console.error("Ошибка загрузки транзакций:", error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupedTransactions(activeTab);
  }, [activeTab, fetchGroupedTransactions]);

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
      duration: 250,
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
      Alert.alert("Ошибка", "Описание не может быть пустым");
      return;
    }

    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum)) {
      Alert.alert("Ошибка", "Введите корректную сумму");
      return;
    }

    setSaving(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Токен авторизации отсутствует");

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

      const res = await fetch(
        `${process.env.API_URL || "http://localhost:8000"}/api/v1/transactions/${selectedTransaction.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail ? JSON.stringify(errJson.detail) : "Ошибка при сохранении");
      }

      await fetchGroupedTransactions(activeTab);
      closeModal();
    } catch (error) {
      Alert.alert("Ошибка", error.message);
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!selectedTransaction) return;

    Alert.alert(
      "Удалить транзакцию?",
      "Вы уверены, что хотите удалить эту транзакцию?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) throw new Error("Токен авторизации отсутствует");

              const res = await fetch(
                `${process.env.API_URL || "http://localhost:8000"}/api/v1/transactions/${selectedTransaction.id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!res.ok) {
                const errJson = await res.json();
                throw new Error(errJson.detail ? JSON.stringify(errJson.detail) : "Ошибка при удалении");
              }

              await fetchGroupedTransactions(activeTab);
              closeModal();
            } catch (error) {
              Alert.alert("Ошибка", error.message);
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}
    >
      <View
        style={[
          styles.tabsContainer,
          isDark ? styles.tabsContainerDark : styles.tabsContainerLight,
        ]}
      >
        {tabs.map(({ label, period }) => {
          const isActive = period === activeTab;
          return (
            <TouchableOpacity
              key={period}
              onPress={() => setActiveTab(period)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive
                    ? isDark
                      ? styles.tabActiveDark
                      : styles.tabActiveLight
                    : isDark
                      ? styles.tabInactiveDark
                      : styles.tabInactiveLight,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={isDark ? "#2563EB" : "#2563EB"} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              style={[
                styles.sectionHeader,
                isDark ? styles.sectionHeaderDark : styles.sectionHeaderLight,
              ]}
            >
              {title}
            </Text>
          )}
          renderItem={({ item }) => {
            const isIncome = item.transaction_type === "income";
            const Icon = IconCmp(item.category_icon || "card-outline");
            return (
              <TouchableOpacity
                style={[styles.row, isDark ? styles.rowDark : styles.rowLight]}
                onPress={() => openModal(item)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isIncome ? styles.incomeBg : styles.expenseBg,
                  ]}
                >
                  <Icon
                    name={item.category_icon || "card-outline"}
                    size={20}
                    color={isIncome ? "#16A34A" : "#4B5563"}
                  />
                </View>

                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.title,
                      isDark ? styles.titleDark : styles.titleLight,
                    ]}
                    numberOfLines={1}
                  >
                    {item.description || item.category_name || "No description"}
                  </Text>
                  <Text
                    style={[
                      styles.date,
                      isDark ? styles.dateDark : styles.dateLight,
                    ]}
                  >
                    {new Date(item.transaction_date).toLocaleDateString()}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.amount,
                    isIncome ? styles.incomeText : styles.expenseText,
                    isDark ? styles.amountDark : styles.amountLight,
                  ]}
                >
                  {isIncome ? "+" : "-"}
                  {item.amount.toFixed(2)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

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
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? "#1F2937" : "#FFF",
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                  Edit Transaction
                </Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, isDark && styles.labelDark]}>Description</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="Description"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    editable={!saving && !deleting}
                    returnKeyType="done"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, isDark && styles.labelDark]}>Amount</Text>
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="Amount"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="numeric"
                    editable={!saving && !deleting}
                    returnKeyType="done"
                  />
                </View>

                <View style={[styles.formGroup, styles.horizontalGroup]}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={[styles.label, isDark && styles.labelDark]}>
                      Payment Method
                    </Text>
                    <View style={styles.typeSelector}>
                      {["cash", "card"].map((method) => (
                        <TouchableOpacity
                          key={method}
                          style={[
                            styles.typeButton,
                            editPaymentMethod === method && styles.typeButtonActive,
                            { flex: 1, marginRight: method === "cash" ? 8 : 0 },
                          ]}
                          onPress={() => !saving && !deleting && setEditPaymentMethod(method)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.typeButtonText,
                              editPaymentMethod === method && styles.typeButtonTextActive,
                            ]}
                          >
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
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
                      Recurring
                    </Text>
                    <TouchableOpacity
                      onPress={() => !saving && !deleting && setEditIsRecurring(!editIsRecurring)}
                      style={[
                        styles.recurringToggle,
                        editIsRecurring && styles.recurringToggleActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      {editIsRecurring && (
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeModal}
                    disabled={saving || deleting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={onDelete}
                    disabled={saving || deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.deleteButtonText}>Delete</Text>
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
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: "#F9FAFB" },
  containerDark: { backgroundColor: "#111827" },

  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tabsContainerLight: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F5F5F5",
  },
  tabsContainerDark: {
    backgroundColor: "#1F2937",
    borderBottomColor: "#374151",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tabActiveLight: {
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  tabInactiveLight: {
    color: "#71717A",
    backgroundColor: "transparent",
  },
  tabActiveDark: {
    color: "#2563EB",
    backgroundColor: "#374151",
  },
  tabInactiveDark: {
    color: "#9CA3AF",
    backgroundColor: "transparent",
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeaderLight: {
    color: "#6B7280",
  },
  sectionHeaderDark: {
    color: "#9CA3AF",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLight: {
    borderBottomColor: "#E5E7EB",
  },
  rowDark: {
    borderBottomColor: "#374151",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  expenseBg: {
    backgroundColor: "#E5E7EB",
  },
  incomeBg: {
    backgroundColor: "#DCFCE7",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  titleLight: {
    color: "#111827",
  },
  titleDark: {
    color: "#F9FAFB",
  },
  date: {
    fontSize: 12,
  },
  dateLight: {
    color: "#6B7280",
  },
  dateDark: {
    color: "#9CA3AF",
  },
  amount: {
    fontSize: 16,
    fontWeight: "500",
  },
  amountLight: {},
  amountDark: {},
  expenseText: {
    color: "#111827",
  },
  incomeText: {
    color: "#16A34A",
  },
  loader: {
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
    maxHeight: "80%",
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
    color: "#2563EB",
    fontSize: 14,
    textAlign: "center",
  },
  typeButtonTextActive: {
    color: "#FFFFFF",
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