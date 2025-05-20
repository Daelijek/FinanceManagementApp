import React, { useContext, useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";

const essentialExpensesInitial = [
    { key: "housing", label: "Housing", icon: "home-outline", lib: "Ionicons", category_type: "expense", position: 0 },
    { key: "transportation", label: "Transportation", icon: "car-outline", lib: "Ionicons", category_type: "expense", position: 1 },
    { key: "groceries", label: "Groceries", icon: "cart-outline", lib: "Ionicons", category_type: "expense", position: 2 },
    { key: "healthcare", label: "Healthcare", icon: "medkit-outline", lib: "Ionicons", category_type: "expense", position: 3 },
    { key: "utilities", label: "Utilities", icon: "flash-outline", lib: "Ionicons", category_type: "expense", position: 4 },
];

const lifestyleInitial = [
    { key: "dining", label: "Dining Out", icon: "restaurant-outline", lib: "Ionicons", category_type: "expense", position: 0 },
    { key: "entertainment", label: "Entertainment", icon: "ticket-outline", lib: "Ionicons", category_type: "expense", position: 1 },
    { key: "shopping", label: "Shopping", icon: "shirt-outline", lib: "Ionicons", category_type: "expense", position: 2 },
    { key: "fitness", label: "Fitness", icon: "barbell-outline", lib: "Ionicons", category_type: "expense", position: 3 },
    { key: "hobbies", label: "Hobbies", icon: "game-controller-outline", lib: "Ionicons", category_type: "expense", position: 4 },
];

const savingsInvestmentsInitial = [
    { key: "emergency", label: "Emergency Fund", icon: "wallet-outline", lib: "Ionicons", category_type: "expense", position: 0 },
    { key: "investments", label: "Investments", icon: "trending-up-outline", lib: "Ionicons", category_type: "expense", position: 1 },
    { key: "education", label: "Education", icon: "school-outline", lib: "Ionicons", category_type: "expense", position: 2 },
    { key: "retirement", label: "Retirement", icon: "calendar-outline", lib: "Ionicons", category_type: "expense", position: 3 },
    { key: "debt", label: "Debt Payment", icon: "card-outline", lib: "Ionicons", category_type: "expense", position: 4 },
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

const iconOptions = [
    "home-outline",
    "car-outline",
    "cart-outline",
    "medkit-outline",
    "flash-outline",
    "restaurant-outline",
    "ticket-outline",
    "shirt-outline",
    "barbell-outline",
    "game-controller-outline",
    "wallet-outline",
    "trending-up-outline",
    "school-outline",
    "calendar-outline",
    "card-outline",
];

const colorOptions = [
    "#2563EB",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#3B82F6",
    "#6B7280",
];

const AddCategoryModal = ({ visible, onClose, onSave, onDelete, isDark, category }) => {
    const [categoryType, setCategoryType] = useState(category?.category_type || "expense");
    const [name, setName] = useState(category?.name || "");
    const [description, setDescription] = useState(category?.description || "");
    const [icon, setIcon] = useState(category?.icon || "");
    const [color, setColor] = useState(category?.color || "");

    const bgColor = isDark ? "#1F2937" : "#FFFFFF";
    const textColor = isDark ? "#F9FAFB" : "#111827";
    const inputBg = isDark ? "#374151" : "#F3F4F6";
    const inputTextColor = isDark ? "#F9FAFB" : "#111827";
    const placeholderColor = isDark ? "#9CA3AF" : "#6B7280";
    const borderColor = isDark ? "#4B5563" : "#D1D5DB";

    React.useEffect(() => {
        setCategoryType(category?.category_type || "expense");
        setName(category?.name || "");
        setDescription(category?.description || "");
        setIcon(category?.icon || "");
        setColor(category?.color || "");
    }, [category]);

    const handleSave = () => {
        if (!name.trim()) {
            alert("Пожалуйста, введите название категории.");
            return;
        }
        if (!icon) {
            alert("Пожалуйста, выберите иконку.");
            return;
        }
        if (!color) {
            alert("Пожалуйста, выберите цвет.");
            return;
        }
        const newCategory = {
            ...category,
            name: name.trim(),
            description: description.trim(),
            icon,
            color,
            category_type: categoryType,
            position: category?.position ?? 0,
        };
        onSave(newCategory);
    };

    const handleDelete = () => {
        Alert.alert(
            "Удалить категорию",
            "Вы уверены, что хотите удалить эту категорию?",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Удалить",
                    style: "destructive",
                    onPress: () => {
                        if (onDelete && category) onDelete(category);
                        onClose();
                    },
                },
            ]
        );
    };

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: bgColor, borderColor }]}>
                    <Text style={[styles.modalTitle, { color: textColor }]}>
                        {category ? "Edit a category" : "Add a new category"}
                    </Text>

                    {/* Переключатель типа */}
                    <View style={styles.categoryTypeSwitchContainer}>
                        <TouchableOpacity
                            style={[
                                styles.categoryTypeButton,
                                categoryType === "income" && styles.categoryTypeButtonActive,
                                { borderColor: categoryType === "income" ? "#10B981" : borderColor },
                            ]}
                            onPress={() => setCategoryType("income")}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.categoryTypeButtonText,
                                    categoryType === "income" && { color: "#10B981", fontWeight: "700" },
                                    { color: categoryType === "income" ? "#10B981" : placeholderColor },
                                ]}
                            >
                                Income
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.categoryTypeButton,
                                categoryType === "expense" && styles.categoryTypeButtonActive,
                                { borderColor: categoryType === "expense" ? "#EF4444" : borderColor },
                            ]}
                            onPress={() => setCategoryType("expense")}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.categoryTypeButtonText,
                                    categoryType === "expense" && { color: "#EF4444", fontWeight: "700" },
                                    { color: categoryType === "expense" ? "#EF4444" : placeholderColor },
                                ]}
                            >
                                Expense
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: inputTextColor, borderColor }]}
                        placeholder="Title"
                        placeholderTextColor={placeholderColor}
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: inputTextColor, borderColor }]}
                        placeholder="Description"
                        placeholderTextColor={placeholderColor}
                        value={description}
                        onChangeText={setDescription}
                    />

                    <Text style={[styles.selectorLabel, { color: textColor, marginTop: 10 }]}>Select an icon</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                        {iconOptions.map((iconName) => (
                            <TouchableOpacity
                                key={iconName}
                                onPress={() => setIcon(iconName)}
                                style={[
                                    styles.iconOption,
                                    icon === iconName && { borderColor: color || "#2563EB", borderWidth: 2 },
                                ]}
                            >
                                <Ionicons name={iconName} size={32} color={color || (isDark ? "#F9FAFB" : "#111827")} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.selectorLabel, { color: textColor }]}>Choose a color</Text>
                    <View style={styles.colorOptionsContainer}>
                        {colorOptions.map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: c },
                                    color === c && { borderWidth: 3, borderColor: "#FFF" },
                                ]}
                                onPress={() => setColor(c)}
                            />
                        ))}
                    </View>

                    <View style={styles.modalButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalCancelButton]}
                            onPress={() => {
                                onClose();
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        {category && (
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalDeleteButton]}
                                onPress={handleDelete}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.modalDeleteText}>Delete</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalSaveButton]}
                            onPress={handleSave}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.modalSaveText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const BudgetCategoriesScreen = () => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const [categories, setCategories] = useState([
        ...essentialExpensesInitial,
        ...lifestyleInitial,
        ...savingsInvestmentsInitial,
    ]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const openEditModal = (category) => {
        setEditingCategory(category);
        setModalVisible(true);
    };

    const handleSaveCategory = (cat) => {
        if (cat.key) {
            setCategories((prev) =>
                prev.map((c) => (c.key === cat.key ? { ...c, ...cat } : c))
            );
        } else {
            const newCat = { ...cat, key: `cat-${Date.now()}`, position: categories.length };
            setCategories((prev) => [...prev, newCat]);
        }
        setModalVisible(false);
        setEditingCategory(null);
    };

    const handleDeleteCategory = (cat) => {
        setCategories((prev) => prev.filter((c) => c.key !== cat.key));
        setModalVisible(false);
        setEditingCategory(null);
    };

    const textColor = isDark ? "#F9FAFB" : "#111827";
    const subTextColor = isDark ? "#9CA3AF" : "#6B7280";
    const borderColor = isDark ? "#374151" : "#E5E7EB";
    const iconColor = isDark ? "#9CA3AF" : "#6B7280";
    const addButtonBg = "#2563EB";
    const addButtonTextColor = "#FFFFFF";
    const predefinedButtonBg = isDark ? "#1F2937" : "#F3F4F6";
    const predefinedButtonTextColor = isDark ? "#D1D5DB" : "#374151";

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={[styles.sectionTitle, { color: subTextColor }]}>All Categories</Text>
                {categories.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={[styles.listItem, { borderBottomColor: borderColor }]}
                        onPress={() => openEditModal(item)}
                    >
                        <IconRenderer lib={item.lib} name={item.icon} size={22} color={iconColor} />
                        <Text style={[styles.listText, { color: textColor }]}>{item.name || item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? "#6B7280" : "#D1D5DB"} />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: addButtonBg }]}
                    onPress={() => {
                        setEditingCategory(null);
                        setModalVisible(true);
                    }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={20} color={addButtonTextColor} />
                    <Text style={[styles.addButtonText, { color: addButtonTextColor }]}>Add New Category</Text>
                </TouchableOpacity>

                <Text style={[styles.predefinedTitle, { color: predefinedButtonTextColor }]}>PREDEFINED CATEGORIES</Text>
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

            <AddCategoryModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSaveCategory}
                onDelete={handleDeleteCategory}
                isDark={isDark}
                category={editingCategory}
            />
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

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalContainer: {
        width: "100%",
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 15,
        textAlign: "center",
    },
    input: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    selectorLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    iconOption: {
        marginRight: 12,
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "transparent",
    },
    colorOptionsContainer: {
        flexDirection: "row",
        marginBottom: 15,
    },
    colorCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: "transparent",
    },
    modalButtonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        marginHorizontal: 5,
    },
    modalCancelButton: {
        backgroundColor: "#6B7280",
    },
    modalSaveButton: {
        backgroundColor: "#2563EB",
    },
    modalCancelText: {
        color: "#F9FAFB",
        fontWeight: "600",
        fontSize: 16,
    },
    modalSaveText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 16,
    },
    modalDeleteButton: {
        backgroundColor: "#EF4444",
    },
    modalDeleteText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 16,
    },

    categoryTypeSwitchContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 15,
    },
    categoryTypeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginHorizontal: 5,
        alignItems: "center",
    },
    categoryTypeButtonActive: {
        backgroundColor: "rgba(37, 99, 235, 0.1)",
    },
    categoryTypeButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
});

export default BudgetCategoriesScreen;