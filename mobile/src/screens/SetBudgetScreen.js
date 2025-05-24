// src/screens/SetBudgetScreen.js

import React, { useState, useEffect, useContext } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "../context/ThemeContext";
import { apiFetch } from "../api";

// Модальное окно создания бюджета
const CreateBudgetModal = ({ visible, onClose, onSave, existingCategories = [] }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [budgetAmount, setBudgetAmount] = useState("");
    const [saving, setSaving] = useState(false);

    // Загрузка категорий расходов с API
    useEffect(() => {
        if (visible) {
            setLoadingCategories(true);
            apiFetch("/api/v1/categories/expense")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to load categories");
                    return res.json();
                })
                .then((data) => {
                    const filtered = data.filter(
                        (cat) => !existingCategories.some((ec) => ec.id === cat.id)
                    );
                    setCategories(filtered);
                })
                .catch((err) => {
                    Alert.alert(t("common.error"), err.message);
                })
                .finally(() => setLoadingCategories(false));
        } else {
            setSelectedCategory(null);
            setBudgetAmount("");
        }
    }, [visible, existingCategories, t]);

    // Получение первого и последнего дня текущего месяца в формате YYYY-MM-DD
    const getStartDate = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0];
    };
    const getEndDate = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .split("T")[0];
    };

    const IconCmp = (iconName) =>
        iconName && iconName.startsWith("piggy-bank")
            ? MaterialCommunityIcons
            : Ionicons;

    const handleSave = async () => {
        if (!selectedCategory) {
            Alert.alert(t("common.error"), "Please select a category");
            return;
        }

        const amount = parseFloat(budgetAmount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert(t("common.error"), "Please enter a valid amount");
            return;
        }

        setSaving(true);
        try {
            const body = {
                category_id: selectedCategory.id,
                amount,
                period: "monthly",
                start_date: getStartDate(),
                end_date: getEndDate(),
            };

            const response = await apiFetch("/api/v1/budgets/", {
                method: "POST",
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail?.[0]?.msg || "Failed to save budget");
            }

            const newBudgetFromApi = await response.json();

            const newBudget = {
                id: newBudgetFromApi.category_id,
                name: selectedCategory.name,
                icon: selectedCategory.icon,
                color: selectedCategory.color,
                budget: newBudgetFromApi.amount,
                spent: newBudgetFromApi.spent_amount,
                iconBg: selectedCategory.color + "33",
                apiId: newBudgetFromApi.id,
            };

            await onSave(newBudget);
            onClose();
        } catch (error) {
            Alert.alert(t("common.error"), error.message);
        } finally {
            setSaving(false);
        }
    };

    const modalStyles = StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
        },
        modalContainer: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 16,
            padding: 24,
            width: "90%",
            maxHeight: "80%",
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        closeButton: {
            padding: 4,
        },
        amountSection: {
            marginBottom: 24,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
            marginBottom: 12,
        },
        amountContainer: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "#374151" : "#F3F4F6",
            borderRadius: 12,
            padding: 16,
        },
        currencySymbol: {
            fontSize: 24,
            fontWeight: "600",
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginRight: 8,
        },
        amountInput: {
            flex: 1,
            fontSize: 24,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
            padding: 0,
        },
        categoriesGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
        },
        categoryCard: {
            width: "48%",
            backgroundColor: isDark ? "#374151" : "#F9FAFB",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            borderWidth: 2,
            borderColor: "transparent",
            marginBottom: 12,
        },
        categoryCardSelected: {
            borderColor: "#2563EB",
            backgroundColor: isDark ? "#1E3A8A" : "#EFF6FF",
        },
        categoryIcon: {
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 8,
        },
        categoryName: {
            fontSize: 14,
            fontWeight: "500",
            color: isDark ? "#F9FAFB" : "#111827",
            textAlign: "center",
        },
        modalButtons: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 24,
            gap: 12,
        },
        modalButton: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: "center",
        },
        cancelButton: {
            backgroundColor: isDark ? "#374151" : "#E5E7EB",
        },
        saveButton: {
            backgroundColor: "#2563EB",
        },
        saveButtonDisabled: {
            backgroundColor: isDark ? "#374151" : "#E5E7EB",
        },
        cancelButtonText: {
            color: isDark ? "#9CA3AF" : "#6B7280",
            fontWeight: "500",
        },
        saveButtonText: {
            color: "#FFFFFF",
            fontWeight: "600",
        },
        saveButtonTextDisabled: {
            color: isDark ? "#6B7280" : "#9CA3AF",
        },
    });

    if (loadingCategories) {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <View
                    style={[
                        modalStyles.modalOverlay,
                        { justifyContent: "center", alignItems: "center" },
                    ]}
                >
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <Pressable style={modalStyles.modalOverlay} onPress={onClose}>
                <Pressable style={modalStyles.modalContainer} onPress={(e) => e.stopPropagation()}>
                    <View style={modalStyles.modalHeader}>
                        <Text style={modalStyles.modalTitle}>Create Budget</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Ionicons name="close" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={modalStyles.amountSection}>
                            <Text style={modalStyles.sectionTitle}>Budget Amount</Text>
                            <View style={modalStyles.amountContainer}>
                                <Text style={modalStyles.currencySymbol}>$</Text>
                                <TextInput
                                    style={modalStyles.amountInput}
                                    value={budgetAmount}
                                    onChangeText={setBudgetAmount}
                                    placeholder="0"
                                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View>
                            <Text style={modalStyles.sectionTitle}>Select Category</Text>
                            <View style={modalStyles.categoriesGrid}>
                                {categories.map((category) => {
                                    const Icon = IconCmp(category.icon);
                                    const isSelected = selectedCategory?.id === category.id;
                                    return (
                                        <TouchableOpacity
                                            key={category.id}
                                            style={[
                                                modalStyles.categoryCard,
                                                isSelected && modalStyles.categoryCardSelected,
                                            ]}
                                            onPress={() => setSelectedCategory(category)}
                                        >
                                            <View style={[modalStyles.categoryIcon, { backgroundColor: category.color + "33" }]}>
                                                <Icon name={category.icon} size={20} color={category.color} />
                                            </View>
                                            <Text style={modalStyles.categoryName}>{category.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={modalStyles.modalButtons}>
                        <TouchableOpacity style={[modalStyles.modalButton, modalStyles.cancelButton]} onPress={onClose}>
                            <Text style={modalStyles.cancelButtonText}>{t("common.cancel")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                modalStyles.modalButton,
                                modalStyles.saveButton,
                                (!selectedCategory || !budgetAmount) && modalStyles.saveButtonDisabled,
                            ]}
                            onPress={handleSave}
                            disabled={saving || !selectedCategory || !budgetAmount}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text
                                    style={[
                                        modalStyles.saveButtonText,
                                        (!selectedCategory || !budgetAmount) && modalStyles.saveButtonTextDisabled,
                                    ]}
                                >
                                    {t("common.save")}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const IconCmp = (iconName) =>
    iconName && iconName.startsWith("piggy-bank") ? MaterialCommunityIcons : Ionicons;

const SetBudgetScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const styles = getThemedStyles(isDark);

    const [totalBudget, setTotalBudget] = useState(0);
    const [spent, setSpent] = useState(0);
    const [remaining, setRemaining] = useState(0);
    const [percentage, setPercentage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [categories, setCategories] = useState([]);

    // Загрузка текущего бюджета с сервера
    useEffect(() => {
        const fetchCurrentMonthBudget = async () => {
            setLoading(true);
            try {
                const response = await apiFetch("/api/v1/budgets/current-month");
                if (!response.ok) throw new Error("Failed to fetch budget");
                const data = await response.json();

                const categoriesFromApi = data.budgets_by_category.map((cat) => ({
                    id: cat.category_id,
                    name: cat.category_name,
                    icon: cat.category_icon,
                    color: cat.category_color,
                    budget: cat.amount,
                    spent: cat.spent_amount,
                    iconBg: cat.category_color + "33",
                    apiId: cat.id,
                }));

                setCategories(categoriesFromApi);
            } catch (error) {
                Alert.alert(t("common.error"), error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentMonthBudget();
    }, [t]);

    useEffect(() => {
        const totalCategoryBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
        const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
        const remaining = totalCategoryBudget - totalSpent;
        const percentage = totalCategoryBudget > 0 ? Math.round((totalSpent / totalCategoryBudget) * 100) : 0;

        setTotalBudget(totalCategoryBudget);
        setSpent(totalSpent);
        setRemaining(remaining);
        setPercentage(percentage);
    }, [categories]);

    const updateCategoryBudget = async (categoryId, newBudgetValue) => {
        const budget = parseFloat(newBudgetValue) || 0;

        setCategories((prev) =>
            prev.map((cat) => (cat.id === categoryId ? { ...cat, budget } : cat))
        );

        try {
            const category = categories.find((cat) => cat.id === categoryId);
            if (!category || !category.apiId) return;

            const now = new Date();
            const start_date = new Date(now.getFullYear(), now.getMonth(), 1)
                .toISOString()
                .split("T")[0];
            const end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                .toISOString()
                .split("T")[0];

            const body = {
                amount: budget,
                period: "monthly",
                start_date,
                end_date,
                is_active: true,
            };

            const response = await apiFetch(`/api/v1/budgets/${category.apiId}`, {
                method: "PUT",
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail?.[0]?.msg || "Failed to update budget");
            }
        } catch (error) {
            Alert.alert(t("common.error"), error.message);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            Alert.alert(t("common.success"), "Budget saved successfully!", [
                {
                    text: t("common.confirm"),
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error) {
            Alert.alert(t("common.error"), "Failed to save budget");
        } finally {
            setSaving(false);
        }
    };

    const addNewCategory = () => {
        setShowCreateModal(true);
    };

    const handleCreateBudget = async (newBudget) => {
        setCategories((prev) => [...prev, newBudget]);
        Alert.alert(t("common.success"), "Budget created successfully!");
    };

    if (loading) {
        return (
            <SafeAreaView
                style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
            >
                <ActivityIndicator size="large" color="#2563EB" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Monthly Budget Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.percentageContainer}>
                            <Progress.Circle
                                size={60}
                                progress={percentage / 100}
                                showsText={true}
                                formatText={() => `${percentage}%`}
                                color="#2563EB"
                                unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                                borderWidth={0}
                                thickness={6}
                                textStyle={[styles.percentageText, isDark && { color: "#F9FAFB" }]}
                            />
                        </View>
                        <View style={styles.summaryInfo}>
                            <Text style={styles.summaryLabel}>{t("set_budget.monthly_budget")}</Text>
                            <Text style={styles.summaryAmount}>
                                ${spent.toLocaleString()} / ${totalBudget.toLocaleString()}
                            </Text>
                            <Text style={styles.summaryUsed}>{percentage}% {t("set_budget.used")}</Text>
                        </View>
                    </View>
                </View>

                {/* Budget Categories */}
                <View style={styles.categoriesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t("set_budget.budget_categories")}</Text>
                        <TouchableOpacity onPress={addNewCategory}>
                            <Ionicons name="add" size={24} color="#2563EB" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.categoriesList}>
                        {categories.map((category) => {
                            const progress = category.budget > 0 ? category.spent / category.budget : 0;
                            const isOverBudget = category.spent > category.budget;
                            const Icon = IconCmp(category.icon);

                            return (
                                <View key={category.id} style={styles.categoryItem}>
                                    <View style={styles.categoryHeader}>
                                        <View style={styles.categoryLeft}>
                                            <View
                                                style={[styles.categoryIcon, { backgroundColor: category.iconBg }]}
                                            >
                                                <Icon name={category.icon} size={24} color={category.color} />
                                            </View>
                                            <Text style={styles.categoryName}>{category.name}</Text>
                                        </View>

                                        <View style={styles.categoryBudgetContainer}>
                                            <Text style={styles.categorySpent}>$ {category.spent}</Text>
                                            <Text style={styles.categorySlash}> / </Text>
                                            <Text style={styles.categoryBudgetLabel}>$ </Text>
                                            <TextInput
                                                style={styles.categoryBudgetInput}
                                                value={category.budget.toString()}
                                                onChangeText={(text) => updateCategoryBudget(category.id, text)}
                                                keyboardType="numeric"
                                                selectTextOnFocus={true}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.categoryProgress}>
                                        <Progress.Bar
                                            progress={Math.min(progress, 1)}
                                            width={null}
                                            height={8}
                                            color={isOverBudget ? "#EF4444" : category.color}
                                            unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                                            borderWidth={0}
                                            borderRadius={4}
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Add New Category Button */}
                    <TouchableOpacity style={styles.addCategoryButton} onPress={addNewCategory}>
                        <Ionicons name="add" size={16} color="#2563EB" />
                        <Text style={styles.addCategoryText}>{t("set_budget.add_new_category")}</Text>
                    </TouchableOpacity>
                </View>

                {/* Total Budget Summary */}
                <View style={styles.totalSummary}>
                    <View style={[styles.totalSummaryContent, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                        <View style={{ flex: 1, paddingRight: 16 }}>
                            <View style={styles.totalItem}>
                                <Text style={styles.totalLabel}>{t("set_budget.total_budget")}</Text>
                                <Text style={styles.totalAmount}>${totalBudget.toLocaleString()}</Text>
                            </View>

                            <View style={styles.totalItem}>
                                <Text style={styles.totalLabel}>{t("set_budget.remaining")}</Text>
                                <Text
                                    style={[
                                        styles.totalAmount,
                                        { color: remaining >= 0 ? "#10B981" : "#EF4444" },
                                    ]}
                                >
                                    ${Math.abs(remaining).toLocaleString()}
                                </Text>
                            </View>

                            <View style={styles.totalItem}>
                                <Text style={styles.totalLabel}>{t("set_budget.spent")}</Text>
                                <Text style={[styles.totalAmount, { color: "#2563EB" }]}>
                                    ${spent.toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        <Progress.Circle
                            size={80}
                            progress={percentage / 100}
                            color="#2563EB"
                            unfilledColor={isDark ? "#374151" : "#F3F4F6"}
                            borderWidth={0}
                            thickness={8}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Модальное окно создания бюджета */}
            <CreateBudgetModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleCreateBudget}
                existingCategories={categories}
            />
        </SafeAreaView>
    );
};

const getThemedStyles = (isDark) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#374151" : "#E5E7EB",
        },
        backButton: {
            padding: 4,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        saveButton: {
            fontSize: 16,
            fontWeight: "500",
            color: "#2563EB",
        },
        content: {
            flex: 1,
            paddingHorizontal: 20,
        },
        summaryCard: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            marginTop: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        summaryHeader: {
            flexDirection: "row",
            alignItems: "center",
        },
        percentageContainer: {
            marginRight: 20,
        },
        percentageText: {
            fontSize: 14,
            fontWeight: "600",
            color: "#111827",
        },
        summaryInfo: {
            flex: 1,
        },
        summaryLabel: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginBottom: 4,
        },
        summaryAmount: {
            fontSize: 20,
            fontWeight: "700",
            color: isDark ? "#F9FAFB" : "#111827",
            marginBottom: 4,
        },
        summaryUsed: {
            fontSize: 14,
            color: "#2563EB",
            fontWeight: "500",
        },
        categoriesSection: {
            marginBottom: 24,
        },
        sectionHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        categoriesList: {
            gap: 16,
        },
        categoryItem: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        categoryHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
        },
        categoryLeft: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
        },
        categoryIcon: {
            width: 36,
            height: 36,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },
        categoryName: {
            fontSize: 16,
            fontWeight: "500",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        categoryBudgetContainer: {
            flexDirection: "row",
            alignItems: "center",
        },
        categorySpent: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        categorySlash: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        categoryBudgetLabel: {
            fontSize: 14,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        categoryBudgetInput: {
            fontSize: 14,
            color: isDark ? "#F9FAFB" : "#111827",
            fontWeight: "500",
            minWidth: 40,
            textAlign: "left",
            padding: 0,
        },
        categoryProgress: {
            marginTop: 4,
        },
        addCategoryButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: isDark ? "#374151" : "#E5E7EB",
            borderStyle: "dashed",
        },
        addCategoryText: {
            fontSize: 14,
            color: "#2563EB",
            fontWeight: "500",
            marginLeft: 8,
        },
        totalSummary: {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            marginBottom: 32,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        totalSummaryContent: {
            position: "relative",
        },
        totalItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
        },
        totalLabel: {
            fontSize: 16,
            color: isDark ? "#9CA3AF" : "#6B7280",
        },
        totalAmount: {
            fontSize: 18,
            fontWeight: "600",
            color: isDark ? "#F9FAFB" : "#111827",
        },
        progressCircleContainer: {
            position: "absolute",
            right: 0,
            top: "50%",
            transform: [{ translateY: -40 }],
        },
    });

export default SetBudgetScreen;
