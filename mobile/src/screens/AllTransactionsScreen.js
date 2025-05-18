// AllTransactionsScreen.js

import React, { useState, useContext } from "react";
import {
    SectionList,
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";

const tabs = ["All", "Week", "Month", "Year"];

const SECTIONS = [
    {
        title: "Today",
        data: [
            { id: "1", title: "Grocery Shopping", date: "Today", amount: -82.45, icon: "cart-outline", type: "expense" },
            { id: "2", title: "Coffee Shop", date: "Today", amount: -4.5, icon: "cafe-outline", type: "expense" },
        ],
    },
    {
        title: "Yesterday",
        data: [
            { id: "3", title: "Car Insurance", date: "Yesterday", amount: -145.0, icon: "car-outline", type: "expense" },
            { id: "4", title: "Restaurant", date: "Yesterday", amount: -35.5, icon: "restaurant-outline", type: "expense" },
        ],
    },
    {
        title: "Earlier This Week",
        data: [
            { id: "5", title: "Salary Deposit", date: "Jan 25", amount: 3200.0, icon: "wallet-outline", type: "income" },
            { id: "6", title: "Movie Tickets", date: "Monday", amount: -27.0, icon: "film-outline", type: "expense" },
            // ... другие транзакции
        ],
    },
];

export default function AllTransactionsScreen() {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <SafeAreaView
            style={[
                styles.container,
                isDark ? styles.containerDark : styles.containerLight,
            ]}
        >
            {/* Блок табов */}
            <View
                style={[
                    styles.blockOne,
                    isDark ? styles.blockOneDark : styles.blockOneLight,
                ]}
            >
                <View style={styles.list}>
                    {tabs.map((tab) => {
                        const isActive = tab === activeTab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.itemBase,
                                        isActive
                                            ? isDark
                                                ? styles.itemActiveDark
                                                : styles.itemActiveLight
                                            : isDark
                                                ? styles.itemInactiveDark
                                                : styles.itemInactiveLight,
                                    ]}
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Список всех транзакций */}
            <SectionList
                sections={SECTIONS}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}

                renderSectionHeader={({ section: { title } }) => (
                    <Text
                        style={[
                            styles.sectionHeader,
                            isDark
                                ? styles.sectionHeaderDark
                                : styles.sectionHeaderLight,
                        ]}
                    >
                        {title}
                    </Text>
                )}

                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.row,
                            isDark ? styles.rowDark : styles.rowLight,
                        ]}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                item.type === "income"
                                    ? styles.incomeBg
                                    : styles.expenseBg,
                            ]}
                        >
                            <Ionicons
                                name={item.icon}
                                size={20}
                                color={
                                    item.type === "income" ? "#16A34A" : "#4B5563"
                                }
                            />
                        </View>

                        <View style={styles.textContainer}>
                            <Text
                                style={[
                                    styles.title,
                                    isDark ? styles.titleDark : styles.titleLight,
                                ]}
                            >
                                {item.title}
                            </Text>
                            <Text
                                style={[
                                    styles.date,
                                    isDark ? styles.dateDark : styles.dateLight,
                                ]}
                            >
                                {item.date}
                            </Text>
                        </View>

                        <Text
                            style={[
                                styles.amount,
                                item.amount >= 0
                                    ? styles.incomeText
                                    : styles.expenseText,
                                isDark ? styles.amountDark : styles.amountLight,
                            ]}
                        >
                            {item.amount >= 0
                                ? `+${item.amount.toFixed(2)}`
                                : item.amount.toFixed(2)}
                        </Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Контейнер
    container: { flex: 1 },
    containerLight: { backgroundColor: "#F9FAFB" },
    containerDark: { backgroundColor: "#111827" },

    // Блок табов
    blockOne: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 25,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    blockOneLight: {
        backgroundColor: "#FFFFFF",
        borderBottomColor: "#F5F5F5",
    },
    blockOneDark: {
        backgroundColor: "#1F2937",
        borderBottomColor: "#374151",
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

    // Контент
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

    // Ряд транзакции
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
    amountLight: {
        // расход чёрный, доход — зелёный
    },
    amountDark: {
        // в тёмной теме чёрный ⇒ белый
    },
    expenseText: {
        color: "#111827",
    },
    incomeText: {
        color: "#16A34A",
    },
});