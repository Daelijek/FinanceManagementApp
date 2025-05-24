import React, { useState, useContext, useEffect, useCallback } from "react";
import {
  SectionList,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
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

  const fetchGroupedTransactions = useCallback(async (period) => {
    setLoading(true);
    try {
      // Для всех периодов получаем все транзакции и фильтруем на клиенте
      const res = await apiFetch("/api/v1/transactions/?skip=0&limit=1000");
      if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
      
      const json = await res.json();
      const allTransactions = json.transactions || [];
      
      // Фильтруем транзакции по периоду
      const now = new Date();
      let filteredTransactions = [];
      
      switch (period) {
        case 'all':
          // Все транзакции
          filteredTransactions = allTransactions;
          break;
          
        case 'week':
          // Последние 7 дней
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredTransactions = allTransactions.filter(tx => {
            const txDate = new Date(tx.transaction_date);
            return txDate >= weekAgo && txDate <= now;
          });
          break;
          
        case 'month':
          // Текущий календарный месяц
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          
          filteredTransactions = allTransactions.filter(tx => {
            const txDate = new Date(tx.transaction_date);
            return txDate.getFullYear() === currentYear && 
                   txDate.getMonth() === currentMonth;
          });
          break;
          
        case 'year':
          // Текущий календарный год
          const currentYearOnly = now.getFullYear();
          
          filteredTransactions = allTransactions.filter(tx => {
            const txDate = new Date(tx.transaction_date);
            return txDate.getFullYear() === currentYearOnly;
          });
          break;
          
        default:
          filteredTransactions = allTransactions;
      }
      
      // Группируем отфильтрованные транзакции по дням
      const grouped = filteredTransactions.reduce((acc, tx) => {
        const txDate = new Date(tx.transaction_date);
        
        const dateKey = txDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        
        const section = acc.find(s => s.title === dateKey);
        if (section) {
          section.data.push(tx);
        } else {
          acc.push({ title: dateKey, data: [tx] });
        }
        return acc;
      }, []);

      // Сортируем группы по дате (новые сверху)
      grouped.sort((a, b) => {
        const parseDate = (dateStr) => {
          const parts = dateStr.split(' ');
          const day = parseInt(parts[0]);
          const month = parts[1];
          const year = parseInt(parts[2]);
          
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = monthNames.indexOf(month);
          
          return new Date(year, monthIndex, day);
        };
        
        const dateA = parseDate(a.title);
        const dateB = parseDate(b.title);
        return dateB - dateA;
      });

      // Сортируем транзакции внутри каждой группы (новые сверху)
      grouped.forEach(section => {
        section.data.sort((a, b) => {
          const dateA = new Date(a.transaction_date);
          const dateB = new Date(b.transaction_date);
          return dateB - dateA;
        });
      });

      setSections(grouped);
      
      // Временная отладка
      console.log(`=== Debug info for period: ${period} ===`);
      console.log(`Total transactions: ${allTransactions.length}`);
      console.log(`Filtered transactions: ${filteredTransactions.length}`);
      console.log(`Grouped sections: ${grouped.length}`);
      
      // Показываем первые несколько транзакций для проверки
      filteredTransactions.slice(0, 5).forEach((tx, index) => {
        console.log(`Transaction ${index + 1}:`, {
          description: tx.description,
          type: tx.transaction_type,
          amount: tx.amount,
          date: tx.transaction_date
        });
      });
      
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
            
            // Используем цвет категории или дефолтные цвета
            const iconColor = item.category_color || 
              (isIncome ? "#16A34A" : (isDark ? "#9CA3AF" : "#4B5563"));
            
            // Правильно обрабатываем отображение суммы
            const displayAmount = isIncome 
              ? `+${Math.abs(item.amount).toFixed(2)}` 
              : `-${Math.abs(item.amount).toFixed(2)}`;
            
            const amountColor = isIncome ? "#16A34A" : (isDark ? "#F9FAFB" : "#111827");
            
            console.log(`Transaction: ${item.description}, Type: ${item.transaction_type}, Amount: ${item.amount}, Display: ${displayAmount}`);
            
            return (
              <View
                style={[styles.row, isDark ? styles.rowDark : styles.rowLight]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isIncome ? styles.incomeBg : (isDark ? styles.expenseBgDark : styles.expenseBg),
                  ]}
                >
                  <Icon
                    name={item.category_icon || "card-outline"}
                    size={20}
                    color={iconColor}
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
                    {new Date(item.transaction_date).toLocaleDateString()} • {item.payment_method || 'cash'}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.amount,
                    { color: amountColor },
                  ]}
                >
                  {displayAmount}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
                No transactions found for this period
              </Text>
            </View>
          )}
        />
      )}
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
  expenseBgDark: {
    backgroundColor: "#1F2937",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyTextLight: {
    color: "#6B7280",
  },
  emptyTextDark: {
    color: "#9CA3AF",
  },
});