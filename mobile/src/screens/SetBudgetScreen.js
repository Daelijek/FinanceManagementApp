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

// Утилита для обработки ошибок API
const handleApiError = (error, context, t) => {
    console.error(`Error in ${context}:`, error);

    let message = 'An unexpected error occurred';

    if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        message = 'Network error. Please check your connection.';
    } else if (error.message.includes('401')) {
        message = 'Authentication expired. Please log in again.';
    } else if (error.message.includes('403')) {
        message = 'You do not have permission to perform this action.';
    } else if (error.message.includes('404')) {
        message = 'Resource not found.';
    } else if (error.message.includes('500')) {
        message = 'Server error. Please try again later.';
    } else if (error.message) {
        message = error.message;
    }

    Alert.alert(t('common.error'), message);
};

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
                    // Фильтруем категории, исключая те, для которых уже есть бюджеты
                    const filtered = data.filter(
                        (cat) => !existingCategories.some((ec) => ec.id === cat.id)
                    );
                    setCategories(filtered);

                    // Если нет доступных категорий, показываем сообщение
                    if (filtered.length === 0) {
                        Alert.alert(
                            t('create_budget.all_categories_have_budgets'),
                            t('create_budget.all_categories_subtitle'),
                            [
                                {
                                    text: t('common.confirm'),
                                    onPress: onClose
                                }
                            ]
                        );
                    }
                })
                .catch((err) => {
                    handleApiError(err, 'load categories', t);
                })
                .finally(() => setLoadingCategories(false));
        } else {
            // Reset state when modal closes
            setSelectedCategory(null);
            setBudgetAmount("");
            setSaving(false);
        }
    }, [visible, existingCategories, t, onClose]);

    // Получение первого и последнего дня текущего месяца в формате YYYY-MM-DD
    const getStartDate = () => {
        const now = new Date();
        return now.toISOString().split("T")[0]; // Текущая дата
    };

    const getEndDate = () => {
        const now = new Date();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return lastDayOfMonth.toISOString().split("T")[0]; // Последний день месяца
    };

    const IconCmp = (iconName) =>
        iconName && iconName.startsWith("piggy-bank")
            ? MaterialCommunityIcons
            : Ionicons;

    const validateBudgetAmount = (amount) => {
        const numAmount = parseFloat(amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            return { isValid: false, message: t('create_budget.valid_amount') };
        }

        if (numAmount > 1000000) {
            return { isValid: false, message: 'Budget amount is too large (max: $1,000,000)' };
        }

        return { isValid: true };
    };

    const handleSave = async () => {
        if (!selectedCategory) {
            Alert.alert(t("common.error"), t('create_budget.select_category'));
            return;
        }

        const validation = validateBudgetAmount(budgetAmount);
        if (!validation.isValid) {
            Alert.alert(t("common.error"), validation.message);
            return;
        }

        const amount = parseFloat(budgetAmount);

        setSaving(true);
        try {
            const body = {
                category_id: selectedCategory.id,
                amount,
                period: "monthly",
                start_date: getStartDate(), // Дата создания бюджета (сегодня)
                end_date: getEndDate(),     // Последний день текущего месяца
            };

            const response = await apiFetch("/api/v1/budgets/", {
                method: "POST",
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail?.[0]?.msg ||
                    errorData.detail ||
                    "Failed to save budget";
                throw new Error(errorMessage);
            }

            const newBudgetFromApi = await response.json();

            const newBudget = {
                id: newBudgetFromApi.category_id,
                name: selectedCategory.name,
                icon: selectedCategory.icon,
                color: selectedCategory.color,
                budget: newBudgetFromApi.amount,
                spent: newBudgetFromApi.spent_amount || 0,
                iconBg: selectedCategory.color + "33",
                apiId: newBudgetFromApi.id,
            };

            await onSave(newBudget);
            onClose();

            Alert.alert(t("common.success"), t('create_budget.budget_created'));
        } catch (error) {
            handleApiError(error, 'create budget', t);
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
        loadingContainer: {
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 40,
        },
        emptyContainer: {
            alignItems: "center",
            paddingVertical: 40,
        },
        emptyText: {
            fontSize: 16,
            color: isDark ? "#9CA3AF" : "#6B7280",
            textAlign: "center",
            marginTop: 16,
        },
    });

    if (loadingCategories) {
        return (
            <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
                <View style={modalStyles.modalOverlay}>
                    <View style={modalStyles.modalContainer}>
                        <View style={modalStyles.loadingContainer}>
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text style={[modalStyles.emptyText, { marginTop: 16 }]}>
                                Loading categories...
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <Pressable style={modalStyles.modalOverlay} onPress={onClose}>
                <Pressable style={modalStyles.modalContainer} onPress={(e) => e.stopPropagation()}>
                    <View style={modalStyles.modalHeader}>
                        <Text style={modalStyles.modalTitle}>{t('create_budget.title')}</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Ionicons name="close" size={24} color={isDark ? "#F9FAFB" : "#111827"} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={modalStyles.amountSection}>
                            <Text style={modalStyles.sectionTitle}>{t('create_budget.budget_amount')}</Text>
                            <View style={modalStyles.amountContainer}>
                                <Text style={modalStyles.currencySymbol}>$</Text>
                                <TextInput
                                    style={modalStyles.amountInput}
                                    value={budgetAmount}
                                    returnKeyType="done"
                                    onChangeText={setBudgetAmount}
                                    placeholder="0"
                                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                            </View>
                        </View>

                        {categories.length === 0 ? (
                            <View style={modalStyles.emptyContainer}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={48}
                                    color={isDark ? "#10B981" : "#10B981"}
                                />
                                <Text style={modalStyles.emptyText}>
                                    {t('create_budget.all_categories_have_budgets')}
                                </Text>
                            </View>
                        ) : (
                            <View>
                                <Text style={modalStyles.sectionTitle}>{t('create_budget.select_category')}</Text>
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
                                                activeOpacity={0.7}
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
                        )}
                    </ScrollView>

                    <View style={modalStyles.modalButtons}>
                        <TouchableOpacity
                            style={[modalStyles.modalButton, modalStyles.cancelButton]}
                            onPress={onClose}
                            disabled={saving}
                        >
                            <Text style={modalStyles.cancelButtonText}>{t("common.cancel")}</Text>
                        </TouchableOpacity>

                        {categories.length > 0 && (
                            <TouchableOpacity
                                style={[
                                    modalStyles.modalButton,
                                    modalStyles.saveButton,
                                    (!selectedCategory || !budgetAmount || saving) && modalStyles.saveButtonDisabled,
                                ]}
                                onPress={handleSave}
                                disabled={saving || !selectedCategory || !budgetAmount}
                                activeOpacity={0.7}
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
                        )}
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
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [categories, setCategories] = useState([]);
    const [updatingCategories, setUpdatingCategories] = useState(new Set());

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
                handleApiError(error, 'fetch budget', t);
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

        // Валидация
        if (budget < 0) {
            Alert.alert(t('common.error'), 'Budget amount cannot be negative');
            return;
        }

        if (budget > 1000000) {
            Alert.alert(t('common.error'), 'Budget amount is too large (max: $1,000,000)');
            return;
        }

        const originalCategory = categories.find((cat) => cat.id === categoryId);
        if (!originalCategory) return;

        setCategories((prev) =>
            prev.map((cat) => (cat.id === categoryId ? { ...cat, budget } : cat))
        );

        setUpdatingCategories(prev => new Set([...prev, categoryId]));

        try {
            if (!originalCategory.apiId) {
                throw new Error("Budget ID not found");
            }

            const now = new Date();

            // start_date остается оригинальной датой создания (не меняем)
            // end_date всегда последний день текущего месяца
            const end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                .toISOString()
                .split("T")[0];

            const body = {
                amount: budget,
                period: "monthly",
                // start_date НЕ передаем, чтобы не менять оригинальную дату создания
                end_date, // Обновляем только end_date
                is_active: true,
            };

            const response = await apiFetch(`/api/v1/budgets/${originalCategory.apiId}`, {
                method: "PUT",
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail?.[0]?.msg ||
                    errorData.detail ||
                    "Failed to update budget";
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Error updating budget:', error);

            setCategories((prev) =>
                prev.map((cat) =>
                    cat.id === categoryId
                        ? { ...cat, budget: originalCategory.budget }
                        : cat
                )
            );

            handleApiError(error, 'update budget', t);
        } finally {
            setUpdatingCategories(prev => {
                const newSet = new Set(prev);
                newSet.delete(categoryId);
                return newSet;
            });
        }
    };

    const addNewCategory = () => {
        setShowCreateModal(true);
    };

    const handleCreateBudget = async (newBudget) => {
        // Оптимистичное обновление - добавляем бюджет сразу
        setCategories((prev) => [...prev, newBudget]);
    };

    if (loading) {
        return (
            <SafeAreaView
                style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
            >
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={[styles.loadingText, { marginTop: 16 }]}>
                    {t('common.loading')}
                </Text>
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
                                progress={Math.min(percentage / 100, 1)}
                                showsText={true}
                                formatText={() => `${percentage}%`}
                                color={percentage > 90 ? "#EF4444" : "#2563EB"}
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
                            <Text style={[
                                styles.summaryUsed,
                                { color: percentage > 90 ? "#EF4444" : "#2563EB" }
                            ]}>
                                {percentage}% {t("set_budget.used")}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Budget Categories */}
                <View style={styles.categoriesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t("set_budget.budget_categories")}</Text>
                        <TouchableOpacity onPress={addNewCategory} activeOpacity={0.7}>
                            <Ionicons name="add" size={24} color="#2563EB" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.categoriesList}>
                        {categories.map((category) => {
                            const progress = category.budget > 0 ? category.spent / category.budget : 0;
                            const isOverBudget = category.spent > category.budget;
                            const isUpdating = updatingCategories.has(category.id);
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
                                                style={[
                                                    styles.categoryBudgetInput,
                                                    isUpdating && { opacity: 0.6 }
                                                ]}
                                                value={category.budget.toString()}
                                                onChangeText={(text) => updateCategoryBudget(category.id, text)}
                                                keyboardType="numeric"
                                                selectTextOnFocus={true}
                                                editable={!isUpdating}
                                                maxLength={10}
                                            />
                                            {isUpdating && (
                                                <ActivityIndicator
                                                    size="small"
                                                    color="#2563EB"
                                                    style={{ marginLeft: 8 }}
                                                />
                                            )}
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

                                    {isOverBudget && (
                                        <View style={styles.overBudgetWarning}>
                                            <Ionicons name="warning" size={16} color="#EF4444" />
                                            <Text style={styles.overBudgetText}>
                                                Over budget by ${(category.spent - category.budget).toFixed(2)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* Add New Category Button */}
                    <TouchableOpacity
                        style={styles.addCategoryButton}
                        onPress={addNewCategory}
                        activeOpacity={0.7}
                    >
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
                                    {remaining >= 0 ? '+' : '-'}${Math.abs(remaining).toLocaleString()}
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
                            progress={Math.min(percentage / 100, 1)}
                            color={percentage > 90 ? "#EF4444" : "#2563EB"}
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
        content: {
            flex: 1,
            paddingHorizontal: 20,
        },
        loadingText: {
            fontSize: 16,
            color: isDark ? "#F9FAFB" : "#111827",
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
            borderBottomWidth: 1,
            borderBottomColor: "transparent",
        },
        categoryProgress: {
            marginTop: 4,
        },
        overBudgetWarning: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: "#FEE2E2",
            borderRadius: 6,
        },
        overBudgetText: {
            fontSize: 12,
            color: "#EF4444",
            fontWeight: "500",
            marginLeft: 4,
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
    });

export default SetBudgetScreen;