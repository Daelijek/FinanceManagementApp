import React, { useContext } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext"; // Добавлен импорт контекста темы

const essentialExpenses = [
    { key: "housing", label: "Housing", icon: "home-outline", lib: "Ionicons" },
    { key: "transportation", label: "Transportation", icon: "car-outline", lib: "Ionicons" },
    { key: "groceries", label: "Groceries", icon: "cart-outline", lib: "Ionicons" },
    { key: "healthcare", label: "Healthcare", icon: "medkit-outline", lib: "Ionicons" },
    { key: "utilities", label: "Utilities", icon: "flash-outline", lib: "Ionicons" },
];

const lifestyle = [
    { key: "dining", label: "Dining Out", icon: "restaurant-outline", lib: "Ionicons" },
    { key: "entertainment", label: "Entertainment", icon: "ticket-outline", lib: "Ionicons" },
    { key: "shopping", label: "Shopping", icon: "shirt-outline", lib: "Ionicons" },
    { key: "fitness", label: "Fitness", icon: "barbell-outline", lib: "Ionicons" },
    { key: "hobbies", label: "Hobbies", icon: "game-controller-outline", lib: "Ionicons" },
];

const savingsInvestments = [
    { key: "emergency", label: "Emergency Fund", icon: "wallet-outline", lib: "Ionicons" },
    { key: "investments", label: "Investments", icon: "trending-up-outline", lib: "Ionicons" },
    { key: "education", label: "Education", icon: "school-outline", lib: "Ionicons" },
    { key: "retirement", label: "Retirement", icon: "calendar-outline", lib: "Ionicons" },
    { key: "debt", label: "Debt Payment", icon: "card-outline", lib: "Ionicons" },
];

const predefinedCategories = [
    "Bills & Utilities",
    "Auto & Transport",
    "Food & Dining",
    "Shopping",
    "Travel",
    "Health & Fitness",
    "Entertainment",
    "Education",
    "Gifts & Donations",
    "Business",
    "Insurance",
    "Tax",
];

const IconRenderer = ({ lib, name, color, size }) => {
    if (lib === "Ionicons") return <Ionicons name={name} size={size} color={color} />;
    if (lib === "MaterialCommunityIcons") return <MaterialCommunityIcons name={name} size={size} color={color} />;
    return null;
};

const BudgetCategoriesScreen = () => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    // Цвета в зависимости от темы
    const textColor = isDark ? "#F9FAFB" : "#111827";
    const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
    const borderColor = isDark ? "#374151" : "#E5E7EB";
    const iconColor = isDark ? "#9CA3AF" : "#6B7280";
    const addButtonBg = isDark ? "#2563EB" : "#2563EB"; // можно изменить под тёмную тему, если нужно
    const addButtonTextColor = "#FFFFFF";
    const predefinedButtonBg = isDark ? "#1F2937" : "#F3F4F6";
    const predefinedButtonTextColor = isDark ? "#D1D5DB" : "#374151";

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                <Text style={[styles.sectionTitle, { color: subTextColor }]}>ESSENTIAL EXPENSES</Text>
                {essentialExpenses.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={[styles.listItem, { borderBottomColor: borderColor }]}
                    >
                        <IconRenderer lib={item.lib} name={item.icon} size={22} color={iconColor} />
                        <Text style={[styles.listText, { color: textColor }]}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? "#6B7280" : "#D1D5DB"} />
                    </TouchableOpacity>
                ))}

                <Text style={[styles.sectionTitle, { color: subTextColor }]}>LIFESTYLE</Text>
                {lifestyle.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={[styles.listItem, { borderBottomColor: borderColor }]}
                    >
                        <IconRenderer lib={item.lib} name={item.icon} size={22} color={iconColor} />
                        <Text style={[styles.listText, { color: textColor }]}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? "#6B7280" : "#D1D5DB"} />
                    </TouchableOpacity>
                ))}

                <Text style={[styles.sectionTitle, { color: subTextColor }]}>SAVINGS & INVESTMENTS</Text>
                {savingsInvestments.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={[styles.listItem, { borderBottomColor: borderColor }]}
                    >
                        <IconRenderer lib={item.lib} name={item.icon} size={22} color={iconColor} />
                        <Text style={[styles.listText, { color: textColor }]}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? "#6B7280" : "#D1D5DB"} />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={[styles.addButton, { backgroundColor: addButtonBg }]}>
                    <Ionicons name="add" size={20} color={addButtonTextColor} />
                    <Text style={[styles.addButtonText, { color: addButtonTextColor }]}>Add New Category</Text>
                </TouchableOpacity>

                <Text style={[styles.predefinedTitle, { color: subTextColor }]}>PREDEFINED CATEGORIES</Text>
                <View style={styles.predefinedGrid}>
                    {predefinedCategories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.predefinedButton, { backgroundColor: predefinedButtonBg }]}
                        >
                            <Text style={[styles.predefinedButtonText, { color: predefinedButtonTextColor }]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
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
    scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 20,
        marginBottom: 12,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        paddingVertical: 12,
    },
    listText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
    },
    addButton: {
        flexDirection: "row",
        borderRadius: 8,
        paddingVertical: 14,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 30,
    },
    addButtonText: {
        fontWeight: "600",
        fontSize: 16,
        marginLeft: 8,
    },
    predefinedTitle: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 12,
    },
    predefinedGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    predefinedButton: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 18,
        marginBottom: 12,
        width: "48%",
        alignItems: "center",
    },
    predefinedButtonText: {
        fontWeight: "600",
        fontSize: 14,
    },
});

export default BudgetCategoriesScreen;