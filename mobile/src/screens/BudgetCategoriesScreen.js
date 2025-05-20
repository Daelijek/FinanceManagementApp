import React, { useContext, useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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

const IconRenderer = ({ name, color, size }) => (
    <Ionicons name={name} size={size} color={color} />
);

const AddCategoryModal = ({
    visible,
    onClose,
    onSave,
    onDelete,
    isDark,
    category,
    isSystemCategory,
    existingCategories,
}) => {
    const [categoryType, setCategoryType] = useState(
        category?.category_type || "expense"
    );
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

    useEffect(() => {
        setCategoryType(category?.category_type || "expense");
        setName(category?.name || "");
        setDescription(category?.description || "");
        setIcon(category?.icon || "");
        setColor(category?.color || "");
    }, [category]);

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert("Error", "Please enter the category name..");
            return;
        }
        if (!icon) {
            Alert.alert("Error", "Please select the icon.");
            return;
        }
        if (!color) {
            Alert.alert("Error", "Please choose a color.");
            return;
        }

        const duplicate = existingCategories.find(
            (c) =>
                c.name.trim().toLowerCase() === name.trim().toLowerCase() &&
                c.category_type === categoryType &&
                c.id !== category?.id
        );

        if (duplicate) {
            Alert.alert(
                "Error",
                `A category with a name "${name.trim()}" already exists for the type"${categoryType === "income" ? "Income" : "Expenses"
                }".`
            );
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
        Alert.alert("Delete a category", "Are you sure you want to delete this category?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    if (onDelete && category) onDelete(category);
                    onClose();
                },
            },
        ]);
    };

    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: bgColor, borderColor }]}>
                    <Text style={[styles.modalTitle, { color: textColor }]}>
                        {category ? "Edit a category" : "Add a new category"}
                    </Text>

                    <View style={styles.categoryTypeSwitchContainer}>
                        <TouchableOpacity
                            style={[
                                styles.categoryTypeButton,
                                categoryType === "income" && styles.categoryTypeButtonActive,
                                { borderColor: categoryType === "income" ? "#10B981" : borderColor },
                            ]}
                            onPress={() => setCategoryType("income")}
                            activeOpacity={0.8}
                            disabled={isSystemCategory}
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
                            disabled={isSystemCategory}
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
                        editable={!isSystemCategory}
                    />
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: inputTextColor, borderColor }]}
                        placeholder="Description"
                        placeholderTextColor={placeholderColor}
                        value={description}
                        onChangeText={setDescription}
                        editable={!isSystemCategory}
                    />

                    <Text style={[styles.selectorLabel, { color: textColor, marginTop: 10 }]}>Выберите иконку</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                        {iconOptions.map((iconName) => (
                            <TouchableOpacity
                                key={iconName}
                                onPress={() => setIcon(iconName)}
                                style={[
                                    styles.iconOption,
                                    icon === iconName && { borderColor: color || "#2563EB", borderWidth: 2 },
                                ]}
                                disabled={isSystemCategory}
                            >
                                <IconRenderer name={iconName} size={32} color={color || (isDark ? "#F9FAFB" : "#111827")} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.selectorLabel, { color: textColor }]}>Выберите цвет</Text>
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
                                disabled={isSystemCategory}
                            />
                        ))}
                    </View>

                    <View style={styles.modalButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalCancelButton]}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        {!isSystemCategory && category && (
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

    const scrollViewRef = useRef(null);
    const incomeListRef = useRef(null);
    const expenseListRef = useRef(null);

    const [categories, setCategories] = useState({ income: [], expense: [] });
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [token, setToken] = useState(null);

    const textColor = isDark ? "#F9FAFB" : "#111827";
    const borderColor = isDark ? "#374151" : "#E5E7EB";
    const iconColor = isDark ? "#9CA3AF" : "#6B7280";
    const addButtonBg = "#2563EB";
    const addButtonTextColor = "#FFFFFF";

    useEffect(() => {
        const loadToken = async () => {
            const savedToken = await AsyncStorage.getItem("token");
            setToken(savedToken);
        };
        loadToken();
    }, []);

    useEffect(() => {
        if (!token) return;

        const fetchCategories = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/v1/categories/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Error загрузки: ${response.status}`);
                }

                const data = await response.json();

                const incomeCats = (data.income_categories || []).sort((a, b) => a.position - b.position);
                const expenseCats = (data.expense_categories || []).sort((a, b) => a.position - b.position);

                setCategories({ income: incomeCats, expense: expenseCats });
            } catch (error) {
                Alert.alert("Error", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [token]);

    const handleSaveCategory = async (cat) => {
        if (!token) {
            Alert.alert("Error", "Токен не найден. Пожалуйста, войдите заново.");
            return;
        }

        try {
            let response;
            if (cat.id) {
                response = await fetch(`${API_URL}/api/v1/categories/${cat.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: cat.name,
                        description: cat.description,
                        icon: cat.icon,
                        color: cat.color,
                        category_type: cat.category_type,
                        position: cat.position,
                    }),
                });
            } else {
                response = await fetch(`${API_URL}/api/v1/categories/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: cat.name,
                        description: cat.description,
                        icon: cat.icon,
                        color: cat.color,
                        category_type: cat.category_type,
                        position: cat.position,
                    }),
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error сохранения: ${errorText}`);
            }

            const savedCategory = await response.json();
            const savedCategoryWithFlag = {
                ...savedCategory,
                is_system: savedCategory.is_system ?? false,
            };

            setCategories((prev) => {
                const type = savedCategoryWithFlag.category_type;
                const updatedList = prev[type] ? [...prev[type]] : [];

                if (cat.id) {
                    const index = updatedList.findIndex((c) => c.id === savedCategoryWithFlag.id);
                    if (index !== -1) updatedList[index] = savedCategoryWithFlag;
                    else updatedList.push(savedCategoryWithFlag);
                } else {
                    updatedList.push(savedCategoryWithFlag);
                }

                return { ...prev, [type]: updatedList.sort((a, b) => a.position - b.position) };
            });

            setModalVisible(false);
            setEditingCategory(null);
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    const handleDeleteCategory = async (cat) => {
        if (!token) {
            Alert.alert("Error", "Токен не найден. Пожалуйста, войдите заново.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/v1/categories/${cat.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error удаления: ${errorText}`);
            }

            setCategories((prev) => {
                const type = cat.category_type;
                const updatedList = prev[type].filter((c) => c.id !== cat.id);
                return { ...prev, [type]: updatedList };
            });

            setModalVisible(false);
            setEditingCategory(null);
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    const handleDragEnd = async (categoryType, { data }) => {
        setCategories((prev) => ({ ...prev, [categoryType]: data }));

        if (!token) {
            Alert.alert("Error", "Токен не найден. Пожалуйста, войдите заново.");
            return;
        }

        try {
            await Promise.all(
                data.map((cat, index) =>
                    fetch(`${API_URL}/api/v1/categories/${cat.id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ ...cat, position: index }),
                    })
                )
            );

            setCategories((prev) => ({
                ...prev,
                [categoryType]: prev[categoryType].map((cat, index) => ({ ...cat, position: index })),
            }));
        } catch {
            Alert.alert("Error", "Не удалось сохранить порядок категорий.");
        }
    };

    if (loading) {
        return (
            <SafeAreaView
                style={[
                    styles.container,
                    isDark && styles.containerDark,
                    { justifyContent: "center", alignItems: "center" },
                ]}
            >
                <ActivityIndicator size="large" color={addButtonBg} />
            </SafeAreaView>
        );
    }

    const renderCategoryItem = (categoryType) => ({ item, drag, isActive }) => {
        const isSystem = item.is_system === true;
        return (
            <TouchableOpacity
                style={[
                    styles.listItem,
                    {
                        borderBottomColor: borderColor,
                        backgroundColor: isActive ? (isDark ? "#374151" : "#e0e0e0") : "transparent",
                        opacity: isSystem ? 0.6 : 1,
                    },
                ]}
                onLongPress={!isSystem ? drag : null}
                onPress={() => {
                    if (!isSystem) {
                        setEditingCategory(item);
                        setModalVisible(true);
                    }
                }}
                activeOpacity={isSystem ? 1 : 0.8}
                disabled={isSystem}
            >
                <IconRenderer name={item.icon} size={22} color={iconColor} />
                <Text style={[styles.listText, { color: textColor }]}>{item.name}</Text>
                <Ionicons name="menu" size={24} color={iconColor} />
            </TouchableOpacity>
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                >
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Income</Text>
                    <DraggableFlatList
                        ref={incomeListRef}
                        data={categories.income || []}
                        keyExtractor={(item) => item.id?.toString() || item.key}
                        renderItem={renderCategoryItem("income")}
                        onDragEnd={(params) => handleDragEnd("income", params)}
                        scrollEnabled={false}
                        nestedScrollEnabled={false}
                        simultaneousHandlers={scrollViewRef}
                        style={{ height: (categories.income?.length || 1) * 56 }}
                    />

                    <Text style={[styles.sectionTitle, { color: textColor, marginTop: 30 }]}>Expenses</Text>
                    <DraggableFlatList
                        ref={expenseListRef}
                        data={categories.expense || []}
                        keyExtractor={(item) => item.id?.toString() || item.key}
                        renderItem={renderCategoryItem("expense")}
                        onDragEnd={(params) => handleDragEnd("expense", params)}
                        scrollEnabled={false}
                        nestedScrollEnabled={false}
                        simultaneousHandlers={scrollViewRef}
                        style={{ height: (categories.expense?.length || 1) * 56 }}
                    />

                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: addButtonBg }]}
                        onPress={() => {
                            setEditingCategory(null);
                            setModalVisible(true);
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={20} color={addButtonTextColor} />
                        <Text style={[styles.addButtonText, { color: addButtonTextColor }]}>Add Category</Text>
                    </TouchableOpacity>
                </ScrollView>

                <AddCategoryModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSave={handleSaveCategory}
                    onDelete={handleDeleteCategory}
                    isDark={isDark}
                    category={editingCategory}
                    isSystemCategory={editingCategory?.is_system}
                    existingCategories={[...(categories.income || []), ...(categories.expense || [])]}
                />
            </SafeAreaView>
        </GestureHandlerRootView>
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
        paddingTop: 10,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginHorizontal: 20,
        marginTop: 15,
        marginBottom: 10,
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
        marginHorizontal: 20,
        marginVertical: 20,
    },
    addButtonText: {
        fontWeight: "600",
        fontSize: 16,
        marginLeft: 8,
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